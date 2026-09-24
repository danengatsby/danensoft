/**
 * Verifică setările SMTP din /etc/danen/api.env.
 *
 *   node --env-file=/etc/danen/api.env scripts/test-mail.mjs             → doar conexiune
 *   node --env-file=/etc/danen/api.env scripts/test-mail.mjs adresa@ex.ro → trimite un test
 */
import { mailConfigured, sendMail, verifyMail } from '../server/mail.mjs'

if (!mailConfigured) {
  console.error('SMTP neconfigurat. Lipsesc SMTP_HOST / SMTP_USER / SMTP_PASS / MAIL_FROM.')
  process.exit(1)
}

try {
  await verifyMail()
  console.log('Conexiune și autentificare SMTP: reușite.')
} catch (error) {
  console.error('Conexiunea SMTP a eșuat:', error.message)
  process.exit(1)
}

const to = process.argv[2]
if (to) {
  const result = await sendMail({
    to,
    subject: 'Test SMTP · Moldovan Lux',
    text: 'Dacă ați primit acest mesaj, configurarea SMTP funcționează.',
  })
  console.log(result.error ? `Trimitere eșuată: ${result.error}` : `Trimis către ${to}.`)
  process.exit(result.error ? 1 : 0)
}
