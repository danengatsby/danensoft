// @vitest-environment node
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { request } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, expect, it } from 'vitest'

let directory
let child
let exited
let db
let endpoint

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'danen-contact-test-'))
  const probe = createServer()
  probe.listen(0, '127.0.0.1')
  await once(probe, 'listening')
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  endpoint = `http://127.0.0.1:${port}/api/contact`
  const dbPath = join(directory, 'messages.db')
  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: {
      ...process.env, HOST: '127.0.0.1', PORT: String(port), DANEN_DB: dbPath,
      SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', MAIL_FROM: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stderr.resume()
  exited = once(child, 'exit')
  await Promise.race([
    once(child.stdout, 'data'),
    exited.then(() => { throw new Error('API-ul de test s-a oprit la pornire.') }),
  ])
  db = new DatabaseSync(dbPath, { readOnly: true })
})

afterAll(async () => {
  if (child && child.exitCode === null) {
    child.kill()
    await exited
  }
  db?.close()
  if (directory) await rm(directory, { recursive: true, force: true })
})

async function submit(message) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Contact', email: 'test@example.invalid', message }),
  })
}

it('salvează integral un mesaj de exact 5.000 de caractere, inclusiv spațiile marginale', async () => {
  const message = ` ${'ă'.repeat(4998)} `
  const response = await submit(message)
  expect(response.status).toBe(201)
  expect(db.prepare('SELECT message FROM messages ORDER BY id DESC LIMIT 1').get().message).toBe(message)
})

it.each(['a'.repeat(5001), 'a'.repeat(5100), ` ${'a'.repeat(5000)} `])(
  'respinge mesajul peste limită cu explicație și fără scriere în bază (%#)',
  async (message) => {
    const before = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n
    const response = await submit(message)
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      error: 'Mesajul poate avea cel mult 5.000 de caractere.', fields: ['message'],
    })
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get().n).toBe(before)
  },
)

let requestId = 0
function api(path, options = {}) {
  return fetch(new URL(path, endpoint), {
    redirect: 'manual',
    ...options,
    // Fiecare caz are propriul IP în serviciul izolat, ca să nu testeze limita de rată.
    headers: { 'X-Real-IP': `192.0.2.${++requestId}`, ...options.headers },
  })
}

it.each(['null', '[]', 'true', '42', '"text"', '{'])('respinge corpul JSON invalid %s fără scriere în bază', async (body) => {
  const before = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n
  const response = await api('/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  })
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ error: 'Corp invalid.' })
  expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get().n).toBe(before)
})

it.each(['name', 'email', 'organisation', 'topic', 'message', 'website'])(
  'respinge tipul invalid al câmpului %s fără a-l converti sau salva',
  async (field) => {
    const before = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n
    const response = await api('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test', email: 'test@example.invalid', message: 'Un mesaj valid pentru verificare.',
        [field]: { toString: null },
      }),
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ fields: [field] })
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get().n).toBe(before)
  },
)

it.each(['danen_user=%', 'danen_user=%E0%A4%A', 'unrelated=%'])('tratează cookie-ul invalid %s fără eroare 500', async (cookie) => {
  const response = await api('/cont', { headers: { Cookie: cookie } })
  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toBe('/cont/autentificare')
})

const testPassword = 'Test-password-12345'
function queuedLink(email, kind) {
  const row = db.prepare('SELECT j.payload FROM account_mail_jobs j JOIN users u ON u.id = j.message_id WHERE u.email = ? AND j.kind = ?').get(email, kind)
  return new URL(JSON.parse(row.payload).text.match(/https:\/\/\S+/)[0])
}
async function register(email) {
  const response = await api('/cont/inregistrare', {
    method: 'POST', body: new URLSearchParams({ name:'Test', email, password:testPassword }),
  })
  expect(response.status).toBe(200)
  expect(response.headers.get('set-cookie')).toBeNull()
  const token = queuedLink(email, 'verify').searchParams.get('token')
  expect((await api('/cont/confirmare', { method:'POST', body:new URLSearchParams({ token, password:testPassword }) })).status).toBe(200)
  const login = await api('/cont/autentificare', { method:'POST', body:new URLSearchParams({ email, password:testPassword }) })
  expect(login.status).toBe(302)
  return login.headers.get('set-cookie').split(';')[0]
}

it('păstrează autentificarea când un alt cookie este codificat incorect', async () => {
  const cookie = await register('cookie@example.invalid')
  const response = await api('/cont', { headers: { Cookie: `unrelated=%; ${cookie}` } })
  expect(response.status).toBe(200)
  const contact = await api('/api/contact', {
    method: 'POST', headers: { Cookie: `unrelated=%; ${cookie}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'cookie@example.invalid', message: 'Un mesaj valid pentru verificare.' }),
  })
  expect(contact.status).toBe(201)
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get('cookie@example.invalid')
  expect(db.prepare('SELECT user_id FROM messages ORDER BY id DESC LIMIT 1').get().user_id).toBe(user.id)
})

for (const path of ['/cont/iesire', '/admin/logout']) {
  it.each([undefined, 'danen_user=', 'danen_user=%'])('permite deconectarea la ' + path + ' cu cookie %s', async (cookie) => {
    const response = await api(path, { method: 'POST', headers: cookie ? { Cookie: cookie } : {} })
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/')
    expect(response.headers.get('set-cookie')).toContain('danen_user=;')
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('invalidează sesiunea la ' + path + ' și acceptă repetarea deconectării', async () => {
    const cookie = await register(`${path.includes('admin') ? 'admin' : 'user'}-logout@example.invalid`)
    expect((await api('/cont', { headers: { Cookie: cookie } })).status).toBe(200)
    for (let attempt = 0; attempt < 2; attempt++) {
      expect((await api(path, { method: 'POST', headers: { Cookie: cookie } })).status).toBe(302)
    }
    expect((await api('/cont', { headers: { Cookie: cookie } })).status).toBe(302)
    expect(db.prepare('SELECT token FROM sessions WHERE token = ?').get(cookie.split('=')[1])).toBeUndefined()
  })
}

it('răspunde 400 la Host sau URL invalid și continuă să servească cereri', async () => {
  for (const [host, path] of [['[', '/cont'], ['localhost', 'http://[']]) {
    const status = await new Promise((resolve, reject) => {
      const req = request({
        hostname: '127.0.0.1', port: new URL(endpoint).port, path,
        headers: { Host: host },
      }, res => {
        res.resume()
        res.on('end', () => resolve(res.statusCode))
      })
      req.on('error', reject)
      req.setTimeout(2000, () => req.destroy(new Error('Cererea de test a expirat.')))
      req.end()
    })
    expect(status).toBe(400)
    expect(child.exitCode).toBeNull()
    expect((await api('/cont/autentificare')).status).toBe(200)
  }
})

it.each(['first,last@example.test', 'first;last@example.test', '<visitor@example.test>', 'Visitor <visitor@example.test>'])(
  'respinge adresa %s înainte de salvare și expedierea confirmării',
  async (email) => {
    const before = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n
    const response = await api('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email, message: 'Un mesaj valid pentru verificare.' }),
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ fields: ['email'] })
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get().n).toBe(before)
  },
)

it('persistă ambele notificări înainte de 201 chiar și fără SMTP configurat', async () => {
  const response = await api('/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Queue Test', email: 'queue@example.invalid', message: 'Cerere validă pentru coada persistentă.' }),
  })
  expect(response.status).toBe(201)
  const message = db.prepare('SELECT id FROM messages ORDER BY id DESC LIMIT 1').get()
  const jobs = db.prepare('SELECT kind, status, attempts FROM mail_jobs WHERE message_id = ? ORDER BY id').all(message.id)
  expect(jobs.map((job) => ({ ...job }))).toEqual([
    { kind: 'admin', status: 'pending', attempts: 0 },
    { kind: 'confirmation', status: 'pending', attempts: 0 },
  ])
})

it('protejează reluarea notificărilor prin rol și origine, fără a repeta notificările acceptate', async () => {
  const cookie = await register('queue-admin@example.invalid')
  expect((await api('/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Admin Queue Test', email: 'admin-queue@example.invalid', message: 'Cerere pentru verificarea administrării cozii.' }),
  })).status).toBe(201)
  const message = db.prepare('SELECT id FROM messages ORDER BY id DESC LIMIT 1').get()
  const path = `/admin/messages/${message.id}/retry-mail`
  expect((await api(path, { method: 'POST' })).status).toBe(403)
  expect((await api(path, { method: 'POST', headers: { Cookie: cookie } })).status).toBe(403)

  const writer = new DatabaseSync(join(directory, 'messages.db'))
  try {
    writer.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run('queue-admin@example.invalid')
    writer.prepare("UPDATE mail_jobs SET status = 'failed', attempts = 6, last_error = ? WHERE message_id = ? AND kind = 'admin'")
      .run('<img src=x onerror=alert(1)>', message.id)
    writer.prepare("UPDATE mail_jobs SET status = 'sent', sent_at = ?, attempts = 1 WHERE message_id = ? AND kind = 'confirmation'")
      .run(new Date().toISOString(), message.id)
    const page = await api('/admin', { headers: { Cookie: cookie } })
    expect(page.status).toBe(200)
    const html = await page.text()
    expect(html).toContain('Reîncearcă notificările eșuate')
    expect(html).toContain('Acceptat de SMTP')
    expect(html).toContain('SMTP neconfigurat')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
    const rejected = await api(path, { method: 'POST', headers: { Cookie: cookie, Origin: 'https://foreign.invalid' } })
    expect(rejected.status).toBe(403)
    expect(db.prepare("SELECT status FROM mail_jobs WHERE message_id = ? AND kind = 'admin'").get(message.id).status).toBe('failed')
    const accepted = await api(path, { method: 'POST', headers: { Cookie: cookie, Origin: new URL(endpoint).origin } })
    expect(accepted.status).toBe(302)
    const jobs = db.prepare('SELECT status, attempts FROM mail_jobs WHERE message_id = ? ORDER BY id').all(message.id)
    expect(jobs.map((job) => [job.status, job.attempts])).toEqual([['pending', 0], ['sent', 1]])

    const deleted = await api(`/admin/messages/${message.id}/delete`, { method: 'POST', headers: { Cookie: cookie, Origin: new URL(endpoint).origin } })
    expect(deleted.status).toBe(302)
    expect(db.prepare('SELECT COUNT(*) AS n FROM mail_jobs WHERE message_id = ?').get(message.id).n).toBe(0)
  } finally { writer.close() }
})

it('verification and recovery require unexpired, single-use tokens; recovery invalidates sessions', async () => {
  const email = 'recovery@example.invalid'
  const password = 'Another-test-password-12345'
  const signup = await api('/cont/inregistrare?lang=en', { method:'POST', body:new URLSearchParams({ name:'Recovery', email, password:testPassword }) })
  expect(signup.status).toBe(200)
  expect(await signup.text()).toContain('Check your email')
  const login = () => api('/cont/autentificare', { method:'POST', body:new URLSearchParams({ email, password:testPassword }) })
  expect((await login()).status).toBe(403)
  const link = queuedLink(email, 'verify')
  expect(link.origin).toBe('https://danenachesoft.space')
  expect(link.searchParams.get('lang')).toBe('en')
  const token = link.searchParams.get('token')
  expect(db.prepare('SELECT hash FROM account_tokens WHERE user_id = (SELECT id FROM users WHERE email = ?)').get(email).hash).not.toBe(token)
  expect((await api(link.pathname + link.search)).status).toBe(200)
  expect((await login()).status).toBe(403) // GET does not consume or verify.
  expect((await api('/cont/confirmare', { method:'POST', body:new URLSearchParams({ token, password:'wrong' }) })).status).toBe(401)
  expect((await api('/cont/confirmare', { method:'POST', body:new URLSearchParams({ token, password:testPassword }) })).status).toBe(200)
  expect((await api('/cont/confirmare', { method:'POST', body:new URLSearchParams({ token, password:testPassword }) })).status).toBe(400)
  const signed = await login()
  const cookie = signed.headers.get('set-cookie').split(';')[0]
  const recover = await api('/cont/recuperare?lang=en', { method:'POST', body:new URLSearchParams({ email }), headers:{ Host:'attacker.invalid' } })
  const absent = await api('/cont/recuperare?lang=en', { method:'POST', body:new URLSearchParams({ email:'absent@example.invalid' }) })
  expect(await recover.text()).toBe(await absent.text())
  const reset = queuedLink(email, 'reset')
  expect(reset.origin).toBe('https://danenachesoft.space')
  const resetToken = reset.searchParams.get('token')
  expect((await api('/cont/resetare?token=' + resetToken)).status).toBe(200)
  expect((await api('/cont', { headers:{ Cookie:cookie } })).status).toBe(200)
  const resetPost = (overrides = {}, headers = {}) => api('/cont/resetare', { method:'POST', headers, body:new URLSearchParams({ token:resetToken, password, confirm:password, ...overrides }) })
  expect((await resetPost({}, { Origin:'https://foreign.invalid' })).status).toBe(403)
  expect((await resetPost({ confirm:'different' })).status).toBe(422)
  expect((await resetPost()).status).toBe(200)
  expect((await resetPost()).status).toBe(400)
  expect((await api('/cont', { headers:{ Cookie:cookie } })).status).toBe(302)
  expect((await login()).status).toBe(401)
  expect((await api('/cont/autentificare?lang=en', { method:'POST', body:new URLSearchParams({ email, password }) })).headers.get('location')).toBe('/cont?lang=en')
})

it('expired token is rejected and a second request invalidates the first token', async () => {
  const email = 'expiry@example.invalid'
  await register(email)
  const requestReset = () => api('/cont/recuperare', { method:'POST', body:new URLSearchParams({ email }) })
  await requestReset()
  const first = queuedLink(email, 'reset').searchParams.get('token')
  await requestReset()
  const second = queuedLink(email, 'reset').searchParams.get('token')
  expect(first).not.toBe(second)
  expect((await api('/cont/resetare?token=' + first)).status).toBe(400)
  const writer = new DatabaseSync(join(directory, 'messages.db'))
  try { writer.prepare('UPDATE account_tokens SET expires_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)').run('2000-01-01T00:00:00.000Z', email) }
  finally { writer.close() }
  expect((await api('/cont/resetare?token=' + second)).status).toBe(400)
})

it.each(['/cont/iesire', '/admin/logout'])('rejects cross-origin logout %s', async path => {
  expect((await api(path, { method:'POST', headers:{ Origin:'https://foreign.invalid' } })).status).toBe(403)
})

it('health returns no secrets; account pages are private and translated', async () => {
  const health = await api('/api/health')
  expect(await health.json()).toEqual({ status:'ok', release:'working-tree' })
  for (const path of ['/cont/autentificare', '/cont/inregistrare', '/cont/recuperare', '/cont/retrimite']) {
    const response = await api(path + '?lang=en')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(await response.text()).toContain('<html lang="en">')
  }
})

it('recovery rate limiting does not enumerate accounts or replace a valid token', async () => {
  const email = 'limited@example.invalid'
  await register(email)
  for (let i = 0; i < 2; i++) expect((await api('/cont/recuperare', { method:'POST', body:new URLSearchParams({ email }) })).status).toBe(200)
  const before = queuedLink(email, 'reset').href
  expect((await api('/cont/recuperare', { method:'POST', body:new URLSearchParams({ email }) })).status).toBe(200)
  expect(queuedLink(email, 'reset').href).toBe(before)
})
