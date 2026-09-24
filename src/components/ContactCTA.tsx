import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from './Icons'

export default function ContactCTA() {
  const { t } = useLanguage()
  return (
    <section className="wrap business-cta" aria-labelledby="next-step-title">
      <div className="business-cta__inner">
        <div>
          <p className="eyebrow">{t("Să discutăm despre proiect")}</p>
          <h2 id="next-step-title">{t("De la o nevoie concretă la o soluție software.")}</h2>
          <p>{t("Descrieți obiectivul. Revenim cu întrebările potrivite și următorii pași.")}</p>
        </div>
        <Link to="/contact" className="btn btn--primary">{t("Discutăm proiectul ")}<ArrowUpRight /></Link>
      </div>
    </section>
  )
}
