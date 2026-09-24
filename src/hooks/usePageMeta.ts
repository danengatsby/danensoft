import { useEffect } from 'react'
import { company } from '../content/site'
import { useLanguage } from './useLanguage'

/** Setează titlul documentului și meta description pentru pagina curentă. */
export function usePageMeta(sourceTitle: string, sourceDescription: string) {
  const { t, language } = useLanguage()
  const title = t(sourceTitle)
  const description = t(sourceDescription)
  useEffect(() => {
    const fullTitle = `${title} · ${company.name}`
    const rawPath = window.location.pathname.replace(/\/+$/, '')
    const canonicalPath = rawPath ? `${rawPath}/` : '/'
    const canonicalUrl = new URL(canonicalPath, company.siteUrl).toString()

    document.title = fullTitle

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.appendChild(element)
      }
      element.content = value
    }

    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', language === 'en' ? 'en_GB' : 'ro_RO')
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [title, description, language])
}
