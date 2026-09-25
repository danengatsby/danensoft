/** Configurează Gmail dintr-un terminal, fără parolă în argumente sau istoric.
 * sudo node scripts/setup-gmail.mjs
 */
import { stdin, stdout } from 'node:process'
import { readFile, writeFile, rename, unlink, stat, chown, chmod } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import nodemailer from 'nodemailer'

const destination = '/etc/danen/api.env'
const account = 'moldovanlux@gmail.com'

function askHidden() {
  return new Promise((resolve, reject) => {
    stdout.write(`Parola de aplicație Gmail pentru ${account} (nu se afișează): `)
    stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    stdin.resume()
    let value = ''
    const finish = (error) => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.off('data', onData)
      stdout.write('\n')
      if (error) reject(error)
      else resolve(value.replace(/\s/g, ''))
    }
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003' || char === '\u0004') return finish(new Error('Anulat.'))
        if (char === '\r' || char === '\n') return finish()
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1)
        else if (char >= ' ') value += char
      }
    }
    stdin.on('data', onData)
  })
}

async function save(content) {
  const metadata = await stat(destination)
  const temporary = `${destination}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, content, { mode: 0o600, flag: 'wx' })
    await chown(temporary, metadata.uid, metadata.gid)
    await chmod(temporary, metadata.mode & 0o777)
    await rename(temporary, destination)
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error })
  }
}

async function main() {
  if (process.getuid?.() !== 0 || !stdin.isTTY) {
    throw new Error('Rulează într-un terminal al serverului: sudo /usr/local/bin/node /var/www/danensoft/scripts/setup-gmail.mjs')
  }
  const password = await askHidden()
  if (!/^[a-zA-Z0-9]{16}$/.test(password)) {
    throw new Error('Introdu parola de aplicație de 16 caractere generată de Google, nu parola contului.')
  }
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
    auth: { user: account, pass: password },
  })
  try {
    stdout.write('Verific conexiunea și autentificarea Gmail…\n')
    try { await transport.verify() }
    catch (error) {
      throw new Error(`Gmail nu a confirmat autentificarea (${error.code ?? 'SMTP'}). Configurația nu a fost modificată.`)
    }
    const before = await readFile(destination, 'utf8')
    const values = {
      SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_USER: account,
      SMTP_PASS: password, MAIL_FROM: `"Dan Enache <${account}>"`, MAIL_TO: account,
    }
    const preserved = before.split('\n').filter(line => !/^\s*(SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|MAIL_FROM|MAIL_TO)\s*=/.test(line))
    const content = `${preserved.join('\n').trimEnd()}\n${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`
    await save(content)
    try {
      execFileSync('systemctl', ['restart', 'danen-api'], { stdio: 'ignore', timeout: 30000 })
      execFileSync('systemctl', ['is-active', '--quiet', 'danen-api'], { stdio: 'ignore', timeout: 5000 })
    } catch {
      await save(before)
      try { execFileSync('systemctl', ['restart', 'danen-api'], { stdio: 'ignore', timeout: 30000 }) } catch { /* Raportăm mai jos. */ }
      throw new Error('Serviciul nu a pornit cu noile setări. Configurația anterioară a fost restaurată; verifică systemctl status danen-api.')
    }
    stdout.write('Gmail configurat. Formularul trimite notificări către moldovanlux@gmail.com.\n')
    if (!process.argv.includes('--send-test')) {
      stdout.write('Conexiunea și autentificarea au fost verificate. Nu a fost trimis un e-mail de test.\n')
      return
    }
    try {
      const info = await transport.sendMail({
        from: `Dan Enache <${account}>`, to: account,
        subject: 'Test formular Contact · Dan Enache',
        text: 'Configurarea Gmail pentru danenachesoft.space a fost verificată. Mesajele noi din formularul Contact vor fi trimise la această adresă și păstrate în administrarea site-ului.',
      })
      if (!info.accepted?.includes(account)) throw new Error('Destinatar neacceptat')
      stdout.write('Gmail a acceptat mesajul de test. Verifică Inbox și Spam.\n')
    } catch {
      throw new Error('SMTP este configurat, dar mesajul de test nu a fost acceptat. Rulează npm run mail:test pentru diagnostic.')
    }
  } finally { transport.close() }
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
