import { createServer } from 'node:http'
import { messages, sessions, users, STATUSES } from './db.mjs'
import {
  createRateLimiter,
  hashPassword,
  newSessionToken,
  verifyNothing,
  verifyPassword,
} from './auth.mjs'
import { notifyNewMessage } from './mail.mjs'
import {
  CSP,
  accountLoginPage,
  accountPage,
  csv,
  messagesPage,
  registerPage,
} from './pages.mjs'

const PORT = Number(process.env.PORT ?? 8091)
const HOST = process.env.HOST ?? '127.0.0.1'
/** Setați DANEN_HTTPS=1 după activarea TLS: cookie-ul primește atunci și flagul Secure. */
const HTTPS = process.env.DANEN_HTTPS === '1'
const USER_COOKIE = 'danen_user'

if (users.adminCount() === 0) {
  console.warn('[danen-api] Nu există niciun cont de administrator. Rulați: npm run admin:set -- <email>')
}

const contactLimit = createRateLimiter({ max: 5, windowMs: 10 * 60_000 })
const loginLimit = createRateLimiter({ max: 8, windowMs: 15 * 60_000 })
const signupLimit = createRateLimiter({ max: 5, windowMs: 60 * 60_000 })

/**
 * A doua limitare la autentificare, pe adresa contului vizat. Cea pe IP nu
 * oprește un atac împărțit pe multe adrese, care ar încerca oricâte parole pe
 * același cont.
 *
 * Limita e largă intenționat: un prag mic ar deveni o armă, fiindcă oricine
 * poate bloca un cont străin greșind parola în locul lui. 20 pe oră lasă loc
 * greșelilor omenești, dar face inutilă ghicirea, iar socoteala se șterge la
 * prima autentificare reușită.
 */
const accountLoginLimit = createRateLimiter({ max: 20, windowMs: 60 * 60_000 })

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
      .map(([key, ...rest]) => [key, decodeURIComponent(rest.join('='))]),
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
  return users.byId(session.user_id) ?? null
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
      return new URL(origin).host === req.headers.host
    } catch {
      return false
    }
  }

  const site = req.headers['sec-fetch-site']
  if (site) return site === 'same-origin' || site === 'none'

  return true
}

const clean = (value, max) => String(value ?? '').trim().slice(0, max)

function validate(payload) {
  const values = {
    name: clean(payload.name, 120),
    email: clean(payload.email, 200),
    organisation: clean(payload.organisation, 160),
    topic: clean(payload.topic, 120),
    message: clean(payload.message, 5000),
  }

  const errors = []
  if (values.name.length < 2) errors.push('name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) errors.push('email')
  if (values.message.length < 20) errors.push('message')

  return { values, errors }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname
  const ip = clientIp(req)

  try {
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

      // Capcana pentru roboți: răspundem cu succes, dar nu salvăm nimic.
      if (clean(payload.website, 10)) return json(res, 200, { ok: true })

      const { values, errors } = validate(payload)
      if (errors.length) return json(res, 422, { error: 'Date invalide.', fields: errors })

      const account = currentUser(req)
      messages.add(values, account?.id ?? null)

      // Notificarea nu trebuie să întârzie sau să rateze răspunsul către vizitator.
      notifyNewMessage(values, { fromAccount: account?.email }).catch(() => {})

      return json(res, 201, { ok: true })
    }

    // ── Administrare (necesită un cont cu rol de administrator) ──────────────
    if (path === '/admin/logout' && req.method === 'POST') {
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

      if (path === '/admin' && req.method === 'GET') {
        return html(res, 200, messagesPage(messages.list(), { insecure: !HTTPS }), {
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

      const action = path.match(/^\/admin\/messages\/(\d+)\/(read|delete|status)$/)
      if (action && req.method === 'POST') {
        if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')
        const id = Number(action[1])

        if (action[2] === 'read') messages.markRead(id)
        else if (action[2] === 'delete') messages.remove(id)
        else {
          const status = new URLSearchParams(await readBody(req)).get('status')
          if (STATUSES.includes(status)) messages.setStatus(id, status)
        }
        return redirect(res, '/admin')
      }
    }

    // ── Conturi de client ────────────────────────────────────────────────────
    if (path === '/cont/inregistrare') {
      if (req.method === 'GET') return html(res, 200, registerPage())

      if (req.method === 'POST') {
        if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')
        if (!signupLimit(ip)) {
          return html(res, 429, registerPage({ error: 'Prea multe conturi create de aici. Reveniți peste o oră.' }))
        }

        const body = new URLSearchParams(await readBody(req))
        const values = {
          name: clean(body.get('name'), 120),
          email: clean(body.get('email'), 200).toLowerCase(),
        }
        const password = String(body.get('password') ?? '')

        if (values.name.length < 2) {
          return html(res, 422, registerPage({ error: 'Introduceți numele.', values }))
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
          return html(res, 422, registerPage({ error: 'Adresă de e-mail invalidă.', values }))
        }
        if (password.length < 10) {
          return html(res, 422, registerPage({ error: 'Parola trebuie să aibă cel puțin 10 caractere.', values }))
        }
        if (users.byEmail(values.email)) {
          return html(res, 409, registerPage({ error: 'Există deja un cont cu această adresă.', values }))
        }

        users.create(values.email, values.name, hashPassword(password), 'user')
        return startSession(res, users.byEmail(values.email))
      }
    }

    if (path === '/cont/autentificare') {
      if (req.method === 'GET') {
        return html(res, 200, accountLoginPage({ next: url.searchParams.get('catre') }))
      }

      if (req.method === 'POST') {
        if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')
        if (!loginLimit(ip)) {
          return html(res, 429, accountLoginPage({ error: 'Prea multe încercări. Așteptați 15 minute.' }))
        }

        const body = new URLSearchParams(await readBody(req))
        const email = clean(body.get('email'), 200).toLowerCase()
        const account = users.byEmail(email)
        const password = String(body.get('password') ?? '')

        // Aceeași limitare se aplică și adreselor fără cont: altfel, diferența
        // dintre „limitat” și „nelimitat” ar spune care adrese sunt conturi.
        if (!accountLoginLimit(email)) {
          return html(res, 429, accountLoginPage({ error: 'Prea multe încercări. Așteptați o oră.' }))
        }

        // Mesaj identic pentru cont inexistent și parolă greșită — și același
        // timp de răspuns, prin verificarea contra hash-ului momeală.
        const ok = account ? verifyPassword(password, account.password_hash) : verifyNothing(password)
        if (!ok) {
          return html(res, 401, accountLoginPage({ error: 'E-mail sau parolă greșită.' }))
        }

        accountLoginLimit.reset(email)

        // Doar căi interne, ca să nu putem fi folosiți ca redirector spre alt
        // site. `//gazda` trece de regexul de cale, dar browserul îl citește ca
        // adresă absolută fără schemă, deci se respinge explicit.
        const requested = body.get('catre')
        const internal =
          typeof requested === 'string' &&
          !requested.startsWith('//') &&
          /^\/[a-z/-]*$/.test(requested)
        const next = internal ? requested : null
        return startSession(res, account, next)
      }
    }

    if (path === '/cont/iesire' && req.method === 'POST') {
      sessions.destroy(cookies(req)[USER_COOKIE])
      return redirect(res, '/', { 'Set-Cookie': userCookie('', 0) })
    }

    if (path === '/cont' && req.method === 'GET') {
      const user = currentUser(req)
      if (!user) return redirect(res, '/cont/autentificare')
      return html(
        res,
        200,
        accountPage(user, messages.listForUser(user.id), {
          notice: url.searchParams.get('ok') ? 'Datele au fost salvate.' : null,
          error: url.searchParams.get('eroare'),
        }),
        { 'Cache-Control': 'no-store' },
      )
    }

    // Modificarea propriilor date. Acționează întotdeauna asupra contului din
    // sesiune, niciodată asupra unui id primit din formular.
    if (path === '/cont/date' && req.method === 'POST') {
      const user = currentUser(req)
      if (!user) return redirect(res, '/cont/autentificare')
      if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')

      const name = clean(new URLSearchParams(await readBody(req)).get('name'), 120)
      if (name.length < 2) {
        return redirect(res, '/cont?eroare=' + encodeURIComponent('Numele este prea scurt.'))
      }

      const account = users.byEmail(user.email)
      users.update(user.id, { passwordHash: account.password_hash, name, role: account.role })
      return redirect(res, '/cont?ok=1')
    }

    if (path === '/cont/parola' && req.method === 'POST') {
      const user = currentUser(req)
      if (!user) return redirect(res, '/cont/autentificare')
      if (!sameOrigin(req)) return send(res, 403, 'Origine respinsă.')
      if (!loginLimit(ip)) {
        return redirect(res, '/cont?eroare=' + encodeURIComponent('Prea multe încercări.'))
      }

      const body = new URLSearchParams(await readBody(req))
      const account = users.byEmail(user.email)

      if (!verifyPassword(String(body.get('current') ?? ''), account.password_hash)) {
        return redirect(res, '/cont?eroare=' + encodeURIComponent('Parola actuală este greșită.'))
      }

      const next = String(body.get('next') ?? '')
      if (next.length < 10) {
        return redirect(res, '/cont?eroare=' + encodeURIComponent('Parola nouă trebuie să aibă cel puțin 10 caractere.'))
      }

      users.update(user.id, { passwordHash: hashPassword(next), name: account.name, role: account.role })

      // Parola schimbată trebuie să dea afară orice altă sesiune: altfel, cine
      // schimbă parola după o compromitere lasă atacatorul autentificat până la
      // 30 de zile. Browserul curent primește imediat o sesiune nouă.
      sessions.destroyForUser(user.id)
      return startSession(res, account, '/cont?ok=1')
    }

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
  console.log(`[danen-api] ascult pe http://${HOST}:${PORT} · TLS declarat: ${HTTPS}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
