import { mkdtemp,rm,writeFile,readdir,unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join,basename } from 'node:path'
import { createEncryptedSnapshot } from './create-encrypted-backup.mjs'
import { run,checksum } from './lib/offsite.mjs'
const config=process.env.DANEN_DRIVE_CONFIG ?? '/etc/danen/drive/rclone.conf'
const remote=process.env.DANEN_DRIVE_REMOTE ?? 'danensoft'
const folder=process.env.DANEN_DRIVE_FOLDER
if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(remote) || !/^[A-Za-z0-9_-]{10,}$/.test(folder ?? '')) throw new Error('Configure Drive remote and folder ID')
const remotes = JSON.parse(await run('rclone',['config','dump','--config',config]))
if (remotes[remote]?.type !== 'drive') throw new Error('The configured remote must be Google Drive')
const snapshot=await createEncryptedSnapshot()
const work=await mkdtemp(join(tmpdir(),'danen-drive-'))
try {
  const target=remote+':'+basename(snapshot.archive)
  const flags=['--config',config,'--drive-root-folder-id',folder,'--contimeout','15s','--timeout','60s','--retries','3']
  await run('rclone',['copyto',snapshot.archive,target,...flags])
  const restored=join(work,'download.enc')
  await run('rclone',['copyto',target,restored,...flags])
  if(await checksum(restored)!==snapshot.sha256) throw new Error('Drive download checksum mismatch')
  await run(process.execPath,[new URL('./inspect-encrypted-backup.mjs',import.meta.url).pathname,restored,process.env.DANEN_BACKUP_KEY ?? '/etc/danen/backup.key'])
  const retained = (await run('rclone',['lsjson',remote+':',...flags])).trim()
  const remoteBackups = (retained ? JSON.parse(retained) : [])
    .map(file => file.Name ?? file.Path)
    .filter(name => /^messages-[0-9T:.Z-]+-[a-f0-9]{8}\.enc$/.test(name))
    .sort()
  for (const old of remoteBackups.slice(0,Math.max(0,remoteBackups.length-14))) {
    await run('rclone',['deletefile',remote+':'+old,...flags])
  }
  const localDirectory=process.env.DANEN_BACKUP_DIR ?? '/var/backups/danen'
  const localBackups=(await readdir(localDirectory))
    .filter(name=>/^messages-[0-9T:.Z-]+-[a-f0-9]{8}\.enc$/.test(name))
    .sort()
  for(const old of localBackups.slice(0,Math.max(0,localBackups.length-14))){
    await unlink(join(localDirectory,old))
  }
  await writeFile('/var/backups/danen/offsite-status.json',JSON.stringify({
    provider:'google_drive',folder,archive:basename(snapshot.archive),verifiedAt:new Date().toISOString(),
    sha256:snapshot.sha256,automated:true,integrity:'ok',remoteRetained:Math.min(remoteBackups.length,14),
  },null,2),{mode:0o600})
  console.log(JSON.stringify({provider:'google_drive',integrity:'ok',downloadedAndVerified:true}))
} finally {await rm(work,{recursive:true,force:true})}
