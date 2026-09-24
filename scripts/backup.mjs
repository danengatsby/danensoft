/** Copie SQLite coerentă în modul WAL, validare și rotație după succes. */
import { renameSync } from 'node:fs'
import { createBackup, pruneBackups } from './lib/backup.mjs'

const snapshot = createBackup({
  dbPath: process.env.DANEN_DB ?? '/var/lib/danen/messages.db',
  directory: process.env.DANEN_BACKUP_DIR ?? '/var/backups/danen',
  keep: Number(process.env.DANEN_BACKUP_KEEP ?? 14),
})
renameSync(snapshot.temporary, snapshot.target)
pruneBackups(snapshot.directory, snapshot.keep)
console.log(JSON.stringify({ backup: snapshot.target, integrity: 'ok', ...snapshot.counts }))
