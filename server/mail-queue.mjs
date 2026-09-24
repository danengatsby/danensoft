import { randomUUID } from 'node:crypto'

export const MAIL_RETRY_DELAYS = [60_000, 300_000, 900_000, 3_600_000, 21_600_000]
export const MAIL_MAX_ATTEMPTS = MAIL_RETRY_DELAYS.length + 1

/** Coada folosește aceeași conexiune și tranzacție ca mesajele de contact. */
export function createMailQueue(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mail_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('admin', 'confirmation')),
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'sent', 'failed')),
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      next_attempt_at TEXT NOT NULL,
      lease_until TEXT,
      lease_token TEXT,
      last_error TEXT,
      sent_at TEXT,
      smtp_id TEXT,
      UNIQUE(message_id, kind)
    );
    CREATE INDEX IF NOT EXISTS idx_mail_jobs_due ON mail_jobs(status, next_attempt_at);
  `)
  const insert = db.prepare(`INSERT INTO mail_jobs (message_id, kind, payload, created_at, next_attempt_at)
    VALUES (?, ?, ?, ?, ?)`)
  const claim = db.prepare(`UPDATE mail_jobs SET status = 'sending', attempts = attempts + 1,
    lease_until = ?, lease_token = ? WHERE id = (
      SELECT id FROM mail_jobs WHERE attempts < ? AND
        ((status = 'pending' AND next_attempt_at <= ?) OR (status = 'sending' AND lease_until <= ?))
      ORDER BY next_attempt_at, id LIMIT 1
    ) RETURNING *`)
  const expire = db.prepare(`UPDATE mail_jobs SET status = 'failed', lease_until = NULL, lease_token = NULL,
    last_error = 'Procesul de expediere a fost întrerupt; rezultatul ultimei încercări este necunoscut.'
    WHERE status = 'sending' AND lease_until <= ? AND attempts >= ?`)
  const renew = db.prepare(`UPDATE mail_jobs SET lease_until = ?
    WHERE id = ? AND status = 'sending' AND lease_token = ?`)
  const sent = db.prepare(`UPDATE mail_jobs SET status = 'sent', sent_at = ?, smtp_id = ?,
    last_error = NULL, lease_until = NULL, lease_token = NULL, payload = '{}'
    WHERE id = ? AND status = 'sending' AND lease_token = ?`)
  const retry = db.prepare(`UPDATE mail_jobs SET status = ?, next_attempt_at = ?, last_error = ?,
    attempts = attempts - ?, lease_until = NULL, lease_token = NULL
    WHERE id = ? AND status = 'sending' AND lease_token = ?`)
  const retryFailed = db.prepare(`UPDATE mail_jobs SET status = 'pending', attempts = 0,
    next_attempt_at = ?, last_error = NULL WHERE message_id = ? AND status = 'failed'`)

  return {
    enqueue(messageId, jobs, now = new Date()) {
      for (const { kind, mail } of jobs) {
        // Identificator stabil la reîncercare; destinatarul și conținutul sunt fixate la primire.
        const payload = { ...mail, messageId: `<${randomUUID()}@danenachesoft.space>` }
        insert.run(messageId, kind, JSON.stringify(payload), now.toISOString(), now.toISOString())
      }
    },
    claim(now, leaseMs) {
      const iso = now.toISOString()
      expire.run(iso, MAIL_MAX_ATTEMPTS)
      return claim.get(new Date(now.getTime() + leaseMs).toISOString(), randomUUID(), MAIL_MAX_ATTEMPTS, iso, iso)
    },
    renew: (job, now, leaseMs) => renew.run(new Date(now.getTime() + leaseMs).toISOString(), job.id, job.lease_token).changes > 0,
    sent: (job, smtpId, now) => sent.run(now.toISOString(), smtpId, job.id, job.lease_token),
    failed(job, now, { skipped = false } = {}) {
      const exhausted = !skipped && job.attempts >= MAIL_MAX_ATTEMPTS
      const delay = skipped ? 60_000 : (MAIL_RETRY_DELAYS[job.attempts - 1] ?? 0)
      // Nu persistăm răspunsul brut SMTP, care poate include adrese sau alte date private.
      return retry.run(exhausted ? 'failed' : 'pending', new Date(now.getTime() + delay).toISOString(),
        skipped ? 'SMTP neconfigurat.' : 'Expedierea nu a fost confirmată de serverul SMTP.',
        skipped ? 1 : 0, job.id, job.lease_token)
    },
    retryFailed: (messageId, now = new Date()) => retryFailed.run(now.toISOString(), messageId),
    forMessages(ids) {
      const grouped = new Map()
      if (!ids.length) return grouped
      const rows = db.prepare(`SELECT id, message_id, kind, status, attempts, next_attempt_at, last_error, sent_at
        FROM mail_jobs WHERE message_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`).all(...ids)
      for (const row of rows) {
        if (!grouped.has(row.message_id)) grouped.set(row.message_id, [])
        grouped.get(row.message_id).push(row)
      }
      return grouped
    },
  }
}
