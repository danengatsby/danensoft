import { readFile } from 'node:fs/promises'
import { accountRoutes } from './account-routes.mjs'
import { createServer } from 'node:http'
import { db, accountMailQueue, mailQueue, messages, sessions, users, STATUSES } from './db.mjs'
import {
  createRateLimiter,
  newSessionToken,
} from './auth.mjs'
import { contactEmailJobs, mailConfigured, sendMail } from './mail.mjs'
import { createMailWorker } from './mail-worker.mjs'
import {
  CSP,
  csv,
  messagesPage,
} from './pages.mjs'

const PORT = Number(process.env.PORT ?? 8091)
const HOST = process.env.HOST ?? '127.0.0.1'
/** Setați DANEN_HTTPS=1 după activarea TLS: cookie-ul primește atunci și flagul Secure. */
const HTTPS = process.env.DANEN_HTTPS === '1'
const USER_COOKIE = 'danen_user'
const accountMailWorker = createMailWorker({ queue: accountMailQueue, sendMail, isConfigured: () => mailConfigured })
const mailWorker = createMailWorker({ queue: mailQueue, sendMail, isConfigured: () => mailConfigured })

if (users.adminCount() === 0) {
  console.warn('[danen-api] Nu există niciun cont de administrator. Rulați: npm run admin:set -- <email>')
}

const contactLimit = createRateLimiter({ max: 5, windowMs: 10 * 60_000 })

/**
 * Adresa clientului, pentru limitarea de rată.
 *
 * `X-Forwarded-For` NU este de încredere: nginx adaugă adresa reală la finalul
 * valorii trimise de client (`$proxy_add_x_forwarded_for`), deci începutul
 * listei este scris de vizitator. Cine citea primul element putea ocoli complet
 * limitarea schimbând antetul la fiecare cerere. `X-Real-IP` este setat de
 * nginx din `$remote_addr` și suprascrie orice trimite clientul.
 */
const clientIp = (req) =>
  String(req.headers['x-real-ip'] ?? '').trim() ||
  req.socket.remoteAddress ||
  'necunoscut'

/** Corp peste limită: semnalizat separat, ca să răspundem 413, nu 400 sau 500. */
class BodyTooLarge extends Error {}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        // Oprim citirea, dar lăsăm socketul viu cât să apuce răspunsul.
        req.pause()
        reject(new BodyTooLarge('corp prea mare'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    ...headers,
  })
  res.end(body)
}

/**
 * Paginile randate aici își poartă propria politică de securitate. nginx nu
 * adaugă una peste ele: două antete CSP înseamnă că browserul le aplică pe
 * amândouă, iar intersecția lor ar bloca administrarea.
 */
const html = (res, status, body, headers = {}) =>
  send(res, status, body, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': CSP,
    ...headers,
  })

const json = (res, status, data) =>
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
  })

const redirect = (res, location, headers = {}) => {
  res.writeHead(302, { Location: location, ...headers })
  res.end()
}

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key]) => key)
      .flatMap(([key, ...rest]) => {
        try {
          return [[key, decodeURIComponent(rest.join('='))]]
        } catch {
          // Un cookie deteriorat este ignorat, fără a invalida celelalte cookie-uri.
          return []
        }
      }),
  )
}

const cookieFor = (name, token, maxAge, path) =>
  `${name}=${token}; Path=${path}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}` +
  (HTTPS ? '; Secure' : '')

const userCookie = (token, maxAge) => cookieFor(USER_COOKIE, token, maxAge, '/')

/** Contul autentificat, dacă sesiunea este validă. */
function currentUser(req) {
  const session = sessions.get(cookies(req)[USER_COOKIE])
  if (session?.kind !== 'user' || !session.user_id) return null
  const user = users.byId(session.user_id)
  return user?.email_verified_at ? user : null
}

/** Administrarea e o permisiune a contului, nu o autentificare separată. */
const isAdmin = (req) => currentUser(req)?.role === 'admin'

/** Sesiunile de administrator sunt scurte; cele de client, lungi. */
function startSession(res, account, target) {
  sessions.prune()
  const token = newSessionToken()
  const admin = account.role === 'admin'
  const hours = admin ? 12 : 720
  sessions.create(token, { kind: 'user', userId: account.id, hours })
  return redirect(res, target ?? (admin ? '/admin' : '/cont'), {
    'Set-Cookie': userCookie(token, hours * 3600),
  })
}

/**
 * Cererile care schimbă starea trebuie să vină din propria origine.
 * Împreună cu SameSite=Strict, acoperă CSRF fără token separat.
 *
 * Ordinea verificărilor: `Origin` când există, altfel `Sec-Fetch-Site`, pe care
 * browserele îl trimit chiar și când omit `Origin`. Cererile fără niciunul
 * (curl, scripturi) sunt acceptate: nu au cookie-uri de furat, deci nu sunt CSRF.
 */
function sameOrigin(req) {
  const origin = req.headers.origin
  if (origin) {
    try {
      return new URL(origin).origin === (HTTPS ? 'https://' : 'http://') + req.headers.host
    } catch {
      return false
    }
  }

  const site = req.headers['sec-fetch-site']
  if (site) return site === 'same-origin' || site === 'none'

  return true
}

const clean = (value, max) => String(value ?? '').trim().slice(0, max)
const MESSAGE_MAX_LENGTH = 5000

function validate(payload) {
  const values = {
    name: clean(payload.name, 120),
    email: clean(payload.email, 200),
    organisation: clean(payload.organisation, 160),
    topic: clean(payload.topic, 120),
    // Mesajul se păstrează integral; depășirea limitei este o eroare de validare.
    message: String(payload.message ?? ''),
  }

  const errors = []
  if (values.name.length < 2) errors.push('name')
  if (!/^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]{2,}$/.test(values.email)) errors.push('email')
  if (values.message.trim().length < 20 || values.message.length > MESSAGE_MAX_LENGTH) {
    errors.push('message')
  }

  return { values, errors }
}

const server = createServer(async (req, res) => {
  // ServerResponse already suppresses the body for an original HEAD request.
  if (req.method === 'HEAD') req.method = 'GET'
  try {
    let url
    try {
      url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    } catch {
      return send(res, 400, 'Adresă invalidă.')
    }
    const path = url.pathname
    const ip = clientIp(req)

    if (path === '/api/health' && req.method === 'GET') {
      db.prepare('SELECT 1').get()
      return send(res, 200, JSON.stringify({ status:'ok', release:process.env.DANEN_RELEASE_ID ?? 'working-tree' }), {
        'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' })
    }

    // ── API public ───────────────────────────────────────────────────────────
    if (path === '/api/contact' && req.method === 'POST') {
      if (!contactLimit(ip)) {
        return json(res, 429, { error: 'Prea multe mesaje. Reîncercați mai târziu.' })
      }

      // Citit în afara try-ului de mai jos: un corp prea mare trebuie să ajungă
      // la tratarea generală (413), nu să fie raportat ca JSON invalid.
      const raw = await readBody(req)

      let payload
      try {
        payload = JSON.parse(raw)
      } catch {
        return json(res, 400, { error: 'Corp invalid.' })
      }

      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return json(res, 400, { error: 'Corp invalid.' })
      }

      const invalidTypes = ['name', 'email', 'organisation', 'topic', 'message', 'website']
        .filter((field) => payload[field] !== undefined && typeof payload[field] !== 'string')
      if (invalidTypes.length) {
        return json(res, 422, { error: 'Câmpurile trebuie să conțină text.', fields: invalidTypes })
      }

      // Capcana pentru roboți: răspundem cu succes, dar nu salvăm nimic.
      if (clean(payload.website, 10)) return json(res, 200, { ok: true })

      const { values, errors } = validate(payload)
      if (errors.length) {
        return json(res, 422, {
          error: values.message.length > MESSAGE_MAX_LENGTH
            ? 'Mesajul poate avea cel mult 5.000 de caractere.'
            : 'Date invalide.',
          fields: errors,
        })
      }

      const account = currentUser(req)
      messages.addWithNotifications(values, account?.id ?? null,
        contactEmailJobs(values, { fromAccount: account?.email }))
      // Mesajul și cele două notificări sunt deja persistate înainte de răspuns.
      mailWorker.wake()

      return json(res, 201, { ok: true })
    }

    // ── Administrare (necesită un cont cu rol de administrator) ──────────────
    if (path === '/admin/logout' && req.method === 'POST') {
      if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')
      sessions.destroy(cookies(req)[USER_COOKIE])
      return redirect(res, '/', { 'Set-Cookie': userCookie('', 0) })
    }

    if (path.startsWith('/admin')) {
      if (!isAdmin(req)) {
        if (req.method !== 'GET') return send(res, 403, 'Nu aveți dreptul.')
        // Autentificat, dar fără rolul necesar: îl trimitem în contul lui.
        // A-l trimite la autentificare ar produce o buclă.
        if (currentUser(req)) return redirect(res, '/cont')
        return redirect(res, '/cont/autentificare?catre=/admin')
      }

      if (path === '/admin/health' && req.method === 'GET') {
        try {
          const report = JSON.parse(await readFile('/var/lib/danen-monitor/status.json', 'utf8'))
          return send(res, 200, JSON.stringify(report), { 'Content-Type':'application/json', 'Cache-Control':'no-store' })
        } catch { return json(res, 503, { status:'unknown' }) }
      }
      if (path === '/admin' && req.method === 'GET') {
        return html(res, 200, messagesPage(messages.list(), { insecure: !HTTPS, mailConfigured }), {
          'Cache-Control': 'no-store',
        })
      }

      if (path === '/admin/export.csv' && req.method === 'GET') {
        return send(res, 200, csv(messages.list(5000)), {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="mesaje.csv"',
          'Cache-Control': 'no-store',
        })
      }

      const action = path.match(/^\/admin\/messages\/(\d+)\/(read|delete|status|retry-mail)$/)
      if (action && req.method === 'POST') {
        if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')
        const id = Number(action[1])

        if (action[2] === 'read') messages.markRead(id)
        else if (action[2] === 'delete') messages.remove(id)
        else if (action[2] === 'retry-mail') {
          mailQueue.retryFailed(id)
          mailWorker.wake()
        }
        else {
          const status = new URLSearchParams(await readBody(req)).get('status')
          if (STATUSES.includes(status)) messages.setStatus(id, status)
        }
        return redirect(res, '/admin')
      }
    }

    if (await accountRoutes(req, res, { url, ip, readBody, sameOrigin, html, redirect, send,
      startSession, currentUser, userCookie, cookies, messages, wake: () => accountMailWorker.wake() })) return

    return send(res, 404, 'Nu există.')
  } catch (error) {
    if (error instanceof BodyTooLarge) {
      send(res, 413, 'Corp prea mare.')
      // Restul corpului nu ne interesează; închidem după ce pleacă răspunsul.
      res.on('finish', () => req.destroy())
      return
    }
    console.error('[danen-api]', error)
    return send(res, 500, 'Eroare internă.')
  }
})

server.listen(PORT, HOST, () => {
  mailWorker.start()
  accountMailWorker.start()
  console.log(`[danen-api] ascult pe http://${HOST}:${PORT} · TLS declarat: ${HTTPS}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    // O expediere întreruptă va fi recuperată la expirarea rezervării din coadă.
    const deadline = setTimeout(() => process.exit(1), 45_000)
    deadline.unref()
    try {
      await Promise.all([new Promise((resolve) => server.close(resolve)), mailWorker.stop(), accountMailWorker.stop()])
      process.exit(0)
    } catch { process.exit(1) }
  })
}
