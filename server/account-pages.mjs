import { shell, escapeHtml as e } from './pages.mjs'
const en = {
  'Contul meu':'My account', 'Înapoi la site':'Back to website', 'Autentificare':'Sign in',
  'Creare cont':'Create account', 'Nume':'Name', 'E-mail':'Email', 'Parolă':'Password',
  'Parola actuală':'Current password', 'Parola nouă':'New password', 'Repetați parola nouă':'Confirm new password',
  'Minimum 10, maximum 128 de caractere.':'Between 10 and 128 characters.',
  'Intră în cont':'Sign in', 'Creează contul':'Create account', 'Ai uitat parola?':'Forgot password?',
  'Recuperarea parolei':'Reset password', 'Trimite linkul':'Send link', 'Salvează parola':'Save password',
  'Confirmarea adresei':'Verify email', 'Confirmă adresa':'Verify email',
  'Retrimite confirmarea':'Resend verification', 'Verificați e-mailul':'Check your email',
  'Dacă adresa poate fi folosită, veți primi un e-mail cu pașii următori. Verificați și folderul Spam.':'If the address is eligible, you will receive an email with the next steps. Please also check your spam folder.',
  'Link invalid sau expirat. Solicitați un link nou.':'Invalid or expired link. Request a new link.',
  'Adresa a fost confirmată. Vă puteți autentifica.':'Your email has been verified. You can sign in.',
  'Parola a fost salvată. Vă puteți autentifica.':'Your password has been saved. You can sign in.',
  'E-mail sau parolă greșită.':'Incorrect email or password.',
  'Confirmați adresa de e-mail înainte de autentificare.':'Verify your email before signing in.',
  'Prea multe încercări. Reîncercați mai târziu.':'Too many attempts. Please try again later.',
  'Introduceți un nume și o adresă de e-mail validă.':'Enter a name and a valid email address.',
  'Parola trebuie să aibă între 10 și 128 de caractere.':'The password must contain between 10 and 128 characters.',
  'Parolele nu coincid.':'Passwords do not match.', 'Parola actuală este greșită.':'The current password is incorrect.',
  'Datele au fost salvate.':'Your details have been saved.',
  'Veți primi un link de confirmare. Contul afișează doar cererile trimise după autentificare.':'You will receive a verification link. Your account only shows requests submitted while signed in.',
  'Introduceți parola aleasă la înregistrare pentru a confirma această adresă.':'Enter the password you chose when registering to verify this address.',
  'Salvează numele':'Save name', 'Schimbă parola':'Change password', 'Ieși din cont':'Sign out',
  'Trimite o cerere nouă':'Send a new request', 'Administrare mesaje':'Manage messages',
  'Cererile mele':'My requests', 'Datele contului':'Account details',
  'Nicio cerere trimisă din acest cont încă.':'No requests have been submitted from this account yet.',
  'Stare':'Status', 'primit':'received', 'în lucru':'in progress', 'ofertat':'quoted', 'închis':'closed',
}
export const translator = lang => text => lang === 'en' ? (en[text] ?? text) : text
export const accountUrl = (path, lang) => path + (lang === 'en' ? '?lang=en' : '')
export function accountView(kind, { lang = 'ro', error, notice, values = {}, token = '', next = '', currentPath = '/cont/autentificare', user, rows = [] } = {}) {
  const t = translator(lang)
  const url = path => accountUrl(path, lang)
  const link = (path, label) => '<a href="' + url(path) + '">' + e(t(label)) + '</a>'
  const field = (name, label, type = 'text', value = '', autocomplete = name) =>
    '<label for="' + name + '" style="margin-top:1rem">' + e(t(label)) + '</label><input id="' + name +
    '" name="' + name + '" type="' + type + '" value="' + e(value) + '" autocomplete="' + autocomplete +
    '" required' + (type === 'password' ? ' minlength="10" maxlength="128"' : ' maxlength="200"') + '>'
  const button = label => '<button class="primary" style="margin-top:1.25rem" type="submit">' + e(t(label)) + '</button>'
  const form = (path, body) => '<form method="post" class="card" action="' + url(path) + '">' + body + '</form>'
  const password = (name, label = 'Parolă', current = false) => field(name, label, 'password', '', current ? 'current-password' : 'new-password')
  const hidden = '<input type="hidden" name="token" value="' + e(token) + '">'
  let title, body
  if (kind === 'register') {
    title = 'Creare cont'
    body = '<p>' + e(t('Veți primi un link de confirmare. Contul afișează doar cererile trimise după autentificare.')) + '</p>' +
      form('/cont/inregistrare', field('name', 'Nume', 'text', values.name) + field('email', 'E-mail', 'email', values.email) +
      password('password') + '<p class="muted">' + t('Minimum 10, maximum 128 de caractere.') + '</p>' + button('Creează contul')) +
      link('/cont/autentificare', 'Autentificare')
  } else if (kind === 'login') {
    title = 'Autentificare'
    body = form('/cont/autentificare', '<input type="hidden" name="catre" value="' + e(next) + '">' +
      field('email', 'E-mail', 'email') + password('password', 'Parolă', true) + button('Intră în cont')) +
      '<p>' + link('/cont/recuperare', 'Ai uitat parola?') + '</p><p>' + link('/cont/inregistrare', 'Creare cont') +
      '</p><p>' + link('/cont/retrimite', 'Retrimite confirmarea') + '</p>'
  } else if (kind === 'recover' || kind === 'resend') {
    title = kind === 'recover' ? 'Recuperarea parolei' : 'Retrimite confirmarea'
    body = form(kind === 'recover' ? '/cont/recuperare' : '/cont/retrimite', field('email', 'E-mail', 'email') + button('Trimite linkul')) +
      link('/cont/autentificare', 'Autentificare')
  } else if (kind === 'reset') {
    title = 'Recuperarea parolei'
    body = form('/cont/resetare', hidden + password('password', 'Parola nouă') + password('confirm', 'Repetați parola nouă') +
      '<p class="muted">' + t('Minimum 10, maximum 128 de caractere.') + '</p>' + button('Salvează parola'))
  } else if (kind === 'verify') {
    title = 'Confirmarea adresei'
    body = '<p>' + t('Introduceți parola aleasă la înregistrare pentru a confirma această adresă.') + '</p>' +
      form('/cont/confirmare', hidden + password('password', 'Parolă', true) + button('Confirmă adresa'))
  } else if (kind === 'account') {
    title = 'Contul meu'
    body = '<p>' + e(user.name) + ' · ' + e(user.email) + '</p><div class="actions">' +
      link(lang === 'en' ? '/en/contact' : '/contact', 'Trimite o cerere nouă') +
      (user.role === 'admin' ? link('/admin', 'Administrare mesaje') : '') +
      form('/cont/iesire', button('Ieși din cont')) + '</div><h2>' + t('Cererile mele') + '</h2>' +
      (rows.length ? rows.map(row => '<article class="card"><p class="muted">' +
        e(new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ro-RO', { dateStyle:'medium', timeZone:'Europe/Bucharest' }).format(new Date(row.created_at))) +
        ' · ' + t('Stare') + ': ' + e(t(row.status)) + '</p><h3>' + e(row.topic) + '</h3><div class="body">' + e(row.message) + '</div></article>').join('') :
        '<p class="empty">' + t('Nicio cerere trimisă din acest cont încă.') + '</p>') +
      '<h2>' + t('Datele contului') + '</h2>' +
      form('/cont/date', field('name', 'Nume', 'text', user.name) + button('Salvează numele')) +
      form('/cont/parola', password('current', 'Parola actuală', true) + password('password', 'Parola nouă') +
        password('confirm', 'Repetați parola nouă') + button('Schimbă parola'))
  } else {
    title = 'Verificați e-mailul'
    body = '<p>' + t('Dacă adresa poate fi folosită, veți primi un e-mail cu pașii următori. Verificați și folderul Spam.') + '</p>' +
      link('/cont/autentificare', 'Autentificare')
  }
  return shell(t(title), '<main class="wrap" style="max-width:46rem"><header><h1>' + e(t(title)) +
    '</h1><a class="btn" href="' + (lang === 'en' ? '/en' : '/') + '">' + t('Înapoi la site') +
    '</a></header><nav aria-label="Language"><a href="' + e(currentPath + '?lang=' + (lang === 'en' ? 'ro' : 'en') + (token ? '&token=' + encodeURIComponent(token) : '')) +
    '" lang="' + (lang === 'en' ? 'ro' : 'en') + '">' + (lang === 'en' ? 'Română' : 'English') + '</a></nav>' +
    (error ? '<p role="alert" class="error">' + e(t(error)) + '</p>' : '') +
    (notice ? '<p role="status" class="ok">' + e(t(notice)) + '</p>' : '') + body + '</main>', lang)
}
