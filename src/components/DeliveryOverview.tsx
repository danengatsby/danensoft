import { useLanguage } from '../hooks/useLanguage'
import { CloudIcon, CodeIcon, LayersIcon, ArrowUpRight, CheckIcon } from './Icons'

export default function DeliveryOverview() {
  const { t } = useLanguage()
  return (
    <aside className="solution-overview" aria-label={t("Componentele unei soluții software")}>
      <div className="solution-overview__head"><span>{t("DEZVOLTARE CAP-COADĂ")}</span><CodeIcon /></div>
      <div className="solution-overview__core">
        <span className="solution-overview__monogram" aria-hidden="true">{t("DE")}</span>
        <div><span>{t("CONSTRUIT ÎN JURUL AFACERII")}</span><h2>{t("Soluția dumneavoastră")}</h2><p>{t("O interfață clară. Procese conectate.")}</p></div>
      </div>
      <div className="solution-overview__branches" aria-hidden="true"><i /><i /><i /></div>
      <ul className="solution-overview__layers">
        <li><LayersIcon /><strong>{t("Aplicație")}</strong><span>{t("Web · SaaS · Portaluri")}</span></li>
        <li><CodeIcon /><strong>{t("Integrări")}</strong><span>{t("API · Date · Automatizări")}</span></li>
        <li><CloudIcon /><strong>{t("Infrastructură")}</strong><span>{t("Cloud · Backup · Operare")}</span></li>
      </ul>
      <div className="solution-overview__delivery">
        <p>{t("De la analiză la livrare ")}<ArrowUpRight /></p>
        <ul>{['Obiective și specificații', 'Dezvoltare și testare', 'Lansare și documentație'].map((item) => <li key={item}><CheckIcon />{t(item)}</li>)}</ul>
      </div>
      <p className="solution-overview__caption">{t("Același partener, în fiecare etapă.")}</p>
    </aside>
  )
}
