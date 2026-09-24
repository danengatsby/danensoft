import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEYLEN = 64
const SCRYPT = { N: 16384, r: 8, p: 1 }

/** Produce un hash `scrypt$salt$cheie`, potrivit pentru stocare în fișier de mediu. */
export function hashPassword(password) {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEYLEN, SCRYPT)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

/** Comparație în timp constant, ca să nu scurgă informații prin durata răspunsului. */
export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false
  const [scheme, saltHex, keyHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false

  try {
    const expected = Buffer.from(keyHex, 'hex')
    const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT)
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

/**
 * Hash peste o parolă aleatoare, folosit când adresa nu are cont. Fără el,
 * autentificarea răspundea în ~10 ms pentru o adresă inexistentă și în ~46 ms
 * pentru una existentă, iar diferența spunea limpede care adrese sunt conturi —
 * degeaba era mesajul de eroare identic.
 */
const DUMMY_HASH = hashPassword(randomBytes(32).toString('hex'))

/** Consumă același timp ca o verificare reală. Întoarce mereu false. */
export function verifyNothing(password) {
  verifyPassword(password, DUMMY_HASH)
  return false
}

export function newSessionToken() {
  return randomBytes(32).toString('base64url')
}

/**
 * Limitator simplu de rată, în memorie. Cheia este adresa IP sau, la
 * autentificare, adresa de e-mail a contului vizat.
 * Suficient pentru un site de prezentare; nu supraviețuiește repornirii.
 *
 * `check` întoarce false când s-a atins limita. `reset` șterge socoteala unei
 * chei — se apelează după o autentificare reușită.
 */
export function createRateLimiter({ max, windowMs }) {
  const hits = new Map()

  function check(key) {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)

    if (recent.length >= max) {
      hits.set(key, recent)
      return false
    }

    recent.push(now)
    hits.set(key, recent)

    // Curăță periodic intrările vechi, ca Map-ul să nu crească nelimitat.
    if (hits.size > 5000) {
      for (const [existing, times] of hits) {
        if (times.every((time) => now - time >= windowMs)) hits.delete(existing)
      }
    }

    return true
  }

  check.reset = (key) => hits.delete(key)
  return check
}
