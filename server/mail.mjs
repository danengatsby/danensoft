import nodemailer from 'nodemailer'

/**
 * Trimiterea de e-mail este opțională. Fără variabilele de mai jos, serviciul
 * funcționează normal, doar că nu trimite notificări — nu eșuează și nu blochează
 * salvarea mesajelor.
 *
 * În /etc/danen/api.env:
 *   SMTP_HOST=smtp.exemplu.ro
 *   SMTP_PORT=587
 *   SMTP_USER=utilizator
 *   SMTP_PASS=parola-sau-cheia-api
 *   MAIL_FROM="Dan Enache <adresa-verificata@exemplu.ro>"
 *   MAIL_TO=moldovanlux@gmail.com
 *
 * Portul 465 și portul 25 sunt blocate pe acest server; folosiți 587 (STARTTLS).
 */
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env

export const contactRecipient = MAIL_TO?.trim() || 'moldovanlux@gmail.com'

export const mailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_FROM)

const transport = mailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: false, // 587 pornește în clar și urcă la TLS prin STARTTLS
      requireTLS: true,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

/** Verifică conexiunea și autentificarea, fără să trimită vreun mesaj. */
export async function verifyMail() {
  if (!transport) throw new Error('SMTP neconfigurat')
  await transport.verify()
}

/** Trimite un e-mail. Eșecul este jurnalizat, nu propagat: notificarea nu e critică. */
export async function sendMail({ to, replyTo, subject, text, headers, messageId }) {
  if (!transport) return { skipped: true }

  try {
    const info = await transport.sendMail({
      from: MAIL_FROM,
      to: to ?? contactRecipient,
      replyTo,
      subject,
      text,
      headers,
      messageId,
    })
    if (Array.isArray(info.accepted) && info.accepted.length === 0) {
      throw new Error("SMTP nu a acceptat destinatarul")
    }
    return { id: info.messageId }
  } catch (error) {
    console.error('[danen-api] trimitere e-mail eșuată:', error.message)
    return { error: error.message }
  }
}

/** Notificare către echipă la primirea unei cereri noi. */
function notificationMail(values, { fromAccount } = {}) {
  return {
    to: contactRecipient,
    replyTo: values.email,
    subject: `Cerere nouă de la ${values.name}`,
    text: [
      `Nume:        ${values.name}`,
      `E-mail:      ${values.email}`,
      values.organisation ? `Organizație: ${values.organisation}` : null,
      values.topic ? `Subiect:     ${values.topic}` : null,
      `Cont:        ${fromAccount ?? 'trimis fără autentificare'}`,
      '',
      values.message,
      '',
      '— Vedeți toate cererile la https://danenachesoft.space/admin',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  }
}

/** Confirmare tranzacțională; nu retransmite conținut introdus în formular. */
function confirmationMail(values) {
  return {
    to: { address: values.email.trim() },
    replyTo: contactRecipient,
    subject: 'Am primit mesajul tău · Dan Enache',
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
    },
    text: [
      'Bună ziua,',
      '',
      'Am primit mesajul trimis prin formularul de contact de pe danenachesoft.space. Vă mulțumesc că m-ați contactat!',
      '',
      'Voi reveni cu un răspuns în maximum două zile lucrătoare.',
      'Dacă doriți să adăugați detalii, puteți răspunde direct la acest e-mail.',
      '',
      'Dan Enache',
      contactRecipient,
      'https://danenachesoft.space',
    ].join('\n'),
  }
}

/** Pregătește cele două e-mailuri fără conexiune SMTP sau expediere. */
export function contactEmailJobs(values, context) {
  return [
    { kind: 'admin', mail: notificationMail(values, context) },
    { kind: 'confirmation', mail: confirmationMail(values) },
  ]
}

export const notifyNewMessage = (values, context) => sendMail(notificationMail(values, context))
export const confirmMessageReceived = (values) => sendMail(confirmationMail(values))

/** Fiecare expediere este independentă; un eșec nu o împiedică pe cealaltă. */
export async function sendContactEmails(values, context) {
  const jobs = [
    ['notificare administrator', notifyNewMessage(values, context)],
    ['confirmare expeditor', confirmMessageReceived(values)],
  ]
  return Promise.all(jobs.map(async ([label, job]) => {
    const result = await job
    if (result.id) console.info(`[danen-api] SMTP acceptat: ${label}`)
    return result
  }))
}
