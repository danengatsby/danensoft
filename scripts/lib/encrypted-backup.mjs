import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
const MAGIC = Buffer.from('DANENBK1')
export async function encryptBackup(source, target, keyFile) {
  const key = await readFile(keyFile)
  if (key.length !== 32) throw new Error('Backup key must contain 32 bytes')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(await readFile(source)), cipher.final()])
  await writeFile(target, Buffer.concat([MAGIC, iv, cipher.getAuthTag(), data]), { mode:0o600, flag:'wx' })
}
export async function decryptBackup(source, target, keyFile) {
  const key = await readFile(keyFile)
  const bytes = await readFile(source)
  if (key.length !== 32 || bytes.length < 36 || !bytes.subarray(0,8).equals(MAGIC)) throw new Error('Invalid encrypted backup')
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(8,20))
  decipher.setAuthTag(bytes.subarray(20,36))
  const data = Buffer.concat([decipher.update(bytes.subarray(36)), decipher.final()])
  await writeFile(target, data, { mode:0o600, flag:'wx' })
}
