import { constants } from 'node:fs'
import { cp, mkdir, readFile, readdir, lstat, readlink, rename, rm, symlink, copyFile, writeFile } from 'node:fs/promises'
import { join, resolve, relative, dirname } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const validId = (id) => /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(id)

async function filesIn(directory, prefix = '') {
  const files = []
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = join(prefix, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Link nepermis în release: ${path}`)
    if (entry.isDirectory()) files.push(...await filesIn(directory, path))
    else if (entry.isFile()) files.push(path)
    else throw new Error(`Fișier special nepermis: ${path}`)
  }
  return files.sort()
}

export async function inspectSite(site, csp) {
  const files = await filesIn(site)
  for (const required of ['index.html', '404.html', 'sitemap.xml']) {
    if (!files.includes(required)) throw new Error(`Lipsește ${required}`)
  }
  const hashes = {}
  for (const file of files) {
    if (!/^[a-zA-Z0-9_.\-/]+$/.test(file)) throw new Error(`Nume de fișier nepermis: ${file}`)
    if (file.split('/').some((part) => part.startsWith('.'))) throw new Error(`Fișier ascuns nepermis: ${file}`)
    const bytes = await readFile(join(site, file))
    hashes[file] = hash(bytes)
    if (!file.endsWith('.html')) continue
    const html = bytes.toString('utf8')
    if (!/<h1[\s>]/.test(html)) throw new Error(`HTML neprerandat: ${file}`)
    for (const [, code] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      const token = `'sha256-${createHash('sha256').update(code).digest('base64')}'`
      if (!csp.includes(token)) throw new Error(`Hash CSP absent pentru ${file}: ${token}`)
    }
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
      if (!files.includes(asset.slice(1))) throw new Error(`Resursă absentă: ${asset}`)
    }
  }
  const sitemap = await readFile(join(site, 'sitemap.xml'), 'utf8')
  const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => new URL(url).pathname)
  for (const route of routes) {
    const path = `${route.replace(/^\/+|\/+$/g, '')}/index.html`.replace(/^\//, '')
    if (!files.includes(path)) throw new Error(`Ruta ${route} nu are HTML prerandat`)
  }
  return { hashes, routes }
}

export async function pointer(root, name) {
  try {
    const target = await readlink(join(root, name))
    const path = relative(join(root, 'releases'), resolve(root, target))
    const parts = path.split('/')
    if (parts.length !== 2 || !validId(parts[0]) || parts[1] !== 'site') throw new Error(`Link ${name} invalid`)
    return parts[0]
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function switchTo(root, name, id) {
  const temporary = join(root, `.deploy-${randomUUID()}.tmp`)
  try {
    await symlink(`releases/${id}/site`, temporary)
    await rename(temporary, join(root, name))
  } finally { await rm(temporary, { force: true }) }
}

export async function withReleaseLock(root, work) {
  const lock = join(root, '.deploy-lock')
  await mkdir(lock) // EEXIST înseamnă publicare activă sau oprire necontrolată: nu o suprascriem.
  try {
    await writeFile(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, started: new Date().toISOString() }))
    return await work()
  } finally { await rm(lock, { recursive: true, force: true }) }
}

export async function stageRelease({ root, source, id, csp }) {
  if (!validId(id)) throw new Error('Identificator release invalid')
  const release = join(root, 'releases', id)
  await mkdir(join(root, 'releases'), { recursive: true })
  await mkdir(release)
  try {
    if ((await lstat(source)).isSymbolicLink()) throw new Error('Sursa nu poate fi un link')
    await cp(source, join(release, 'site'), { recursive: true, errorOnExist: true, force: false })
    const site = join(release, 'site')
    await writeFile(join(site, '__release.json'), JSON.stringify({ id }))
    const manifest = await inspectSite(site, csp)
    // Resursele cu hash rămân accesibile și pentru pagini deja deschise sau rollback.
    for (const [file, digest] of Object.entries(manifest.hashes).filter(([file]) => file.startsWith('assets/'))) {
      const shared = join(root, 'shared-assets', file.slice(7))
      await mkdir(dirname(shared), { recursive: true })
      try { await copyFile(join(site, file), shared, constants.COPYFILE_EXCL) }
      catch (error) {
        if (error.code !== 'EEXIST' || hash(await readFile(shared)) !== digest) throw error
      }
    }
    await writeFile(join(release, 'manifest.json'), JSON.stringify({ id, created: new Date().toISOString(), ...manifest }, null, 2))
    return manifest
  } catch (error) {
    await rm(release, { recursive: true, force: true })
    throw error
  }
}

export async function activateRelease({ root, id, csp, verify, runtime }) {
  if (!validId(id)) throw new Error('Identificator release invalid')
  const release = join(root, 'releases', id)
  const manifest = JSON.parse(await readFile(join(release, 'manifest.json'), 'utf8'))
  const actual = await inspectSite(join(release, 'site'), csp)
  if (JSON.stringify(actual.hashes) !== JSON.stringify(manifest.hashes)) throw new Error('Release modificat după pregătire')
  for (const [file, digest] of Object.entries(actual.hashes).filter(([file]) => file.startsWith('assets/'))) {
    if (hash(await readFile(join(root, 'shared-assets', file.slice(7)))) !== digest) throw new Error(`Resursă partajată deteriorată: ${file}`)
  }
  if (runtime) await runtime.validate(id)
  const old = await pointer(root, 'current')
  if (old === id) throw new Error('Versiunea este deja activă')
  await switchTo(root, 'current', id)
  try {
    if (runtime) await runtime.activate(id)
    await verify(id, actual.routes)
  } catch (error) {
    if (old) await switchTo(root, 'current', old)
    else await rm(join(root, 'current'))
    if (runtime) await runtime.restore(old)
    throw new Error(`Verificarea a eșuat; versiunea anterioară a fost restaurată: ${error.message}`)
  }
  if (old) await switchTo(root, 'previous', old)
  return { id, previous: old }
}
