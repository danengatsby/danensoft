// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { createMailQueue, MAIL_RETRY_DELAYS } from './mail-queue.mjs'
import { createMailWorker } from './mail-worker.mjs'

let directory, db, messages, queue, currentTime
const workers = []
const values = { name: 'Test', email: 'visitor@example.invalid', message: 'Cerere de test pentru coada SMTP.' }
const jobs = [
  { kind: 'admin', mail: { to: 'admin@example.invalid', subject: 'Cerere', text: values.message } },
  { kind: 'confirmation', mail: { to: { address: values.email }, subject: 'Confirmare', text: 'Am primit cererea.' } },
]

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'danen-queue-test-'))
  vi.stubEnv('DANEN_DB', join(directory, 'messages.db'))
  ;({ db, messages, mailQueue: queue } = await import('./db.mjs'))
})
beforeEach(() => {
  db.exec('DELETE FROM messages')
  currentTime = new Date('2030-06-15T12:00:00.000Z')
})
afterEach(async () => {
  await Promise.all(workers.splice(0).map((worker) => worker.stop()))
  vi.useRealTimers()
})
afterAll(async () => {
  db?.close()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

function seed() {
  const id = Number(messages.addWithNotifications(values, null, jobs).lastInsertRowid)
  db.prepare('UPDATE mail_jobs SET next_attempt_at = ? WHERE message_id = ?').run(currentTime.toISOString(), id)
  return id
}
const rows = () => db.prepare('SELECT * FROM mail_jobs ORDER BY id').all()
function worker(sendMail, options = {}) {
  const value = createMailWorker({ queue, sendMail, isConfigured: () => true, now: () => currentTime, ...options })
  workers.push(value)
  return value
}

it('salvează atomic cererea și două notificări independente, cu identificatori stabili', () => {
  const id = seed()
  expect(messages.list()).toHaveLength(1)
  expect(rows().map((row) => [row.message_id, row.kind, row.status, row.attempts]))
    .toEqual([[id, 'admin', 'pending', 0], [id, 'confirmation', 'pending', 0]])
  const payloads = rows().map((row) => JSON.parse(row.payload))
  expect(payloads[0]).toMatchObject(jobs[0].mail)
  expect(payloads[0].messageId).not.toBe(payloads[1].messageId)
  expect(messages.list()[0].notifications).toHaveLength(2)
})

it('anulează cererea și prima notificare dacă a doua nu poate fi persistată', () => {
  db.exec(`CREATE TRIGGER reject_confirmation BEFORE INSERT ON mail_jobs
    WHEN NEW.kind = 'confirmation' BEGIN SELECT RAISE(ABORT, 'test insert failure'); END`)
  try {
    expect(() => seed()).toThrow('test insert failure')
    expect(messages.list()).toHaveLength(0)
    expect(rows()).toHaveLength(0)
  } finally { db.exec('DROP TRIGGER reject_confirmation') }
})

it('reîncearcă doar expedierea eșuată la termen, cu același destinatar și Message-ID', async () => {
  seed()
  const send = vi.fn().mockResolvedValue({ id: 'accepted' })
    .mockResolvedValueOnce({ error: 'temporar' })
  const run = worker(send)
  await run.drain()
  expect(rows().map((row) => row.status)).toEqual(['pending', 'sent'])
  expect(rows()[0].next_attempt_at).toBe('2030-06-15T12:01:00.000Z')
  await run.drain()
  expect(send).toHaveBeenCalledTimes(2)
  currentTime = new Date(currentTime.getTime() + MAIL_RETRY_DELAYS[0])
  await run.drain()
  expect(send).toHaveBeenCalledTimes(3)
  expect(send.mock.calls[2][0]).toEqual(send.mock.calls[0][0])
  expect(rows().map((row) => row.status)).toEqual(['sent', 'sent'])
  expect(rows().map((row) => row.payload)).toEqual(['{}', '{}'])
})

it('oprește după șase încercări și permite reluarea manuală numai pentru eșecuri', async () => {
  const id = seed()
  const send = vi.fn(async (mail) => typeof mail.to === 'string' ? { error: 'temporar' } : { id: 'confirmation-ok' })
  const run = worker(send)
  await run.drain()
  for (const delay of MAIL_RETRY_DELAYS) {
    currentTime = new Date(currentTime.getTime() + delay)
    await run.drain()
  }
  expect(rows().map((row) => [row.status, row.attempts])).toEqual([['failed', 6], ['sent', 1]])
  await run.drain()
  expect(send).toHaveBeenCalledTimes(7)
  expect(queue.retryFailed(id, currentTime).changes).toBe(1)
  send.mockResolvedValue({ id: 'retry-ok' })
  await run.drain()
  expect(send).toHaveBeenCalledTimes(8)
  expect(rows().map((row) => row.status)).toEqual(['sent', 'sent'])
  expect(queue.retryFailed(id, currentTime).changes).toBe(0)
})

it('păstrează notificările când SMTP lipsește, fără să consume încercările', async () => {
  seed()
  let configured = false
  const send = vi.fn().mockResolvedValue({ id: 'ok' })
  const run = worker(send, { isConfigured: () => configured })
  await run.drain()
  expect(send).not.toHaveBeenCalled()
  expect(rows().map((row) => row.attempts)).toEqual([0, 0])
  configured = true
  await run.drain()
  expect(rows().map((row) => row.status)).toEqual(['sent', 'sent'])
})

it('nu consideră un rezultat skipped sau o excepție drept expediere reușită', async () => {
  seed()
  const send = vi.fn().mockResolvedValueOnce({ skipped: true }).mockRejectedValueOnce(new Error('date-private'))
  await worker(send).drain()
  expect(rows().map((row) => [row.status, row.attempts])).toEqual([['pending', 0], ['pending', 1]])
  expect(JSON.stringify(rows())).not.toContain('date-private')
})

it('reia notificările persistate printr-o conexiune și un procesor noi', async () => {
  seed()
  const connection = new DatabaseSync(join(directory, 'messages.db'))
  try {
    const reopenedQueue = createMailQueue(connection)
    const send = vi.fn().mockResolvedValue({ id: 'accepted-after-restart' })
    const run = worker(send, { queue: reopenedQueue })
    await run.drain()
    await run.stop()
    expect(send).toHaveBeenCalledTimes(2)
    expect(rows().map((row) => row.status)).toEqual(['sent', 'sent'])
  } finally { connection.close() }
})

it('recuperează o rezervare expirată și respinge rezultatul procesorului vechi', () => {
  seed()
  const claimed = queue.claim(currentTime, 120_000)
  const other = queue.claim(currentTime, 120_000)
  expect(other.id).not.toBe(claimed.id)
  expect(queue.claim(currentTime, 120_000)).toBeUndefined()
  currentTime = new Date(currentTime.getTime() + 120_000)
  const recovered = queue.claim(currentTime, 120_000)
  expect(recovered.id).toBe(claimed.id)
  expect(recovered.lease_token).not.toBe(claimed.lease_token)
  expect(queue.sent(claimed, 'old', currentTime).changes).toBe(0)
  expect(queue.sent(recovered, 'new', currentTime).changes).toBe(1)
})

it('marchează pentru intervenție o ultimă încercare întreruptă', () => {
  seed()
  db.exec("UPDATE mail_jobs SET status = 'sending', attempts = 6, lease_until = '2030-06-15T11:59:00.000Z'")
  expect(queue.claim(currentTime, 120_000)).toBeUndefined()
  expect(rows().map((row) => row.status)).toEqual(['failed', 'failed'])
})

it('două procesoare și apelurile suprapuse nu trimit aceeași notificare simultan', async () => {
  seed()
  let release
  const send = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    .mockResolvedValue({ id: 'other' })
  const first = worker(send)
  const active = first.drain()
  expect(first.drain()).toBe(active)
  await worker(send).drain()
  expect(send).toHaveBeenCalledTimes(2)
  release({ id: 'first' })
  await active
  expect(rows().map((row) => row.status)).toEqual(['sent', 'sent'])
})

it('reînnoiește rezervarea unei expedieri lente și așteaptă finalizarea la oprire', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  seed()
  let release
  const send = vi.fn(() => new Promise((resolve) => { release = resolve }))
  const run = worker(send)
  const active = run.drain()
  const before = rows()[0].lease_until
  currentTime = new Date(currentTime.getTime() + 40_000)
  await vi.advanceTimersByTimeAsync(40_000)
  expect(rows()[0].lease_until > before).toBe(true)
  const stopped = run.stop()
  release({ id: 'ok' })
  await Promise.all([active, stopped])
  expect(send).toHaveBeenCalledTimes(1)
  expect(rows().map((row) => row.status)).toEqual(['sent', 'pending'])
})

it('ștergerea mesajului elimină inclusiv notificările și conținutul lor', async () => {
  const id = seed()
  messages.remove(id)
  const send = vi.fn()
  await worker(send).drain()
  expect(rows()).toHaveLength(0)
  expect(send).not.toHaveBeenCalled()
})

it('procesorul pornit verifică periodic coada și se oprește fără alte expedieri', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  seed()
  let configured = false
  const send = vi.fn().mockResolvedValue({ id: 'automatic' })
  const run = worker(send, { isConfigured: () => configured })
  run.start()
  await run.drain()
  expect(send).not.toHaveBeenCalled()
  configured = true
  await vi.advanceTimersByTimeAsync(10_000)
  expect(send).toHaveBeenCalledTimes(2)
  await run.stop()
  seed()
  await vi.advanceTimersByTimeAsync(10_000)
  expect(send).toHaveBeenCalledTimes(2)
})
