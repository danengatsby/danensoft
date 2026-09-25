import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { LANGUAGE_KEY, LanguageContext, translate, type Translator } from '../lib/language'
import { languageFromPath } from '../lib/routes'

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const language = languageFromPath(pathname)
  useEffect(() => {
    document.documentElement.lang = language
    // Migrare: URL-ul înlocuiește vechea preferință, inclusiv pentru vizitatorii existenți.
    try { localStorage.removeItem(LANGUAGE_KEY) } catch { /* Stocarea nu este necesară. */ }
  }, [language])
  const t = useCallback<Translator>((text, values) => translate(language, text, values), [language])
  const value = useMemo(() => ({ language, t }), [language, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
