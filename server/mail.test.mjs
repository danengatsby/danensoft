// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const smtp = vi.hoisted(() => ({
  sendMail: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('nodemailer', () => ({
  default: { createTransport: () => smtp },
}))

beforeEach(() => {
  vi.resetModules()
  smtp.sendMail.mockReset().mockResolvedValue({ messageId: 'test-message-id' })
  vi.stubEnv('SMTP_HOST', 'smtp.example.test')
  vi.stubEnv('SMTP_USER', 'sender@example.test')
  vi.stubEnv('SMTP_PASS', 'test-only-password')
  vi.stubEnv('MAIL_FROM', 'Dan Enache <sender@example.test>')
  vi.stubEnv('MAIL_TO', '')
})

afterEach(() => vi.unstubAllEnvs())

it('trimite cererea către Gmail și păstrează expeditorul SMTP verificat', async () => {
  const { notifyNewMessage } = await import('./mail.mjs')
  const result = await notifyNewMessage({
    name: 'Vizitator Test', email: 'visitor@example.test',
    organisation: 'Firma Test', topic: 'Aplicație web', message: 'Mesajul din formular.',
  })
  expect(result).toEqual({ id: 'test-message-id' })
  expect(smtp.sendMail).toHaveBeenCalledWith(expect.objectContaining({
    to: 'moldovanlux@gmail.com',
    from: 'Dan Enache <sender@example.test>',
    replyTo: 'visitor@example.test',
    subject: 'Cerere nouă de la Vizitator Test',
    text: expect.stringContaining('Mesajul din formular.'),
  }))
})

it('respectă destinatarul configurat explicit', async () => {
  vi.stubEnv('MAIL_TO', 'moldovanlux@gmail.com')
  const { notifyNewMessage } = await import('./mail.mjs')
  await notifyNewMessage({ name: 'Test', email: 'visitor@example.test', message: 'Test' })
  expect(smtp.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'moldovanlux@gmail.com' }))
})

it('nu pretinde expediere când SMTP nu este configurat', async () => {
  vi.stubEnv('SMTP_PASS', '')
  const { notifyNewMessage, mailConfigured } = await import('./mail.mjs')
  expect(mailConfigured).toBe(false)
  expect(await notifyNewMessage({ name: 'Test', email: 'visitor@example.test', message: 'Test' }))
    .toEqual({ skipped: true })
  expect(smtp.sendMail).not.toHaveBeenCalled()
})

it('raportează eșecul SMTP fără a arunca o eroare către formular', async () => {
  smtp.sendMail.mockRejectedValueOnce(new Error('Conexiune SMTP indisponibilă'))
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const { notifyNewMessage } = await import('./mail.mjs')
    expect(await notifyNewMessage({ name: 'Test', email: 'visitor@example.test', message: 'Test' }))
      .toEqual({ error: 'Conexiune SMTP indisponibilă' })
  } finally { log.mockRestore() }
})

it('confirmă primirea către vizitator, cu răspuns către Dan Enache și fără conținutul cererii', async () => {
  const { confirmMessageReceived } = await import('./mail.mjs')
  await confirmMessageReceived({
    name: 'Nume privat', email: 'visitor@example.test',
    message: 'Conținut confidențial', organisation: 'Organizație privată',
  })
  expect(smtp.sendMail).toHaveBeenCalledTimes(1)
  const sent = smtp.sendMail.mock.calls[0][0]
  expect(sent).toMatchObject({
    to: { address: 'visitor@example.test' },
    from: 'Dan Enache <sender@example.test>',
    replyTo: 'moldovanlux@gmail.com',
    subject: 'Am primit mesajul tău · Dan Enache',
    headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'All' },
  })
  expect(sent.text).toContain('două zile lucrătoare')
  for (const privateText of ['Nume privat', 'Conținut confidențial', 'Organizație privată', '/admin']) {
    expect(sent.text).not.toContain(privateText)
  }
})

it.each([0, 1])('continuă cealaltă expediere dacă e-mailul %i eșuează', async (failingIndex) => {
  smtp.sendMail.mockImplementation(async () => {
    if (smtp.sendMail.mock.calls.length - 1 === failingIndex) throw new Error('SMTP indisponibil')
    return { messageId: 'accepted-message-id' }
  })
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
  const infoLog = vi.spyOn(console, 'info').mockImplementation(() => {})
  try {
    const { sendContactEmails } = await import('./mail.mjs')
    const results = await sendContactEmails({ name: 'Test', email: 'visitor@example.test', message: 'Test' })
    expect(smtp.sendMail).toHaveBeenCalledTimes(2)
    expect(results[failingIndex]).toHaveProperty('error')
    expect(results[1 - failingIndex]).toEqual({ id: 'accepted-message-id' })
    expect(smtp.sendMail.mock.calls[0][0].to).toBe('moldovanlux@gmail.com')
    expect(smtp.sendMail.mock.calls[1][0].to).toEqual({ address: 'visitor@example.test' })
  } finally { errorLog.mockRestore(); infoLog.mockRestore() }
})

it('nu confirmă expedierea dacă SMTP nu acceptă destinatarul', async () => {
  smtp.sendMail.mockResolvedValueOnce({ messageId: 'rejected', accepted: [] })
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const { confirmMessageReceived } = await import('./mail.mjs')
    expect(await confirmMessageReceived({ email: 'visitor@example.test' })).toHaveProperty('error')
  } finally { log.mockRestore() }
})

it('pregătește notificările pentru coadă fără a contacta SMTP', async () => {
  const { contactEmailJobs } = await import('./mail.mjs')
  const jobs = contactEmailJobs({ name: 'Test', email: 'visitor@example.test', message: 'Text privat' }, { fromAccount: 'account@example.test' })
  expect(jobs.map((job) => job.kind)).toEqual(['admin', 'confirmation'])
  expect(jobs[0].mail.text).toContain('account@example.test')
  expect(jobs[1].mail.text).not.toContain('Text privat')
  expect(smtp.sendMail).not.toHaveBeenCalled()
})

it('transmite identificatorul stabil din coadă la fiecare încercare SMTP', async () => {
  const { sendMail } = await import('./mail.mjs')
  await sendMail({ to: 'visitor@example.test', subject: 'Test', text: 'Test', messageId: '<stable@danenachesoft.space>' })
  expect(smtp.sendMail).toHaveBeenCalledWith(expect.objectContaining({ messageId: '<stable@danenachesoft.space>' }))
})
