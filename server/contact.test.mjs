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

async function register(email) {
  const response = await api('/cont/inregistrare', {
    method: 'POST',
    body: new URLSearchParams({ name: 'Test', email, password: 'Test-password-12345' }),
  })
  expect(response.status).toBe(302)
  return response.headers.get('set-cookie').split(';')[0]
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
