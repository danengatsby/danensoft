// @vitest-environment node
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it, expect } from 'vitest'
import { stageRuntime, verifyRuntime, switchRuntime, runtimePointer } from './lib/runtime.mjs'
import { encryptBackup, decryptBackup } from './lib/encrypted-backup.mjs'
import { randomBytes } from 'node:crypto'
it('API releases contain independent files and reject changed artifacts', async () => {
  const root = await mkdtemp(join(tmpdir(),'danen-runtime-test-'))
  try {
    await mkdir(join(root,'server'))
    await mkdir(join(root,'releases/v1'), { recursive:true })
    await writeFile(join(root,'server/index.mjs'),'console.log("v1")')
    await writeFile(join(root,'package.json'),'{}')
    await writeFile(join(root,'package-lock.json'),'{}')
    await stageRuntime({ root,id:'v1',install:false })
    await writeFile(join(root,'server/index.mjs'),'console.log("v2")')
    expect(await readFile(join(root,'releases/v1/runtime/server/index.mjs'),'utf8')).toContain('v1')
    await verifyRuntime(root,'v1')
    await switchRuntime(root,'v1')
    expect(await runtimePointer(root)).toBe('v1')
    await writeFile(join(root,'releases/v1/runtime/server/index.mjs'),'tampered')
    await expect(verifyRuntime(root,'v1')).rejects.toThrow('modified')
    await expect(switchRuntime(root,'../escape')).rejects.toThrow('Invalid')
  } finally { await rm(root,{ recursive:true,force:true }) }
})
it('encrypted backups roundtrip; wrong keys and tampering cannot produce restored files', async () => {
  const dir = await mkdtemp(join(tmpdir(),'danen-encryption-test-'))
  try {
    const source = join(dir,'source'), key = join(dir,'key'), enc = join(dir,'encrypted')
    const content = randomBytes(256)
    await writeFile(source,content); await writeFile(key,randomBytes(32))
    await encryptBackup(source,enc,key)
    expect((await readFile(enc)).includes(content)).toBe(false)
    await decryptBackup(enc,join(dir,'restored'),key)
    expect(await readFile(join(dir,'restored'))).toEqual(content)
    await writeFile(join(dir,'wrong-key'),randomBytes(32))
    await expect(decryptBackup(enc,join(dir,'wrong'),join(dir,'wrong-key'))).rejects.toThrow()
    const corrupt = await readFile(enc); corrupt[40] ^= 1; await writeFile(enc,corrupt)
    await expect(decryptBackup(enc,join(dir,'corrupt'),key)).rejects.toThrow()
  } finally { await rm(dir,{ recursive:true,force:true }) }
})
