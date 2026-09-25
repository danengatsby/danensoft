import { createHash, randomBytes } from 'node:crypto'
import { db, accountMailQueue, users, sessions } from './db.mjs'
import { hashPassword } from './auth.mjs'

db.exec('CREATE TABLE IF NOT EXISTS account_tokens (hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, purpose TEXT NOT NULL CHECK(purpose IN (\'verify\', \'reset\')), expires_at TEXT NOT NULL, UNIQUE(user_id, purpose))')
const digest = token => createHash('sha256').update(token).digest('hex')
export const validPassword = password => typeof password === 'string' && password.length >= 10 && password.length <= 128
export function findToken(token, purpose, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token ?? '')) return undefined
  return db.prepare('SELECT user_id FROM account_tokens WHERE hash = ? AND purpose = ? AND expires_at > ?')
    .get(digest(token), purpose, now.toISOString())
}
export function issueAccountMail(user, purpose, lang = 'ro', now = new Date()) {
  if (!['verify', 'reset'].includes(purpose)) throw new Error('Invalid token purpose')
  const token = randomBytes(32).toString('base64url')
  const base = new URL(process.env.DANEN_PUBLIC_URL ?? 'https://danenachesoft.space')
  if (base.protocol !== 'https:') throw new Error('DANEN_PUBLIC_URL must use HTTPS')
  const url = new URL(purpose === 'reset' ? '/cont/resetare' : '/cont/confirmare', base)
  url.searchParams.set('token', token)
  if (lang === 'en') url.searchParams.set('lang', lang)
  const english = lang === 'en'
  const subject = purpose === 'reset' ? (english ? 'Set your password' : 'Setarea parolei') : (english ? 'Verify your email' : 'Confirmarea adresei')
  const minutes = purpose === 'reset' ? 30 : 1440
  const text = subject + ' · Dan Enache\n\n' + url.href + '\n\n' +
    (english ? 'This single-use link expires in ' : 'Acest link poate fi folosit o singură dată și expiră în ') + minutes +
    (english ? ' minutes. If you did not request this, ignore this email.' : ' de minute. Dacă nu ați solicitat mesajul, ignorați-l.')
  db.exec('BEGIN IMMEDIATE')
  try {
    db.prepare('DELETE FROM account_tokens WHERE user_id = ? AND purpose = ?').run(user.id, purpose)
    db.prepare('DELETE FROM account_tokens WHERE expires_at <= ?').run(now.toISOString())
    db.prepare('INSERT INTO account_tokens VALUES (?, ?, ?, ?)').run(digest(token), user.id, purpose, new Date(+now + minutes * 60_000).toISOString())
    db.prepare('DELETE FROM account_mail_jobs WHERE message_id = ? AND kind = ?').run(user.id, purpose)
    accountMailQueue.enqueue(user.id, [{ kind: purpose, mail: { to: { address:user.email }, subject:subject + ' · Dan Enache', text,
      headers: { 'Auto-Submitted':'auto-generated', 'X-Auto-Response-Suppress':'All' } } }], now)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
}
export function consumeToken(token, purpose, password, now = new Date()) {
  if (purpose === 'reset' && !validPassword(password)) return false
  const hash = purpose === 'reset' ? hashPassword(password) : null
  db.exec('BEGIN IMMEDIATE')
  try {
    const row = findToken(token, purpose, now)
    if (!row) { db.exec('ROLLBACK'); return false }
    if (purpose === 'reset') {
      const user = users.byId(row.user_id)
      users.update(user.id, { passwordHash:hash, name:user.name, role:user.role })
      sessions.destroyForUser(user.id)
      db.prepare('DELETE FROM account_tokens WHERE user_id = ?').run(user.id)
      db.prepare('DELETE FROM account_mail_jobs WHERE message_id = ?').run(user.id)
    } else {
      db.prepare('DELETE FROM account_tokens WHERE hash = ?').run(digest(token))
      db.prepare('DELETE FROM account_mail_jobs WHERE message_id = ? AND kind = ?').run(row.user_id, purpose)
    }
    db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(now.toISOString(), row.user_id)
    db.exec('COMMIT')
    return true
  } catch (error) { db.exec('ROLLBACK'); throw error }
}
export function revokeAccountTokens(userId) {
  db.prepare('DELETE FROM account_tokens WHERE user_id = ?').run(userId)
  db.prepare('DELETE FROM account_mail_jobs WHERE message_id = ?').run(userId)
}
