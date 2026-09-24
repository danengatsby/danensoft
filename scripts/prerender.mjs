import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const DIST = resolve(ROOT, '.build/dist')

const pages = [
  {
    path: '/',
    title: 'Dezvoltare software pentru afaceri · Dan Enache',
    description:
      'Dan Enache: dezvoltare de aplicații web și SaaS, integrări, automatizări și operare cloud. Un partener tehnic de la analiză la mentenanță.',
  },
  {
    path: '/servicii',
    title: 'Servicii · Dan Enache',
    description:
      'Aplicații cloud, integrări și automatizări, AI aplicat, mentenanță și operare pe infrastructură proprie.',
  },
  {
    path: '/proiecte',
    title: 'Proiecte · Dan Enache',
    description:
      'Contabo, PCS, Poetio și RVR Taxi: proiecte reale de aplicații web, site-uri de prezentare și publicații digitale, alături de demonstrații interne.',
  },
  {
    path: '/despre',
    title: 'Despre · Dan Enache',
    description:
      'Dan Enache, inginer software din Iași. Aplicații cloud, produse SaaS și colaborare directă, de la idee la lansare.',
  },
  {
    path: '/contact',
    title: 'Contact · Dan Enache',
    description:
      'Scrieți-ne despre procesul pe care vreți să îl automatizați sau despre aplicația cloud de care aveți nevoie.',
  },
  {
    path: '/confidentialitate',
    title: 'Confidențialitate · Dan Enache',
    description:
      'Ce date colectăm prin formularul de contact, ce facem cu ele și ce drepturi aveți.',
  },
  {
    path: '/404.html',
    title: 'Pagină inexistentă · Dan Enache',
    description: 'Adresa accesată nu corespunde niciunei pagini.',
  },
]

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function replaceMeta(html, attribute, key, value) {
  const pattern = new RegExp(`<meta(?=[^>]*${attribute}="${key}")[^>]*>`, 'i')
  return html.replace(
    pattern,
    `<meta ${attribute}="${key}" content="${escapeAttribute(value)}" />`,
  )
}

const vite = await createServer({
  root: ROOT,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
})

try {
  const template = await readFile(resolve(DIST, 'index.html'), 'utf8')
  const { render } = await vite.ssrLoadModule('/src/prerender.tsx')
  const { publishedProjects, company } = await vite.ssrLoadModule('/src/content/site.ts')
  pages.push(...publishedProjects.map((project) => ({
    path: `/proiecte/${project.id}`,
    title: `${project.title} · ${company.name}`,
    description: project.summary ?? project.approach,
  })))
  const output = []

  for (const page of pages) {
    const markup = render(page.path)
    const canonical = page.path === '/404.html'
      ? null
      : page.path === '/'
        ? 'https://danenachesoft.space/'
        : `https://danenachesoft.space${page.path}/`
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title}</title>`)
      .replace(
        /<link rel="canonical" href="[^"]*"\s*\/?>/i,
        canonical ? `<link rel="canonical" href="${canonical}" />` : '',
      )
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)

    html = replaceMeta(html, 'name', 'description', page.description)
    html = replaceMeta(html, 'property', 'og:title', page.title)
    html = replaceMeta(html, 'property', 'og:description', page.description)
    html = canonical
      ? replaceMeta(html, 'property', 'og:url', canonical)
      : html.replace(/<meta property="og:url"[^>]*>/i, '')
    html = replaceMeta(html, 'name', 'twitter:title', page.title)
    html = replaceMeta(html, 'name', 'twitter:description', page.description)

    output.push({ ...page, html })
  }

  for (const page of output) {
    const target = page.path === '/404.html'
      ? resolve(DIST, '404.html')
      : resolve(DIST, page.path.slice(1), 'index.html')
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, page.html)
  }

  console.log(`Prerandare: ${output.length} pagini HTML.`)
} finally {
  await vite.close()
}
