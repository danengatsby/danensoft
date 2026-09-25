import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const DIST = resolve(ROOT, '.build/dist')
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
function meta(html, attribute, key, value) {
  const tag = `<meta ${attribute}="${key}" content="${escape(value)}" />`
  const pattern = new RegExp(`<meta(?=[^>]*${attribute}="${key}")[^>]*>`, 'i')
  return pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', `${tag}</head>`)
}
const vite = await createServer({ root: ROOT, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
try {
  const template = await readFile(resolve(DIST, 'index.html'), 'utf8')
  const { render } = await vite.ssrLoadModule('/src/prerender.tsx')
  const { pageDefinitions, languages, localizedPagePath } = await vite.ssrLoadModule('/src/lib/routes.ts')
  const { translate } = await vite.ssrLoadModule('/src/lib/language.ts')
  const { company } = await vite.ssrLoadModule('/src/content/site.ts')
  const url = (page, language) => new URL(localizedPagePath(page, language), company.siteUrl).toString()
  const alternates = (page, tag) => [...languages, 'x-default'].map((language) => {
    const href = url(page, language === 'x-default' ? 'ro' : language)
    return tag === 'html'
      ? `<link rel="alternate" hreflang="${language}" href="${escape(href)}" />`
      : `    <xhtml:link rel="alternate" hreflang="${language}" href="${escape(href)}" />`
  }).join('\n')
  let count = 0
  const sitemap = []
  for (const language of languages) {
    for (const page of [...pageDefinitions, null]) {
      const path = page ? localizedPagePath(page, language) : language === 'en' ? '/en/404.html' : '/404.html'
      const title = `${translate(language, page?.title ?? 'Pagină inexistentă')} · ${company.name}`
      const description = translate(language, page?.description ?? 'Adresa accesată nu corespunde niciunei pagini.')
      let html = template
        .replace(/<html lang="[^"]*"/, `<html lang="${language}"`)
        .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escape(title)}</title>`)
        .replace(/<link rel="canonical"[^>]*>/i, '')
        .replace('<div id="root"></div>', () => `<div id="root">${render(path)}</div>`)
      html = meta(html, 'name', 'description', description)
      html = meta(html, 'name', 'robots', page ? 'index,follow' : 'noindex,follow')
      html = meta(html, 'property', 'og:title', title)
      html = meta(html, 'property', 'og:description', description)
      html = meta(html, 'property', 'og:locale', language === 'en' ? 'en_GB' : 'ro_RO')
      html = meta(html, 'property', 'og:image:alt', translate(language, 'Dan Enache — aplicații cloud și produse SaaS'))
      html = meta(html, 'name', 'twitter:title', title)
      html = meta(html, 'name', 'twitter:description', description)
      if (page) {
        html = meta(html, 'property', 'og:url', url(page, language))
        html = html.replace('</head>', `<link rel="canonical" href="${escape(url(page, language))}" />\n${alternates(page, 'html')}\n</head>`)
        sitemap.push(`  <url>\n    <loc>${escape(url(page, language))}</loc>\n${alternates(page, 'xml')}\n  </url>`)
      } else {
        html = html.replace(/<meta property="og:url"[^>]*>/i, '')
      }
      const target = resolve(DIST, path.endsWith('.html') ? path.slice(1) : `${path.slice(1)}index.html`)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, html)
      count++
    }
  }
  await writeFile(resolve(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.join('\n')}\n</urlset>\n`)
  console.log(`Prerandare: ${count} pagini HTML în RO și EN; ${sitemap.length} adrese în sitemap.`)
} finally { await vite.close() }
