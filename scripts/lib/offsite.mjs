import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'

/** Valorile ajung și în shell-ul distant: acceptăm doar un alfabet restrâns. */
export function validateDestination(host, directory) {
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(host ?? '')) throw new Error('Destinație necesară în format utilizator@server')
  if (!/^\/[a-zA-Z0-9_/-]+$/.test(directory ?? '') || directory === '/' || directory.includes('//')) throw new Error('Cale externă absolută necesară, fără spații sau caractere speciale')
  return { host, directory: directory.replace(/\/$/, '') }
}
export async function checksum(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}
export function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = '', error = ''
    const timer = setTimeout(() => child.kill('SIGTERM'), 300_000)
    child.stdout.on('data', (chunk) => { output += chunk; if (output.length > 1_000_000) child.kill() })
    child.stderr.on('data', (chunk) => { error = (error + chunk).slice(-4000) })
    child.on('error', (e) => { clearTimeout(timer); reject(e) })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) reject(new Error(`${command} a eșuat (${code}): ${error}`))
      else resolve(output)
    })
  })
}
