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
      } else {
        id = process.argv[3] ?? await pointer(root, 'previous')
        if (!id) throw new Error('Nu există o versiune precedentă')
      }
      console.log(JSON.stringify(await activateRelease({ root, id, csp, verify })))
    })
  } else throw new Error('Utilizare: node scripts/release.mjs publish|rollback [id]|list')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
