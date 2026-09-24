import { useContext } from 'react'
import { LanguageContext } from '../lib/language'

export function useLanguage() {
  return useContext(LanguageContext)
}
