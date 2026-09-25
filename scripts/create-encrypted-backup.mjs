import { mkdtemp, rm, rename, copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createBackup,pruneBackups } from './lib/backup.mjs'
import { encryptBackup } from './lib/encrypted-backup.mjs'
import { run,checksum } from './lib/offsite.mjs'
export async function createEncryptedSnapshot() {
  const snapshot=createBackup({ dbPath:process.env.DANEN_DB ?? '/var/lib/danen/messages.db',directory:process.env.DANEN_BACKUP_DIR ?? '/var/backups/danen',keep:Number(process.env.DANEN_BACKUP_KEEP ?? 14) })
  await rename(snapshot.temporary,snapshot.target)
  const work=await mkdtemp(join(tmpdir(),'danen-encrypted-'))
  try {
    await copyFile(snapshot.target,join(work,'messages.db'))
    await copyFile('/etc/danen/api.env',join(work,'api.env'))
    const tar=join(work,'snapshot.tar')
    await run('tar',['-cf',tar,'-C',work,'messages.db','api.env'])
    const archive=snapshot.target.replace(/\.db$/,'.enc')
    await encryptBackup(tar,archive,process.env.DANEN_BACKUP_KEY ?? '/etc/danen/backup.key')
    pruneBackups(snapshot.directory,snapshot.keep)
    return { archive,sha256:await checksum(archive),...snapshot.counts }
  } finally { await rm(work,{recursive:true,force:true}) }
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  console.log(JSON.stringify(await createEncryptedSnapshot()))
}
