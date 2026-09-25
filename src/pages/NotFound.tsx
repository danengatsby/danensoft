import { useLanguage } from '../hooks/useLanguage'
import { Link } from '../components/LocalizedLink'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowRight } from '../components/Icons'

export default function NotFound() {
  const { t } = useLanguage()
  usePageMeta('Pagină inexistentă', 'Adresa accesată nu corespunde niciunei pagini.')
  return (
    <section className="wrap error-page"><div className="error-panel"><span className="error-code">404</span><p className="eyebrow">{t("Pagina nu a fost găsită")}</p><h1>{t("Pagina aceasta nu există.")}</h1><p>{t("Verificați adresa sau continuați către una dintre secțiunile principale.")}</p><Link to="/" className="btn btn--primary">{t("Înapoi acasă ")}<ArrowRight /></Link><div className="error-links">{[['/servicii', 'Servicii software'], ['/proiecte', 'Proiecte publicate'], ['/contact', 'Contact']].map(([to, label]) => <Link to={to} key={to}>{t(label)}<ArrowRight /></Link>)}</div></div></section>
  )
}
