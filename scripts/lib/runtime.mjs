import { cp, mkdir, readFile, writeFile, readdir, lstat, readlink, symlink, rename, rm } from 'node:fs/promises'
import { join, resolve, relative } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { run } from './offsite.mjs'
const valid = id => /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(id)
async function fingerprint(root, prefix = '') {
  const hashes = {}
  for (const entry of (await readdir(join(root, prefix), { withFileTypes:true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = join(prefix, entry.name)
    if (file === 'runtime-manifest.json') continue
    if (entry.isSymbolicLink()) {
      const target = await readlink(join(root, file))
      if (relative(root, resolve(root, prefix, target)).startsWith('..')) throw new Error('Runtime symlink escapes release')
      hashes[file] = 'link:' + target
    } else if (entry.isDirectory()) Object.assign(hashes, await fingerprint(root, file))
    else if (entry.isFile()) hashes[file] = createHash('sha256').update(await readFile(join(root, file))).digest('hex')
    else throw new Error('Unsupported runtime entry')
  }
  return hashes
}
export async function stageRuntime({ root, id, install = true, source = root }) {
  if (!valid(id)) throw new Error('Invalid release id')
  const runtime = join(root, 'releases', id, 'runtime')
  await mkdir(runtime)
  try {
    for (const name of ['server', 'package.json', 'package-lock.json']) {
      if ((await lstat(join(source, name))).isSymbolicLink()) throw new Error('Runtime source symlink')
      await cp(join(source, name), join(runtime, name), { recursive:true,
        filter: path => !path.endsWith('.test.mjs') })
    }
    await writeFile(join(runtime, 'start.mjs'), 'process.env.DANEN_RELEASE_ID = ' + JSON.stringify(id) + '\nawait import("./server/index.mjs")\n')
    if (install) await run('/usr/local/bin/npm', ['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund','--prefix',runtime])
    await writeFile(join(runtime, 'runtime-manifest.json'), JSON.stringify(await fingerprint(runtime), null, 2))
  } catch (error) { await rm(runtime, { recursive:true, force:true }); throw error }
}
export async function verifyRuntime(root, id) {
  if (!valid(id)) throw new Error('Invalid release id')
  const runtime = join(root, 'releases', id, 'runtime')
  const expected = JSON.parse(await readFile(join(runtime, 'runtime-manifest.json'), 'utf8'))
  if (JSON.stringify(await fingerprint(runtime)) !== JSON.stringify(expected)) throw new Error('Runtime modified after staging')
}
export async function runtimePointer(root) {
  try {
    const path = relative(join(root, 'releases'), resolve(root, await readlink(join(root, 'api-current'))))
    const parts = path.split('/')
    if (parts.length !== 2 || !valid(parts[0]) || parts[1] !== 'runtime') throw new Error('Invalid API pointer')
    return parts[0]
  } catch (error) { if (error.code === 'ENOENT') return null; throw error }
}
export async function switchRuntime(root, id) {
  if (!valid(id)) throw new Error('Invalid release id')
  const tmp = join(root, '.deploy-' + randomUUID() + '.tmp')
  try { await symlink('releases/' + id + '/runtime', tmp); await rename(tmp, join(root,'api-current')) }
  finally { await rm(tmp, { force:true }) }
}
