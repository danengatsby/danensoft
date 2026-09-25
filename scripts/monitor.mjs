import { readFile, writeFile, rename, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { X509Certificate } from 'node:crypto'
import { sendMail } from '../server/mail.mjs'

const checks = {}
const directory = process.env.DANEN_MONITOR_DIR ?? '/var/lib/danen-monitor'
const now = Date.now()
const check = async (name, fn) => {
  try { const detail = await fn(); checks[name] = { ok:true, detail } }
  catch (error) { checks[name] = { ok:false, detail:error.message } }
}
await check('https_api', async () => {
  const response = await fetch('https://danenachesoft.space/api/health', { signal:AbortSignal.timeout(15000) })
  const result = await response.json()
  if (!response.ok || result.status !== 'ok') throw new Error('API unavailable')
  return result.release
})
await check('certificate', async () => {
  const certificate = new X509Certificate(await readFile('/etc/letsencrypt/live/danenachesoft.space/cert.pem'))
  const days = Math.floor((new Date(certificate.validTo).getTime() - now) / 86400_000)
  if (days < 14) throw new Error('TLS expires in ' + days + ' days')
  return days + ' days remaining'
})
await check('local_backup', async () => {
  const path = '/var/backups/danen'
  const files = (await readdir(path)).filter(name => /^messages-.*\.db$/.test(name)).sort()
  if (!files.length) throw new Error('No backup')
  const file = join(path, files.at(-1))
  if (now - (await stat(file)).mtimeMs > 36 * 3600_000) throw new Error('Backup older than 36 hours')
  return files.at(-1)
})
await check('offsite_backup', async () => {
  const status = JSON.parse(await readFile('/var/backups/danen/offsite-status.json', 'utf8'))
  if (now - Date.parse(status.verifiedAt) > 36 * 3600_000) throw new Error('External backup older than 36 hours')
  return 'Downloaded, decrypted and verified'
})
await check('mail_queues', async () => {
  const db = new DatabaseSync(process.env.DANEN_DB ?? '/var/lib/danen/messages.db', { readOnly:true })
  try {
    let failed = 0, late = 0
    for (const table of ['mail_jobs','account_mail_jobs']) {
      failed += db.prepare('SELECT COUNT(*) AS n FROM ' + table + " WHERE status = 'failed'").get().n
      late += db.prepare('SELECT COUNT(*) AS n FROM ' + table + " WHERE status IN ('pending', 'sending') AND created_at < ?")
        .get(new Date(now - 15 * 60_000).toISOString()).n
    }
    if (failed || late) throw new Error(failed + ' failed, ' + late + ' delayed')
    return 'No failed or delayed mail'
  } finally { db.close() }
})
const report = { checkedAt:new Date(now).toISOString(), ok:Object.values(checks).every(item => item.ok), checks }
let previous = {}
try { previous = JSON.parse(await readFile(join(directory, 'status.json'),'utf8')) } catch { /* First run. */ }
const signature = Object.keys(checks).filter(key => !checks[key].ok).sort().join(',')
const changed = previous.signature !== signature
const due = !report.ok && now - Date.parse(previous.alertedAt ?? '2000-01-01') > 24 * 3600_000
report.signature = signature
report.alertedAt = previous.alertedAt
if ((changed && (!report.ok || previous.ok === false)) || due) {
  const result = await sendMail({
    subject:'Danensoft monitoring: ' + (report.ok ? 'recovered' : 'attention required'),
    text:JSON.stringify(report,null,2),
  })
  if (result.id) report.alertedAt = new Date(now).toISOString()
}
await writeFile(join(directory,'status.json.tmp'), JSON.stringify(report,null,2), { mode:0o640 })
await rename(join(directory,'status.json.tmp'), join(directory,'status.json'))
console.log(JSON.stringify(report))
if (!report.ok) process.exitCode = 1
