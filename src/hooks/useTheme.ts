import { useCallback, useEffect, useState } from 'react'
import { applyTheme, persistTheme, readStoredTheme, type Theme } from '../lib/theme'

/** Tema curentă și comutarea între zi și noapte, cu salvarea preferinței. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())

  // Sincronizează DOM-ul cu starea React (efect corect: sistem extern).
  useEffect(() => {
    applyTheme(theme)
    persistTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
