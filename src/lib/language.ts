import { createContext } from 'react'
import { english } from '../content/english'

export type Language = 'ro' | 'en'
export const LANGUAGE_KEY = 'dan-enache-language'
export const isLanguage = (value: unknown): value is Language => value === 'ro' || value === 'en'

export function readLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    return isLanguage(saved) ? saved : 'ro'
  } catch {
    return 'ro'
  }
}

export function translate(language: Language, text: string | undefined, values: Record<string, string | number> = {}): string {
  if (!text) return ''
  const translated = language === 'en'
    ? text.replace(/\S[\s\S]*\S|\S/, (key) => english[key] ?? key)
    : text
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match))
}

export type Translator = (text: string | undefined, values?: Record<string, string | number>) => string

export const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
  t: Translator
}>({ language: 'ro', setLanguage: () => {}, t: (text, values) => translate('ro', text, values) })
