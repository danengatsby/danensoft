import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readdirSync, rmSync, chmodSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export function verifyBackup(path) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    const verdict = Object.values(db.prepare('PRAGMA integrity_check').get())[0]
    if (verdict !== 'ok') throw new Error(`Integritate: ${verdict}`)
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Chei externe invalide')
    return { messages: db.prepare('SELECT COUNT(*) AS n FROM messages').get().n,
      users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n }
  } finally { db.close() }
}

export function createBackup({ dbPath, directory, keep = 14 }) {
  if (!Number.isSafeInteger(keep) || keep < 1) throw new Error('DANEN_BACKUP_KEEP trebuie să fie un întreg pozitiv')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const name = `messages-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.db`
  const target = join(directory, name)
  const temporary = `${target}.partial`
  const db = new DatabaseSync(dbPath, { readOnly: true })
  try { db.exec(`VACUUM INTO '${temporary.replaceAll("'", "''")}'`) }
  catch (error) { rmSync(temporary, { force: true }); throw error }
  finally { db.close() }
  try {
    chmodSync(temporary, 0o600)
    const counts = verifyBackup(temporary)
    // Rename numai după validare: rotația și sincronizarea nu văd copii incomplete.
    return { target, temporary, counts, directory, keep }
  } catch (error) { rmSync(temporary, { force: true }); throw error }
}

export function pruneBackups(directory, keep) {
  const copies = readdirSync(directory)
    .filter((name) => /^messages-[0-9T:.Z-]+(?:-[a-f0-9]{8})?\.db$/.test(name))
    .filter((name) => statSync(join(directory, name)).isFile())
    .sort()
  for (const name of copies.slice(0, Math.max(0, copies.length - keep))) rmSync(join(directory, name))
}
