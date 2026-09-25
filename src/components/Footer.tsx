import { useLanguage } from '../hooks/useLanguage'
import { Link } from './LocalizedLink'
import { company, legalNav, nav, serverNav, services } from '../content/site'
import { ArrowUpRight } from './Icons'

export default function Footer() {
  const { t, language } = useLanguage()
  return (
    <footer className="site-footer company-footer"><div className="wrap">
      <div className="company-footer__grid">
        <div className="company-footer__intro"><Link to="/" className="brand"><span className="brand__mark" aria-hidden="true">{company.initials}</span><span>{t("Dan ")}<b>{t("Enache")}</b></span></Link><p>{t("Dezvoltare software, integrări și operare cloud pentru afaceri.")}</p><span className="company-footer__location">{t(company.location)}</span></div>
        <div><h2>{t("Companie")}</h2><ul>{nav.map((item) => <li key={item.to}><Link to={item.to}>{t(item.label)}</Link></li>)}{serverNav.map((item) => <li key={item.to}><a href={item.to + (language === 'en' ? '?lang=en' : '')} rel="nofollow">{t(item.label)}</a></li>)}</ul></div>
        <div><h2>{t("Servicii")}</h2><ul>{services.map((service) => <li key={service.id}><Link to={`/servicii#${service.id}`}>{t(service.title)}</Link></li>)}</ul></div>
        <div className="company-footer__contact"><h2>{t("Discutăm un proiect?")}</h2><a href={`mailto:${company.email}`}>{t(company.email)}<ArrowUpRight /></a><p>{t("Revenim în maximum două zile lucrătoare.")}</p><Link to="/contact" className="text-link">{t("Trimiteți o solicitare ")}<ArrowUpRight /></Link></div>
      </div>
      <div className="site-footer__bar"><span>© {new Date().getFullYear()} {t(company.name)}{t(" · Dezvoltare software")}</span>{legalNav.map((item) => <Link key={item.to} to={item.to}>{t(item.label)}</Link>)}</div>
    </div></footer>
  )
}
