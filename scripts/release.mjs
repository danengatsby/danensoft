import { stageRuntime, verifyRuntime, switchRuntime, runtimePointer } from './lib/runtime.mjs'
import { run } from './lib/offsite.mjs'
import { readFile, readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { withReleaseLock, stageRelease, activateRelease, pointer } from './lib/releases.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const command = process.argv[2]
const csp = await readFile('/etc/nginx/snippets/danen-csp.conf', 'utf8')
const base = process.env.DANEN_DEPLOY_URL ?? 'https://danenachesoft.space'
async function verify(id, routes) {
  let healthy = false
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const response = await fetch(base + '/api/health', { signal:AbortSignal.timeout(3000) })
      const body = await response.json()
      if (response.ok && body.status === 'ok' && body.release === id) { healthy = true; break }
    } catch { /* The restarted process may still be binding. */ }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!healthy) throw new Error('API health/version check failed')

  const marker = await fetch(`${base}/__release.json?check=${randomUUID()}`, { signal: AbortSignal.timeout(15000), cache: 'no-store' })
  if (!marker.ok || (await marker.json()).id !== id) throw new Error('nginx nu servește release-ul așteptat')
  for (const path of [...routes, `/release-check-absent-${randomUUID()}`]) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) })
    if (response.status !== (routes.includes(path) ? 200 : 404)) throw new Error(`HTTP neașteptat pentru ${path}: ${response.status}`)
    await response.arrayBuffer()
  }
}
try {
  if (command === 'list') {
    console.log(JSON.stringify({ current: await pointer(root, 'current'), previous: await pointer(root, 'previous'), releases: await readdir(join(root, 'releases')) }, null, 2))
  } else if (['publish', 'rollback'].includes(command)) {
    await withReleaseLock(root, async () => {
      let id
      if (command === 'publish') {
        id = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`
        await stageRelease({ root, source: join(root, '.build/dist'), id, csp })
        await stageRuntime({ root, id })
      } else {
        id = process.argv[3] ?? await pointer(root, 'previous')
        if (!id) throw new Error('Nu există o versiune precedentă')
      }
      const oldRuntime = await runtimePointer(root)
      if (!oldRuntime) throw new Error('Bootstrap api-current before full releases')
      await run('sudo', ['-n', 'systemctl', 'start', 'danen-backup.service'])
      const runtime = {
        validate: target => verifyRuntime(root, target),
        async activate(target) {
          await switchRuntime(root, target)
          await run('sudo', ['-n', 'systemctl', 'restart', 'danen-api'])
        },
        async restore() {
          await switchRuntime(root, oldRuntime)
          await run('sudo', ['-n', 'systemctl', 'restart', 'danen-api'])
        },
      }
      console.log(JSON.stringify(await activateRelease({ root, id, csp, verify, runtime })))
    })
  } else throw new Error('Utilizare: node scripts/release.mjs publish|rollback [id]|list')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
