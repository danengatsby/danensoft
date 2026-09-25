// @vitest-environment node
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { stageRelease, activateRelease, pointer, withReleaseLock } from './lib/releases.mjs'
let root, source
const csp = ''
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'danen-release-test-'))
  source = join(root, 'candidate')
  await mkdir(join(source, 'assets'), { recursive: true })
  await writeFile(join(source, 'index.html'), '<h1>Acasă</h1><script src="/assets/app-v1.js"></script>')
  await writeFile(join(source, '404.html'), '<h1>Nu există</h1>')
  await writeFile(join(source, 'assets/app-v1.js'), 'v1')
  await writeFile(join(source, 'sitemap.xml'), '<urlset><url><loc>https://example.test/</loc></url></urlset>')
})
afterEach(() => rm(root, { recursive: true, force: true }))
const stage = (id) => stageRelease({ root, source, id, csp })
const activate = (id, verify = async () => {}) => activateRelease({ root, id, csp, verify })

it('pregătirea și build-ul ulterior nu modifică versiunea activă; rollbackul păstrează assets noi', async () => {
  await stage('v1'); await activate('v1')
  await writeFile(join(source, 'index.html'), '<h1>Nou</h1><script src="/assets/app-v2.js"></script>')
  await writeFile(join(source, 'assets/app-v2.js'), 'v2')
  await stage('v2')
  expect(await readFile(join(root, 'current/index.html'), 'utf8')).toContain('Acasă')
  await activate('v2')
  expect(await pointer(root, 'current')).toBe('v2')
  expect(await pointer(root, 'previous')).toBe('v1')
  await activate(await pointer(root, 'previous'))
  expect(await pointer(root, 'current')).toBe('v1')
  expect(await readFile(join(root, 'shared-assets/app-v2.js'), 'utf8')).toBe('v2')
})
it('revine automat la versiunea veche dacă verificarea HTTP eșuează', async () => {
  await stage('v1'); await activate('v1'); await stage('v2')
  await expect(activate('v2', async () => { throw new Error('HTTP 500') })).rejects.toThrow('restaurată')
  expect(await pointer(root, 'current')).toBe('v1')
})
it('refuză HTML neprerandat, resurse lipsă și rute fără pagini', async () => {
  await writeFile(join(source, 'index.html'), '<div id="root"></div>')
  await expect(stage('empty')).rejects.toThrow('neprerandat')
  await writeFile(join(source, 'index.html'), '<h1>Test</h1><script src="/assets/missing.js"></script>')
  await expect(stage('missing')).rejects.toThrow('absentă')
  await writeFile(join(source, 'index.html'), '<h1>Test</h1>')
  await writeFile(join(source, 'sitemap.xml'), '<loc>https://example.test/missing/</loc>')
  await expect(stage('route')).rejects.toThrow('HTML prerandat')
  expect(await readdir(join(root, 'releases'))).toEqual([])
})
it('refuză scripturi inline nepermise de CSP și linkuri simbolice', async () => {
  await writeFile(join(source, 'index.html'), '<h1>Test</h1><script>alert(1)</script>')
  await expect(stage('csp')).rejects.toThrow('CSP')
  await writeFile(join(source, 'index.html'), '<h1>Test</h1>')
  await symlink('/etc/passwd', join(source, 'secret'))
  await expect(stage('link')).rejects.toThrow('Link nepermis')
})
it('refuză schimbarea unui release validat sau coliziunile de assets', async () => {
  await stage('v1')
  await writeFile(join(root, 'releases/v1/site/index.html'), '<h1>Modificat</h1>')
  await expect(activate('v1')).rejects.toThrow('modificat')
  await writeFile(join(source, 'assets/app-v1.js'), 'alte date')
  await expect(stage('collision')).rejects.toThrow()
})
it('blochează publicările concurente și eliberează blocarea după eroare', async () => {
  await expect(withReleaseLock(root, async () => {
    await expect(withReleaseLock(root, async () => {})).rejects.toMatchObject({ code: 'EEXIST' })
    throw new Error('test')
  })).rejects.toThrow('test')
  await expect(withReleaseLock(root, async () => 'ok')).resolves.toBe('ok')
})
it('refuză identificatori care ies din directorul releases', async () => {
  await expect(stage('../escape')).rejects.toThrow('invalid')
  await expect(activate('../escape')).rejects.toThrow('invalid')
})

it('coordinates API activation with frontend rollback when startup fails', async () => {
  await stage('v1'); await activate('v1'); await stage('v2')
  let activeAPI = 'v1'
  const runtime = {
    validate: async () => {},
    activate: async id => { activeAPI = id; throw new Error('API failed') },
    restore: async id => { activeAPI = id },
  }
  await expect(activateRelease({ root, id:'v2', csp, verify:async () => {}, runtime })).rejects.toThrow('restaurată')
  expect(await pointer(root,'current')).toBe('v1')
  expect(activeAPI).toBe('v1')
})
it('validates the API before exposing frontend changes', async () => {
  await stage('v1'); await activate('v1'); await stage('v2')
  await expect(activateRelease({ root, id:'v2', csp, verify:async () => {}, runtime:{
    validate:async () => { throw new Error('Corrupt runtime') },
  } })).rejects.toThrow('Corrupt runtime')
  expect(await pointer(root,'current')).toBe('v1')
})
