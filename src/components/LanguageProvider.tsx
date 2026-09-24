import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isLanguage, LANGUAGE_KEY, LanguageContext, readLanguage, translate, type Translator } from '../lib/language'

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(readLanguage)
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem(LANGUAGE_KEY, language) } catch { /* Alegerea funcționează și fără stocare. */ }
  }, [language])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === LANGUAGE_KEY || event.key === null) {
        setLanguage(isLanguage(event.newValue) ? event.newValue : 'ro')
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  const t = useCallback<Translator>((text, values) => translate(language, text, values), [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
