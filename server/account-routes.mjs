import { users, sessions } from './db.mjs'
import { hashPassword, verifyPassword, verifyNothing, createRateLimiter } from './auth.mjs'
import { issueAccountMail, findToken, consumeToken, revokeAccountTokens, validPassword } from './account-tokens.mjs'
import { accountView, accountUrl } from './account-pages.mjs'
const ipLimit = createRateLimiter({ max:8, windowMs:15 * 60_000 })
const emailLimit = createRateLimiter({ max:3, windowMs:60 * 60_000 })
const loginLimit = createRateLimiter({ max:8, windowMs:15 * 60_000 })
const loginAccountLimit = createRateLimiter({ max:20, windowMs:60 * 60_000 })
const emailValid = email => /^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]{2,}$/.test(email)
const limitError = 'Prea multe încercări. Reîncercați mai târziu.'
export async function accountRoutes(req, res, ctx) {
  const { url, ip, readBody, sameOrigin, html, redirect, send, startSession, currentUser, userCookie, cookies, messages, wake } = ctx
  const path = url.pathname
  if (path !== '/cont' && !path.startsWith('/cont/')) return false
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ro'
  const href = p => accountUrl(p, lang)
  const page = (kind, props = {}, status = 200) => html(res, status, accountView(kind, { lang, currentPath:path, ...props }), { 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer' })
  if (req.method === 'POST' && !sameOrigin(req)) { send(res, 403, 'Origine respinsă.'); return true }
  const body = req.method === 'POST' ? new URLSearchParams(await readBody(req)) : new URLSearchParams()
  const email = String(body.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const password = String(body.get('password') ?? '')
  const name = String(body.get('name') ?? '').trim().slice(0, 120)
  const isPost = req.method === 'POST'
  if (!['GET', 'POST'].includes(req.method)) { send(res, 405, 'Method not allowed'); return true }
  if (['/cont/inregistrare', '/cont/recuperare', '/cont/retrimite'].includes(path)) {
    const kind = path.endsWith('inregistrare') ? 'register' : path.endsWith('recuperare') ? 'recover' : 'resend'
    if (!isPost) { page(kind); return true }
    if (!ipLimit(ip)) { page(kind, { error:limitError }, 429); return true }
    if (!emailValid(email) || (kind === 'register' && name.length < 2)) {
      page(kind, { error:'Introduceți un nume și o adresă de e-mail validă.', values:{ email,name } }, 422); return true
    }
    if (kind === 'register' && !validPassword(password)) {
      page(kind, { error:'Parola trebuie să aibă între 10 și 128 de caractere.', values:{ email,name } }, 422); return true
    }
    const allowed = emailLimit(email)
    const hash = kind === 'register' ? hashPassword(password) : null
    let user = users.byEmail(email)
    if (allowed && kind === 'register' && !user) {
      users.create(email, name, hash)
      user = users.byEmail(email)
    }
    if (allowed && user && (kind === 'recover' || !user.email_verified_at)) {
      issueAccountMail(user, kind === 'recover' ? 'reset' : 'verify', lang)
      wake()
    }
    page('sent')
    return true
  }
  if (['/cont/resetare', '/cont/confirmare'].includes(path)) {
    const purpose = path.endsWith('resetare') ? 'reset' : 'verify'
    const token = isPost ? body.get('token') : url.searchParams.get('token')
    const tokenRow = findToken(token, purpose)
    if (!tokenRow) { page('recover', { error:'Link invalid sau expirat. Solicitați un link nou.' }, 400); return true }
    if (!isPost) { page(purpose, { token }); return true }
    if (!loginLimit(ip)) { page(purpose, { token, error:limitError }, 429); return true }
    if (purpose === 'reset') {
      if (!validPassword(password)) { page(purpose, { token, error:'Parola trebuie să aibă între 10 și 128 de caractere.' }, 422); return true }
      if (password !== body.get('confirm')) { page(purpose, { token, error:'Parolele nu coincid.' }, 422); return true }
    } else {
      const user = users.byEmail(users.byId(tokenRow.user_id).email)
      if (password.length > 128 || !verifyPassword(password, user.password_hash)) {
        page(purpose, { token, error:'E-mail sau parolă greșită.' }, 401); return true
      }
    }
    if (!consumeToken(token, purpose, password)) { page('recover', { error:'Link invalid sau expirat. Solicitați un link nou.' }, 400); return true }
    page('login', { notice:purpose === 'reset' ? 'Parola a fost salvată. Vă puteți autentifica.' : 'Adresa a fost confirmată. Vă puteți autentifica.' })
    return true
  }
  if (path === '/cont/autentificare') {
    if (!isPost) { page('login', { next:url.searchParams.get('catre') }); return true }
    if (!loginLimit(ip) || !loginAccountLimit(email)) { page('login', { error:limitError }, 429); return true }
    const user = users.byEmail(email)
    const valid = password.length <= 128 && (user ? verifyPassword(password, user.password_hash) : verifyNothing(password))
    if (!valid) { page('login', { error:'E-mail sau parolă greșită.' }, 401); return true }
    if (!user.email_verified_at) { page('login', { error:'Confirmați adresa de e-mail înainte de autentificare.' }, 403); return true }
    loginAccountLimit.reset(email)
    const requested = body.get('catre')
    const next = requested && /^\/(?!\/)[a-z/-]*$/.test(requested) ? requested : (user.role === 'admin' ? '/admin' : '/cont')
    startSession(res, user, href(next))
    return true
  }
  if (path === '/cont/iesire' && isPost) {
    sessions.destroy(cookies(req).danen_user)
    redirect(res, lang === 'en' ? '/en' : '/', { 'Set-Cookie':userCookie('', 0) }); return true
  }
  const user = currentUser(req)
  if (!user) { redirect(res, href('/cont/autentificare')); return true }
  const account = (props = {}, status = 200) => page('account', { user, rows:messages.listForUser(user.id), ...props }, status)
  if (path === '/cont' && !isPost) {
    account({ notice:url.searchParams.get('ok') ? 'Datele au fost salvate.' : null }); return true
  }
  if (path === '/cont/date' && isPost) {
    if (name.length < 2) { account({ error:'Introduceți un nume și o adresă de e-mail validă.' }, 422); return true }
    const full = users.byEmail(user.email)
    users.update(user.id, { name, passwordHash:full.password_hash, role:user.role })
    redirect(res, href('/cont') + (lang === 'en' ? '&' : '?') + 'ok=1'); return true
  }
  if (path === '/cont/parola' && isPost) {
    if (!loginLimit(ip)) { account({ error:limitError }, 429); return true }
    const full = users.byEmail(user.email)
    const current = String(body.get('current') ?? '')
    if (current.length > 128 || !verifyPassword(current, full.password_hash)) { account({ error:'Parola actuală este greșită.' }, 401); return true }
    if (!validPassword(password)) { account({ error:'Parola trebuie să aibă între 10 și 128 de caractere.' }, 422); return true }
    if (password !== body.get('confirm')) { account({ error:'Parolele nu coincid.' }, 422); return true }
    users.update(user.id, { name:user.name, role:user.role, passwordHash:hashPassword(password) })
    sessions.destroyForUser(user.id)
    revokeAccountTokens(user.id)
    startSession(res, user, href('/cont') + (lang === 'en' ? '&' : '?') + 'ok=1')
    return true
  }
  send(res, 404, 'Not found')
  return true
}
