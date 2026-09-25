/**
 * Import an existing SMTP configuration without printing credentials or sending test mail.
 * sudo /usr/local/bin/node scripts/import-smtp.mjs /protected/source.env
 */
import { readFile, writeFile, rename, unlink, chmod, chown, stat, mkdir } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import nodemailer from 'nodemailer'

const destination = '/etc/danen/api.env'
async function save(content, metadata) {
  const temporary = destination + '.' + randomUUID() + '.tmp'
  try {
    await writeFile(temporary, content, { flag: 'wx', mode: 0o600 })
    await chown(temporary, metadata.uid, metadata.gid)
    await chmod(temporary, metadata.mode & 0o777)
    await rename(temporary, destination)
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error })
  }
}
async function main() {
  if (process.getuid?.() !== 0) throw new Error('Run with sudo.')
  if (!process.argv[2]) throw new Error('Usage: sudo node scripts/import-smtp.mjs /protected/source.env')
  const source = resolve(process.argv[2])
  const sourceStat = await stat(source)
  if (!sourceStat.isFile() || sourceStat.size > 1_000_000) throw new Error('Invalid source file.')
  if (sourceStat.mode & 0o007) throw new Error('Source file is accessible to other users. Set permissions to 0600 or 0640 first.')
  const values = parseEnv(await readFile(source, 'utf8'))
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']) {
    if (!values[key]?.trim()) throw new Error('Missing field: ' + key)
  }
  const port = Number(values.SMTP_PORT || 587)
  if (!Number.isInteger(port) || port < 1 || port > 65535 || port === 465) {
    throw new Error('This API requires a STARTTLS SMTP port, normally 587.')
  }
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_TO']) {
    if (values[key] && /[\r\n\0]/.test(values[key])) throw new Error('Invalid multiline value: ' + key)
  }
  const transport = nodemailer.createTransport({
    host: values.SMTP_HOST, port, secure: false, requireTLS: true,
    auth: { user: values.SMTP_USER, pass: values.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  })
  try { await transport.verify() }
  catch (error) { throw new Error('SMTP authentication failed; configuration unchanged (' + (error.code || 'SMTP') + ').') }
  finally { transport.close() }

  const before = await readFile(destination, 'utf8')
  const metadata = await stat(destination)
  await mkdir('/var/backups/danen-config', { recursive: true, mode: 0o700 })
  const backup = '/var/backups/danen-config/api-before-smtp-' + randomUUID() + '.env'
  await writeFile(backup, before, { flag: 'wx', mode: 0o600 })
  const selected = {
    SMTP_HOST: values.SMTP_HOST, SMTP_PORT: String(port),
    SMTP_USER: values.SMTP_USER, SMTP_PASS: values.SMTP_PASS,
    MAIL_FROM: values.MAIL_FROM, MAIL_TO: values.MAIL_TO || 'moldovanlux@gmail.com',
  }
  const retained = before.split('\n').filter(line =>
    !/^\s*(SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|MAIL_FROM|MAIL_TO)\s*=/.test(line)).join('\n')
  const content = retained.trimEnd() + '\n' +
    Object.entries(selected).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n'
  await save(content, metadata)
  try {
    execFileSync('systemctl', ['restart', 'danen-api'], { stdio: 'ignore', timeout: 30000 })
    execFileSync('systemctl', ['is-active', '--quiet', 'danen-api'], { stdio: 'ignore', timeout: 5000 })
  } catch {
    await save(before, metadata)
    try { execFileSync('systemctl', ['restart', 'danen-api'], { stdio: 'ignore', timeout: 30000 }) } catch { /* Report below. */ }
    throw new Error('API restart failed; previous configuration restored.')
  }
  console.log('SMTP verified and imported. API restarted. No test email was sent.')
}
main().catch(error => {
  console.error(error.code ? 'Import failed (' + error.code + ').' : error.message)
  process.exitCode = 1
})
