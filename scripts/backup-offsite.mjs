/** Backup extern prin SSH, descărcare și verificare a restaurării. */
import { mkdtemp, rm, rename, writeFile, chmod, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createBackup, pruneBackups, verifyBackup } from './lib/backup.mjs'
import { validateDestination, checksum, run } from './lib/offsite.mjs'

const { host, directory } = validateDestination(process.env.DANEN_BACKUP_HOST, process.env.DANEN_BACKUP_REMOTE_DIR)
const config = process.env.DANEN_BACKUP_SSH_CONFIG ?? '/etc/danen/backup-ssh.conf'
if (!/^\/[a-zA-Z0-9_./-]+$/.test(config)) throw new Error('Cale configurație SSH invalidă')
const ssh = ['-F', config, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15']
const transport = `ssh -F ${config} -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15`
const snapshot = createBackup({ dbPath: process.env.DANEN_DB ?? '/var/lib/danen/messages.db',
  directory: process.env.DANEN_BACKUP_DIR ?? '/var/backups/danen', keep: Number(process.env.DANEN_BACKUP_KEEP ?? 14) })
await rename(snapshot.temporary, snapshot.target)
const work = await mkdtemp(join(tmpdir(), 'danen-offsite-'))
const id = `backup-${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`
const remote = `${directory}/${id}`
try {
  const upload = join(work, 'upload.db')
  await copyFile(snapshot.target, upload)
  await chmod(upload, 0o600)
  // Director nou, privat; nu ștergem copiile de pe destinație.
  await run('ssh', [...ssh, host, `umask 077; mkdir -p ${directory}; mkdir ${remote}`])
  await run('rsync', ['--archive', '--chmod=F600', '--timeout=60', '-e', transport, upload, `${host}:${remote}/messages.db`])
  const restored = join(work, 'messages.db')
  await run('rsync', ['--archive', '--timeout=60', '-e', transport, `${host}:${remote}/messages.db`, restored])
  if (await checksum(restored) !== await checksum(upload)) throw new Error('Checksum diferit după descărcarea backupului extern')
  const restoredCounts = verifyBackup(restored)
  // Doar o copie descărcată și verificată primește marcajul de succes.
  const receipt = join(work, 'verified.json')
  await writeFile(receipt, JSON.stringify({ id, verifiedAt: new Date().toISOString(), sha256: await checksum(restored), ...restoredCounts }, null, 2))
  await chmod(receipt, 0o600)
  await run('rsync', ['--archive', '--chmod=F600', '--timeout=60', '-e', transport, receipt, `${host}:${remote}/verified.json`])
  pruneBackups(snapshot.directory, snapshot.keep)
  await writeFile(join(snapshot.directory, 'offsite-status.json'), JSON.stringify({ id, remote: `${host}:${remote}`, verifiedAt: new Date().toISOString() }, null, 2), { mode: 0o600 })
  console.log(JSON.stringify({ id, integrity: 'ok', downloadedAndVerified: true }))
} finally { await rm(work, { recursive: true, force: true }) }
