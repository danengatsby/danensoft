// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync, renameSync, readdirSync, statSync, copyFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { createBackup, verifyBackup, pruneBackups } from './lib/backup.mjs'
import { validateDestination, checksum } from './lib/offsite.mjs'
let root, db, dbPath, directory
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'danen-backup-test-'))
  dbPath = join(root, 'source.db'); directory = join(root, 'backups')
  db = new DatabaseSync(dbPath)
  db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE messages (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id)); INSERT INTO users VALUES (1); INSERT INTO messages VALUES (1, 1);`)
})
afterEach(() => { db.close(); rmSync(root, { recursive: true, force: true }) })
function snapshot(keep=2) {
  const copy = createBackup({ dbPath, directory, keep })
  renameSync(copy.temporary, copy.target)
  return copy.target
}
it('capturează scrierile WAL și verifică o copie restaurată', async () => {
  db.exec('INSERT INTO messages VALUES (2,1)')
  const path = snapshot()
  expect(statSync(path).mode & 0o777).toBe(0o600)
  const restored = join(root, 'restore.db')
  copyFileSync(path, restored)
  expect(await checksum(restored)).toBe(await checksum(path))
  expect(verifyBackup(restored)).toEqual({ users: 1, messages: 2 })
})
it('refuză rotația invalidă înainte de a scrie sau șterge copii', () => {
  for (const keep of [0,-1,NaN,1.5]) expect(() => snapshot(keep)).toThrow('întreg pozitiv')
})
it('rotește doar copii finalizate și păstrează backupurile speciale', () => {
  snapshot(); snapshot(); snapshot()
  writeFileSync(join(directory, 'pre-migration.db'), 'protejată')
  writeFileSync(join(directory, 'messages-in-progress.partial'), 'incompletă')
  pruneBackups(directory, 2)
  expect(readdirSync(directory).filter(name => name.startsWith('messages-') && name.endsWith('.db'))).toHaveLength(2)
  expect(readdirSync(directory)).toContain('pre-migration.db')
})
it('detectează o copie coruptă și relațiile invalide', () => {
  const file = join(root, 'broken.db'); writeFileSync(file, 'invalid')
  expect(() => verifyBackup(file)).toThrow()
  db.exec('PRAGMA foreign_keys=OFF; INSERT INTO messages VALUES (2,99)')
  expect(() => snapshot()).toThrow('Chei externe')
})
it('validează destinația fără a permite opțiuni sau comenzi shell', () => {
  expect(validateDestination('backup@example.test','/backups/danen/')).toEqual({host:'backup@example.test',directory:'/backups/danen'})
  for (const host of ['-oProxyCommand=x','x@y;id','x@y$(id)','x@y`id`','x@y z']) expect(() => validateDestination(host,'/backups')).toThrow()
  for (const path of ['/','/tmp/../secrets','/tmp/a b','/tmp/a;id','/tmp/$(id)']) expect(() => validateDestination('x@y',path)).toThrow()
})
