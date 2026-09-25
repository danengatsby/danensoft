import { useLanguage } from '../hooks/useLanguage'
import { Link } from '../components/LocalizedLink'
import PageIntro from '../components/PageIntro'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowUpRight } from '../components/Icons'
import { privacySections, privacyUpdated } from '../content/privacy'
import { company } from '../content/site'

export default function Privacy() {
  const { t } = useLanguage()
  usePageMeta('Confidențialitate', 'Ce date colectăm prin formularul de contact, ce facem cu ele și ce drepturi aveți.')
  return (
    <>
      <PageIntro eyebrow={t("Confidențialitate")} note={t('Actualizat {date}', { date: t(privacyUpdated) })} title={t("Ce date colectăm și cum le folosim.")} description={t("Informații despre formularul de contact, conturile de client, păstrarea datelor și exercitarea drepturilor.")} />
      <section className="section"><div className="wrap content-with-sidebar">
        <aside className="page-sidebar"><nav aria-label={t("Cuprins confidențialitate")}><p className="sidebar-label">{t("În această pagină")}</p><ol className="privacy-toc">{privacySections.map((item, index) => <li key={item.title}><Link to={`/confidentialitate#date-${index + 1}`}><span>0{index + 1}</span>{t(item.title)}</Link></li>)}</ol></nav><div className="sidebar-callout"><h2>{t("Întrebări despre date?")}</h2><a href={`mailto:${company.email}`}>{t(company.email)}</a></div></aside>
        <div className="privacy-content"><p className="notice"><strong>{t("Notă.")}</strong>{t(" Textul descrie funcționarea tehnică actuală a site-ului și datele operatorului; pentru utilizare juridică trebuie revizuit de un consultant.")}</p>
          {privacySections.map((section, index) => <article className="privacy-panel" id={`date-${index + 1}`} key={section.title}><div className="privacy-panel__title"><span>0{index + 1}</span><h2>{t(section.title)}</h2></div><div>{section.body.map((paragraph) => <p key={paragraph}>{t(paragraph)}</p>)}</div></article>)}
          <Link to="/contact" className="text-link">{t("Înapoi la formular ")}<ArrowUpRight /></Link>
        </div>
      </div></section>
    </>
  )
}
