import { createContext } from 'react'
import { english } from '../content/english'

import type { Language } from './routes'
export type { Language } from './routes'
export const LANGUAGE_KEY = 'dan-enache-language'

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
  t: Translator
}>({ language: 'ro', t: (text, values) => translate('ro', text, values) })
