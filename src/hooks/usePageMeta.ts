import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { company } from '../content/site'
import { useLanguage } from './useLanguage'
import { findPage, languages, localizedPagePath } from '../lib/routes'

/** Metadatele folosesc aceeași definiție de pagină ca prerandarea și sitemap-ul. */
export function usePageMeta(sourceTitle: string, sourceDescription: string) {
  const { pathname } = useLocation()
  const { t, language } = useLanguage()
  const page = findPage(pathname)
  const title = t(page?.title ?? sourceTitle)
  const description = t(page?.description ?? sourceDescription)
  useEffect(() => {
    const fullTitle = `${title} · ${company.name}`
    const canonicalUrl = page ? new URL(localizedPagePath(page, language), company.siteUrl).toString() : null
    document.title = fullTitle
    const setMeta = (attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.appendChild(element)
      }
      element.content = value
    }
    setMeta('name', 'description', description)
    setMeta('name', 'robots', page ? 'index,follow' : 'noindex,follow')
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:locale', language === 'en' ? 'en_GB' : 'ro_RO')
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('property', 'og:image:alt', t('Dan Enache — aplicații cloud și produse SaaS'))
    document.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach((element) => element.remove())
    if (page && canonicalUrl) {
      setMeta('property', 'og:url', canonicalUrl)
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = canonicalUrl
      document.head.appendChild(canonical)
      for (const locale of [...languages, 'x-default'] as const) {
        const alternate = document.createElement('link')
        alternate.rel = 'alternate'
        alternate.hreflang = locale
        alternate.href = new URL(localizedPagePath(page, locale === 'x-default' ? 'ro' : locale), company.siteUrl).toString()
        document.head.appendChild(alternate)
      }
    } else {
      document.querySelector('meta[property="og:url"]')?.remove()
    }
  }, [title, description, language, page, t])
}
