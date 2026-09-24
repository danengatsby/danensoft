/**
 * Copie de siguranță a bazei de mesaje.
 *
 *   sudo -u danen node scripts/backup.mjs
 *
 * Rulează automat zilnic, prin `danen-backup.timer`. Verificare:
 *
 *   systemctl list-timers danen-backup
 *   journalctl -u danen-backup -n 20
 *
 * Folosește `VACUUM INTO`, nu o copiere de fișier: baza rulează în modul WAL,
 * deci scrierile recente stau în `messages.db-wal`, iar un `cp` al fișierului
 * principal ar produce o copie veche sau incoerentă. `VACUUM INTO` scrie un
 * fișier unic, deja compactat, dintr-o singură tranzacție de citire — se poate
 * face în timp ce serviciul funcționează, fără să-l oprim.
 */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DB_PATH = process.env.DANEN_DB ?? '/var/lib/danen/messages.db'
const DIR = process.env.DANEN_BACKUP_DIR ?? '/var/backups/danen'
const KEEP = Number(process.env.DANEN_BACKUP_KEEP ?? 14)

const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
const target = join(DIR, `messages-${stamp}.db`)

mkdirSync(DIR, { recursive: true, mode: 0o700 })

const db = new DatabaseSync(DB_PATH, { readOnly: true })
try {
  // Calea nu vine din exterior, dar ghilimelele se dublează oricum: `VACUUM
  // INTO` nu acceptă parametru legat, deci calea intră în textul interogării.
  db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`)
} finally {
  db.close()
}

const size = statSync(target).size
console.log(`Copie scrisă: ${target} (${(size / 1024).toFixed(1)} KB)`)

// Verificare imediată: o copie pe care nu o putem citi nu este o copie.
const check = new DatabaseSync(target, { readOnly: true })
try {
  const { n: messages } = check.prepare('SELECT COUNT(*) AS n FROM messages').get()
  const { n: users } = check.prepare('SELECT COUNT(*) AS n FROM users').get()
  const integrity = check.prepare('PRAGMA integrity_check').get()
  const verdict = Object.values(integrity)[0]

  if (verdict !== 'ok') throw new Error(`integritate: ${verdict}`)
  console.log(`Verificat: ${messages} mesaje, ${users} conturi, integritate ok`)
} finally {
  check.close()
}

const copies = readdirSync(DIR)
  .filter((name) => name.startsWith('messages-') && name.endsWith('.db'))
  .sort()

const stale = copies.slice(0, Math.max(0, copies.length - KEEP))
for (const name of stale) rmSync(join(DIR, name))

const removed =
  stale.length === 1 ? 'o copie veche ștearsă' : `${stale.length} copii vechi șterse`

console.log(
  stale.length
    ? `${removed}; păstrate ultimele ${KEEP}.`
    : `Copii păstrate: ${copies.length} (limita: ${KEEP}).`,
)
