/**
 * Recalculează hash-urile scripturilor inline din `dist/index.html`, folosite în
 * politica de securitate a conținutului din nginx.
 *
 *   npm run build && npm run csp:hash
 *
 * Rulați-l după orice modificare a scripturilor din `index.html` și puneți
 * valorile afișate în `/etc/nginx/snippets/danen-csp.conf`, apoi:
 *
 *   nginx -t && systemctl reload nginx
 *
 * Fără actualizare, browserul blochează scripturile inline.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const SNIPPET = '/etc/nginx/snippets/danen-csp.conf'
const html = readFileSync(new URL('../.build/dist/index.html', import.meta.url), 'utf8')

const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
if (inline.length === 0) {
  console.log('Niciun script inline în dist/index.html — scoateți hash-ul din CSP.')
  process.exit(0)
}

const hashes = inline.map(
  ([, code]) => `'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`,
)

console.log(`Scripturi inline: ${hashes.length}`)
console.log(`\nscript-src 'self' ${hashes.join(' ')}\n`)

try {
  const current = readFileSync(SNIPPET, 'utf8')
  const missing = hashes.filter((hash) => !current.includes(hash))
  console.log(
    missing.length
      ? `${SNIPPET} este vechi: lipsesc ${missing.join(', ')}`
      : `${SNIPPET} este la zi.`,
  )
} catch {
  console.log(`${SNIPPET} nu poate fi citit (rulați ca root pentru verificare).`)
}
