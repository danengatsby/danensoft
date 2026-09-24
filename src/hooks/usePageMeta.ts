import { useEffect } from 'react'
import { company } from '../content/site'

/** Setează titlul documentului și meta description pentru pagina curentă. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} · ${company.name}`

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [title, description])
}
