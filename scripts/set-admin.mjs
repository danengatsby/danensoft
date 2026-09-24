/**
 * Creează sau actualizează contul de administrator.
 *
 *   sudo -u danen node scripts/set-admin.mjs email@exemplu.ro
 *   sudo -u danen node scripts/set-admin.mjs email@exemplu.ro --random
 *
 * Administratorul se autentifică prin aceeași pagină ca ceilalți utilizatori,
 * la /cont/autentificare. Diferența este doar rolul salvat în baza de date.
 */
import { randomBytes } from 'node:crypto'
import { stdin, stdout } from 'node:process'
import { hashPassword } from '../server/auth.mjs'
import { sessions, users } from '../server/db.mjs'

const ENTER = ['\r', '\n']
const CTRL_C = '\u0003'
const CTRL_D = '\u0004'
const BACKSPACE = ['\u007f', '\b']

/**
 * Citește o parolă fără să o afișeze. `readline` scrie în terminal tot ce se
 * tastează, deci parola rămânea vizibilă pe ecran și în istoricul de derulare.
 */
function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) {
      reject(new Error('Parola se cere dintr-un terminal. Folosiți --random în scripturi.'))
      return
    }

    stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    let value = ''

    const finish = (result, error) => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.off('data', onData)
      stdout.write('\n')
      if (error) reject(error)
      else resolve(result)
    }

    const onData = (chunk) => {
      for (const char of chunk) {
        if (ENTER.includes(char) || char === CTRL_D) return finish(value)
        if (char === CTRL_C) return finish(null, new Error('Anulat.'))
        if (BACKSPACE.includes(char)) value = value.slice(0, -1)
        else if (char >= ' ') value += char
      }
    }

    stdin.on('data', onData)
  })
}

const email = process.argv[2]?.trim().toLowerCase()
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error('Folosire: node scripts/set-admin.mjs <email> [--random]')
  process.exit(1)
}

const wantsRandom = process.argv.includes('--random')
let password

if (wantsRandom) {
  password = randomBytes(15).toString('base64url')
} else {
  try {
    // Fără `.trim()`: autentificarea compară parola exact cum a fost tastată,
    // deci tăierea spațiilor aici ar face imposibilă folosirea parolei salvate.
    password = await askHidden(`Parola pentru ${email}: `)
    const again = await askHidden('Repetați parola: ')
    if (password !== again) {
      console.error('Parolele nu coincid.')
      process.exit(1)
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

if (password.length < 10) {
  console.error('Parola trebuie să aibă cel puțin 10 caractere.')
  process.exit(1)
}

const existing = users.byEmail(email)
const hash = hashPassword(password)

if (existing) {
  users.update(existing.id, { passwordHash: hash, name: existing.name || 'Administrator', role: 'admin' })
  // Parolă nouă înseamnă sesiuni vechi invalidate, ca și la schimbarea din /cont.
  sessions.destroyForUser(existing.id)
  console.log(`Cont actualizat: ${email} are acum rol de administrator și parolă nouă.`)
} else {
  users.create(email, 'Administrator', hash, 'admin')
  console.log(`Cont creat: ${email}, cu rol de administrator.`)
}

if (wantsRandom) console.log(`\n  Parolă generată: ${password}\n`)
console.log('Autentificare la /cont/autentificare')
