import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import SectionHead from '../components/SectionHead'
import ContactCTA from '../components/ContactCTA'
import { usePageMeta } from '../hooks/usePageMeta'
import { serviceIcons } from '../components/serviceIcons'
import { ArrowUpRight, CheckIcon } from '../components/Icons'
import { faq } from '../content/site'
import { serviceGroups } from '../content/presentation'

export default function Services() {
  const { t } = useLanguage()
  usePageMeta('Servicii', 'Aplicații cloud, integrări și automatizări, AI aplicat, mentenanță și operare pe infrastructură proprie.')
  return (
    <>
      <PageIntro eyebrow={t("Servicii")} note={t("Dezvoltare · Integrări · Operare")} title={t("Servicii software, de la analiză la mentenanță.")} description={t("Cinci servicii, grupate în trei arii de expertiză. Consultați livrabilele și modul de lucru, apoi discutăm ce se potrivește proiectului dumneavoastră.")} />
      <section className="section"><div className="wrap content-with-sidebar">
        <aside className="page-sidebar">
          <nav aria-label={t("Servicii disponibile")}><p className="sidebar-label">{t("Alegeți o arie")}</p>{serviceGroups.map((group) => <div className="sidebar-group" key={group.title}><strong>{t(group.title)}</strong><ul>{group.services.map((service) => <li key={service.id}><Link to={`/servicii#${service.id}`}>{t(service.title)}<ArrowUpRight /></Link></li>)}</ul></div>)}</nav>
          <div className="sidebar-callout"><h2>{t("Un proiect existent?")}</h2><p>{t("Putem începe cu un audit și un plan de îmbunătățire.")}</p><Link to="/contact" className="text-link">{t("Discutăm situația ")}<ArrowUpRight /></Link></div>
        </aside>
        <div className="service-catalog">{serviceGroups.map((group) => <section className="service-family" key={group.title}>
          <div className="service-family__head"><p className="eyebrow">{t(group.label)}</p><h2>{t(group.title)}</h2><p>{t(group.description)}</p></div>
          {group.services.map((service) => { const Icon = serviceIcons[service.id]; return <article className="service-panel" id={service.id} key={service.id}>
            <div className="service-panel__heading"><span className="business-icon"><Icon /></span><div><h3>{t(service.title)}</h3><p>{t(service.summary)}</p></div></div>
            <div className="service-panel__deliverables"><h4>{t("Ce livrăm")}</h4><ul>{service.deliverables.map((item) => <li key={item}><CheckIcon /><span>{t(item)}</span></li>)}</ul></div>
            <details className="service-panel__details"><summary>{t("Mod de lucru și tehnologii")}</summary><p>{t(service.detail)}</p><ul className="tag-row">{service.stack.map((item) => <li className="tag" key={item}>{t(item)}</li>)}</ul></details>
            <Link to="/contact" className="service-panel__contact">{t("Discutați acest serviciu ")}<ArrowUpRight /></Link>
          </article> })}
        </section>)}</div>
      </div></section>
      <section className="section section--surface"><div className="wrap">
        <SectionHead eyebrow={t("Întrebări frecvente")} title={t("Detaliile unei colaborări.")}><p>{t("Buget, proprietatea codului și suport după lansare.")}</p></SectionHead>
        <div className="business-faq">{faq.map((item) => <details key={item.q}><summary>{t(item.q)}</summary><p>{t(item.a)}</p></details>)}</div>
      </div></section>
      <ContactCTA />
    </>
  )
}
