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
 *   MAIL_FROM="Moldovan Lux <moldovanlux@gmail.com>"
 *   MAIL_TO=adresa-unde-primiti-notificarile@exemplu.ro
 *
 * Portul 465 și portul 25 sunt blocate pe acest server; folosiți 587 (STARTTLS).
 */
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env

export const mailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_FROM)

const transport = mailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: false, // 587 pornește în clar și urcă la TLS prin STARTTLS
      requireTLS: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

/** Verifică conexiunea și autentificarea, fără să trimită vreun mesaj. */
export async function verifyMail() {
  if (!transport) throw new Error('SMTP neconfigurat')
  await transport.verify()
}

/** Trimite un e-mail. Eșecul este jurnalizat, nu propagat: notificarea nu e critică. */
export async function sendMail({ to, subject, text }) {
  if (!transport) return { skipped: true }

  try {
    const info = await transport.sendMail({
      from: MAIL_FROM,
      to: to ?? MAIL_TO ?? SMTP_USER,
      subject,
      text,
    })
    return { id: info.messageId }
  } catch (error) {
    console.error('[danen-api] trimitere e-mail eșuată:', error.message)
    return { error: error.message }
  }
}

/** Notificare către echipă la primirea unei cereri noi. */
export function notifyNewMessage(values, { fromAccount } = {}) {
  return sendMail({
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
  })
}
