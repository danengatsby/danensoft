import { useLanguage } from '../hooks/useLanguage'

export default function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div className="language-switch" role="group" aria-label={t('Limba site-ului')}>
      <button type="button" lang="ro" aria-label="Română" title="Română" aria-pressed={language === 'ro'} onClick={() => setLanguage('ro')}>RO</button>
      <button type="button" lang="en" aria-label="English" title="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    </div>
  )
}
