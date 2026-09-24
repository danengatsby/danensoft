import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import SectionHead from '../components/SectionHead'
import DeliveryOverview from '../components/DeliveryOverview'
import PublishedProjectCard from '../components/PublishedProjectCard'
import ProcessSteps from '../components/ProcessSteps'
import ContactCTA from '../components/ContactCTA'
import { usePageMeta } from '../hooks/usePageMeta'
import { serviceIcons } from '../components/serviceIcons'
import { ArrowRight, ArrowUpRight, CheckIcon } from '../components/Icons'
import { audiences, projects } from '../content/site'
import { commitments, serviceGroups } from '../content/presentation'

export default function Home() {
  const { t } = useLanguage()
  usePageMeta('Dezvoltare software pentru afaceri', 'Dan Enache: dezvoltare de aplicații web și SaaS, integrări, automatizări și operare cloud. Un partener tehnic de la analiză la mentenanță.')
  return (
    <>
      <section className="wrap company-hero">
        <div className="company-hero__copy">
          <p className="eyebrow">{t("Dan Enache · Dezvoltare software")}</p>
          <h1>{t("Software potrivit")}<br />{t("afacerii dumneavoastră.")}</h1>
          <p className="company-hero__lead">{t("Dezvoltăm aplicații web, conectăm sisteme și automatizăm procese. Un partener tehnic pentru tot parcursul proiectului, de la analiză la lansare și mentenanță.")}</p>
          <div className="btn-row">
            <Link to="/contact" className="btn btn--primary">{t("Discutăm proiectul ")}<ArrowUpRight /></Link>
            <Link to="/proiecte" className="btn btn--secondary">{t("Proiecte realizate ")}<ArrowRight /></Link>
          </div>
          <div className="company-hero__audiences"><span>{t("Soluții pentru")}</span>{audiences.map((item) => <span key={item}>{t(item)}</span>)}</div>
        </div>
        <DeliveryOverview />
      </section>
      <div className="wrap"><ul className="commitment-strip">{commitments.map((item) => <li key={item.title}><CheckIcon /><div><strong>{t(item.title)}</strong><p>{t(item.body)}</p></div></li>)}</ul></div>

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow={t("Servicii")} title={t("Expertiză organizată în jurul nevoilor afacerii.")}><p>{t("Dezvoltare, conectare și operare. Fiecare arie are livrabile și un proces de lucru clar.")}</p></SectionHead>
          <div className="solution-groups">{serviceGroups.map((group, index) => {
            const Icon = serviceIcons[group.services[0].id]
            return <article className="solution-group" key={group.title}>
              <div className="solution-group__top"><span className="business-icon"><Icon /></span><span className="mono-sm">0{index + 1}</span></div>
              <h3>{t(group.title)}</h3><p>{t(group.description)}</p>
              <ul>{group.services.map((service) => <li key={service.id}><Link to={`/servicii#${service.id}`}>{t(service.title)}<ArrowUpRight /></Link></li>)}</ul>
            </article>
          })}</div>
          <div className="section-footer"><span>{t("Livrabile, tehnologii și răspunsuri la întrebări.")}</span><Link to="/servicii" className="text-link">{t("Toate serviciile ")}<ArrowRight /></Link></div>
        </div>
      </section>

      <section className="section section--surface">
        <div className="wrap">
          <SectionHead eyebrow={t("Portofoliu")} title={t("Proiecte publicate. Soluții concrete.")}><p>{t("De la problema inițială la soluția realizată. Descoperiți povestea fiecărui proiect.")}</p></SectionHead>
          <ul className="published-grid published-grid--overview">{projects.filter((project) => project.kind === 'real').map((project) => <li key={project.id}><PublishedProjectCard project={project} /></li>)}</ul>
          <div className="section-footer"><span>{t("Descoperiți proiectele și demonstrațiile de capabilitate.")}</span><Link to="/proiecte" className="text-link">{t("Portofoliul complet ")}<ArrowRight /></Link></div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow={t("Mod de lucru")} title={t("Un proces previzibil, de la discuție la livrare.")}><p>{t("Știți ce se construiește, ce primiți și care este următorul pas.")}</p></SectionHead>
          <ProcessSteps />
          <div className="section-footer"><span>{t("Colaborare directă cu Dan Enache, inginer software.")}</span><Link to="/despre" className="text-link">{t("Despre colaborare ")}<ArrowRight /></Link></div>
        </div>
      </section>
      <ContactCTA />
    </>
  )
}
