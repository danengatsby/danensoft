/**
 * QA vizual și de accesibilitate pe build-ul servit de nginx.
 *
 *   node scripts/qa.mjs [baseUrl]
 *
 * Pentru fiecare rută × lățime × temă × limbă verifică:
 *   - erori în consolă și excepții de runtime
 *   - overflow orizontal
 *   - încălcări axe de nivel serious/critical
 *   - contrastul minim al textului mic (prin axe: color-contrast)
 * și salvează câte o captură în qa-screens/.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const { localizePath } = await vite.ssrLoadModule('/src/lib/routes.ts')
await vite.close()

const BASE = process.argv[2] ?? 'http://127.0.0.1:8090'
const OUT = 'qa-screens'

const ROUTES = [
  ['acasa', '/', 200],
  ['servicii', '/servicii', 200],
  ['proiecte', '/proiecte', 200],
  ['contabo', '/proiecte/contabo/', 200],
  ['pcpens', '/proiecte/pcpens/', 200],
  ['poetio', '/proiecte/poetio/', 200],
  ['rvr-taxi', '/proiecte/rvr-taxi/', 200],
  ['despre', '/despre', 200],
  ['contact', '/contact', 200],
  ['confidentialitate', '/confidentialitate', 200],
  ['404', '/ruta-inexistenta', 404],
]

const WIDTHS = [360, 768, 1024, 1440]
const THEMES = ['dark', 'light']
const LANGUAGES = ['ro', 'en']

const problems = []
const note = (kind, where, detail) => {
  problems.push({ kind, where, detail })
  console.log(`  ✗ ${kind} — ${where}: ${detail}`)
}

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const summary = []

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
      })
      // Preferința de temă este citită din localStorage la încărcare.
      await context.addInitScript(
        ({ theme, language }) => {
          window.localStorage.setItem('dan-enache-theme', theme)
          window.localStorage.setItem('dan-enache-language', language === 'en' ? 'ro' : 'en')
        },
        { theme, language },
      )

      for (const [name, sourceRoute, expectedStatus] of ROUTES) {
        const route = expectedStatus === 404 && language === 'en' ? '/en/unknown-page' : localizePath(sourceRoute, language)
        const page = await context.newPage()
        const where = `${language} ${theme} ${width}px ${route}`

        const consoleErrors = []
        page.on('console', (message) => {
          // Chromium raportează și statusul documentului 404 în consolă.
          // Ignorăm doar acest răspuns așteptat, nu resursele lipsă sau erorile JS.
          if (
            expectedStatus === 404 &&
            message.location().url === BASE + route &&
            message.text().startsWith('Failed to load resource: the server responded with a status of 404')
          ) return
          if (message.type() === 'error') consoleErrors.push(message.text())
        })
        page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

        const response = await page.goto(BASE + route, { waitUntil: 'networkidle' })
        if (!response || response.status() !== expectedStatus) {
          note('http', where, `status ${response ? response.status() : 'fără răspuns'}, așteptat ${expectedStatus}`)
        }

        // Overflow orizontal: documentul nu trebuie să fie mai lat decât fereastra.
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement
          const extra = doc.scrollWidth - doc.clientWidth
          if (extra <= 0) return null
          // Identifică elementele care depășesc, ca reparația să fie țintită.
          const guilty = [...document.querySelectorAll('*')]
            .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
            .slice(0, 5)
            .map((el) => el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(' ')[0]}` : ''))
          return { extra, guilty }
        })
        if (overflow) {
          note('overflow', where, `+${overflow.extra}px · ${overflow.guilty.join(', ')}`)
        }

        // Tema aplicată trebuie să corespundă preferinței salvate.
        const applied = await page.evaluate(() => document.documentElement.dataset.theme)
        if (applied !== theme) note('temă', where, `aplicat "${applied}"`)
        const appliedLanguage = await page.evaluate(() => document.documentElement.lang)
        if (appliedLanguage !== language) note('limbă', where, `aplicat "${appliedLanguage}"`)

        const axe = await new AxeBuilder({ page })
          // Fragmentele de cod sunt decor pur, marcate aria-hidden și intenționat estompate.
          .exclude('.code-backdrop')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        const serious = axe.violations.filter((v) =>
          ['serious', 'critical'].includes(v.impact ?? ''),
        )
        for (const violation of serious) {
          note(
            `axe/${violation.impact}`,
            where,
            `${violation.id} × ${violation.nodes.length} — ${violation.nodes[0]?.target?.join(' ')}`,
          )
        }

        if (consoleErrors.length) {
          note('consolă', where, consoleErrors.join(' | '))
        }

        await page.screenshot({
          path: `${OUT}/${language}-${theme}-${width}-${name}.png`,
          fullPage: width === 1440,
        })

        summary.push({
          language,
          theme,
          width,
          route,
          status: response?.status() ?? null,
          expectedStatus,
          overflow: Boolean(overflow),
          axeSerious: serious.length,
          consoleErrors: consoleErrors.length,
        })
        await page.close()
      }
      await context.close()
      console.log(`✓ ${language} ${theme} @ ${width}px`)
    }
  }
}

await browser.close()
await writeFile(`${OUT}/summary.json`, JSON.stringify({ summary, problems }, null, 2))

console.log(
  `\n${summary.length} combinații verificate · ${problems.length} probleme găsite`,
)
process.exit(problems.length ? 1 : 0)
