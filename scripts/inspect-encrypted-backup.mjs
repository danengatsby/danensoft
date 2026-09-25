import { mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { decryptBackup } from './lib/encrypted-backup.mjs'
import { verifyBackup } from './lib/backup.mjs'
import { run } from './lib/offsite.mjs'
const [archive, key] = process.argv.slice(2)
if (!archive || !key) throw new Error('Usage: node scripts/inspect-encrypted-backup.mjs archive.enc key-file')
const work = await mkdtemp(join(tmpdir(),'danen-restore-'))
try {
  const tar = join(work,'backup.tar')
  await decryptBackup(archive,tar,key)
  const files = (await run('tar',['-tf',tar])).trim().split('\n')
  if (files.some(file => !['messages.db','api.env'].includes(file))) throw new Error('Unexpected archive entries')
  const restored = join(work,'restored')
  await mkdir(restored, { mode:0o700 })
  await run('tar',['-xf',tar,'-C',restored])
  console.log(JSON.stringify({ integrity:'ok', ...verifyBackup(join(restored,'messages.db')), includesConfiguration:files.includes('api.env') }))
} finally { await rm(work,{ recursive:true,force:true }) }
