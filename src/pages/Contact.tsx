import { useLanguage } from '../hooks/useLanguage'
import PageIntro from '../components/PageIntro'
import ContactForm from '../components/ContactForm'
import { usePageMeta } from '../hooks/usePageMeta'
import { CheckIcon, MailIcon, ArrowUpRight } from '../components/Icons'
import { company } from '../content/site'

export default function Contact() {
  const { t } = useLanguage()
  usePageMeta('Contact', 'Scrieți-ne despre procesul pe care vreți să îl automatizați sau despre aplicația de care aveți nevoie.')
  return (
    <>
      <PageIntro eyebrow={t("Contact")} note={t("Răspuns în maximum două zile lucrătoare")} title={t("Să discutăm despre proiectul dumneavoastră.")} description={t("O aplicație nouă, o integrare sau un proiect existent. Trimiteți câteva detalii și stabilim împreună următorul pas.")} />
      <section className="section"><div className="wrap contact-layout">
        <aside className="contact-sidebar">
          <div className="contact-card"><span className="business-icon"><MailIcon /></span><h2>{t("Contact direct")}</h2><p>{t("Dan Enache · Inginer software")}</p><a className="contact-email" href={`mailto:${company.email}`}>{t(company.email)}<ArrowUpRight /></a><dl><div><dt>{t("Locație")}</dt><dd>{t(company.location)}</dd></div><div><dt>{t("Timp de răspuns")}</dt><dd>{t("Maximum două zile lucrătoare")}</dd></div></dl></div>
          <div className="contact-card"><h2>{t("Ce ne ajută să știm")}</h2><ul className="contact-checks">{['Ce doriți să construiți sau să simplificați', 'Cine va folosi soluția', 'Ce aplicații trebuie conectate', 'Un termen sau un buget orientativ, dacă există'].map((item) => <li key={item}><CheckIcon /><span>{t(item)}</span></li>)}</ul></div>
          <div className="contact-next"><h2>{t("După trimitere")}</h2><ol><li>{t("Primiți o confirmare automată pe e-mail.")}</li><li>{t("Analizăm contextul și revenim cu întrebări.")}</li><li>{t("Stabilim o discuție și pașii pentru propunere.")}</li></ol></div>
        </aside>
        <div className="contact-form-panel"><div className="contact-form-panel__head"><h2>{t("Trimiteți o solicitare")}</h2><p>{t("Descrieți pe scurt obiectivul. Nu este necesară o specificație tehnică.")}</p></div><ContactForm /></div>
      </div></section>
    </>
  )
}
