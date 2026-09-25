import { useLanguage } from '../hooks/useLanguage'
import { Link } from '../components/LocalizedLink'
import PageIntro from '../components/PageIntro'
import SectionHead from '../components/SectionHead'
import ContactCTA from '../components/ContactCTA'
import ProcessSteps from '../components/ProcessSteps'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowUpRight, CheckIcon } from '../components/Icons'
import { audiences, company, projects, services } from '../content/site'

const workingPrinciples = [
  ['Transparență în planificare', 'Scopul, costurile și etapele sunt scrise în propunere. Modificările sunt discutate înainte de implementare.'],
  ['Control asupra proiectului', 'Codul sursă, accesele și documentația vă aparțin. Găzduirea se stabilește în funcție de cerințe.'],
  ['Decizii documentate', 'Arhitectura, integrările și instrucțiunile de operare sunt explicate pentru cei care continuă proiectul.'],
  ['Continuitate după lansare', 'Mentenanța și intervențiile se pot stabili separat, cu priorități și responsabilități clare.'],
]

export default function About() {
  const { t } = useLanguage()
  usePageMeta('Despre', 'Dan Enache, inginer software din Iași. Aplicații cloud, produse SaaS și colaborare directă, de la idee la lansare.')
  return (
    <>
      <PageIntro eyebrow={t("Despre")} note={t("Iași, România · colaborare remote")} title={t("Un partener tehnic implicat în fiecare etapă.")} description={t("Dan Enache este un studio independent de dezvoltare software. Colaborarea pornește de la nevoile afacerii și continuă cu implementare, livrare și suport tehnic.")} />
      <section className="section"><div className="wrap">
        <div className="company-profile">
          <article className="company-profile__person"><span className="profile-monogram" aria-hidden="true">{t("DE")}</span><p className="eyebrow">{t("Coordonare și dezvoltare")}</p><h2>{t("Dan Enache")}</h2><p className="profile-role">{t("Inginer software · dezvoltator independent")}</p><p>{t("Contactul direct pentru evaluarea, organizarea și livrarea proiectului dumneavoastră.")}</p><Link to="/contact" className="text-link">{t("Să discutăm ")}<ArrowUpRight /></Link></article>
          <div className="company-profile__overview"><p className="eyebrow">{t("Despre activitate")}</p><h2>{t("Dezvoltare software conectată la realitatea afacerii.")}</h2><p>{t("Construim aplicații cloud, produse SaaS și integrări pentru companii care vor să își organizeze mai bine operațiunile. Pornim de la fluxurile de lucru și definim împreună rezultatul așteptat.")}</p><p>{t("Dan Enache rămâne implicat de la prima discuție până la lansare. Dacă proiectul necesită un specialist extern, rolul și contribuția lui sunt discutate înainte.")}</p><ul className="company-profile__checks">{['Analiză și propunere de implementare', 'Dezvoltare, testare și livrare în etape', 'Operare cloud, documentație și mentenanță'].map((item) => <li key={item}><CheckIcon />{t(item)}</li>)}</ul><div className="profile-audiences"><span>{t("Colaborăm cu")}</span>{audiences.map((item) => <span className="tag" key={item}>{t(item)}</span>)}</div></div>
        </div>
        <dl className="company-facts"><div><dt>{t("Proiecte publicate în portofoliu")}</dt><dd>{projects.filter((p) => p.kind === 'real').length}</dd></div><div><dt>{t("Servicii de dezvoltare și operare")}</dt><dd>{services.length}</dd></div><div><dt>{t("Colaborare")}</dt><dd>{t("Iași · remote")}</dd></div><div><dt>{t("Răspuns la solicitări")}</dt><dd>{t("2 zile lucrătoare")}</dd></div></dl>
      </div></section>
      <section className="section section--surface"><div className="wrap">
        <SectionHead eyebrow={t("Principii de colaborare")} title={t("Responsabilități clare, de la început.")}><p>{t("O bază comună pentru deciziile tehnice și comerciale.")}</p></SectionHead>
        <div className="principle-grid">{workingPrinciples.map(([title, body], index) => <article key={title}><span className="principle-index">0{index + 1}</span><div><h3>{t(title)}</h3><p>{t(body)}</p></div></article>)}</div>
      </div></section>
      <section className="section"><div className="wrap">
        <SectionHead eyebrow={t("Proces")} title={t("Cum decurge un proiect.")}><p>{t("Etape vizibile și un punct de contact pe tot parcursul colaborării.")}</p></SectionHead><ProcessSteps detailed />
        <div className="company-legal"><span>{t("Datele operatorului")}</span><p>{company.legal}</p><Link to="/confidentialitate">{t("Confidențialitate ")}<ArrowUpRight /></Link></div>
      </div></section>
      <ContactCTA />
    </>
  )
}
