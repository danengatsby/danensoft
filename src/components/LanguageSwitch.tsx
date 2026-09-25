import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { languageSwitchPath } from '../lib/routes'

export default function LanguageSwitch() {
  const { language, t } = useLanguage()
  const { pathname, search, hash } = useLocation()
  const path = pathname + search + hash
  return (
    <nav className="language-switch" aria-label={t('Limba site-ului')}>
      <Link to={languageSwitchPath(path, 'ro')} lang="ro" hrefLang="ro" aria-label="Română" title="Română" aria-current={language === 'ro' ? 'page' : undefined}>RO</Link>
      <Link to={languageSwitchPath(path, 'en')} lang="en" hrefLang="en" aria-label="English" title="English" aria-current={language === 'en' ? 'page' : undefined}>EN</Link>
    </nav>
  )
}
