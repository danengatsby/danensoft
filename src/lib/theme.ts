export type Theme = 'light' | 'dark'

export const THEME_KEY = 'dan-enache-theme'

/** Tema implicită a site-ului, folosită când nu există o alegere salvată. */
export const DEFAULT_THEME: Theme = 'dark'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/** Citește alegerea salvată; revine la tema implicită dacă lipsește. */
export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    // localStorage poate fi blocat (mod privat, cookie-uri restricționate).
    return DEFAULT_THEME
  }
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Preferința nu se poate salva; tema rămâne activă doar în sesiunea curentă.
  }
}

/** Aplică tema pe <html>, inclusiv `color-scheme` pentru controale native. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}
