import { Link } from 'react-router-dom'
import SectionHead from '../components/SectionHead'
import SystemDiagram from '../components/SystemDiagram'
import OpsWindow from '../components/OpsWindow'
import { usePageMeta } from '../hooks/usePageMeta'
import { serviceIcons } from '../components/serviceIcons'
import { ArrowRight, ArrowUpRight, CheckIcon } from '../components/Icons'
import { capabilities, projects, services } from '../content/site'

const featuredProject = projects[0]

export default function Home() {
  usePageMeta(
    'Aplicații cloud, produse SaaS și automatizări',
    'Moldovan Lux construiește aplicații cloud, produse SaaS și integrări pentru IMM-uri, startup-uri și echipe enterprise.',
  )

  return (
    <>
      <section className="wrap hero">
        <div>
          <p className="eyebrow">Aplicații cloud și produse SaaS</p>
          <h1>
            Aplicații cloud care scot operațiunile <em>din Excel.</em>
          </h1>
          <p className="hero__lead">
            Construim platforme web, produse SaaS și integrări pentru IMM-uri,
            startup-uri și echipe enterprise care vor procese conectate și control
            asupra datelor.
          </p>
          <div className="btn-row">
            <Link to="/contact" className="btn btn--primary">
              Discutăm proiectul <ArrowUpRight />
            </Link>
            <Link to="/servicii" className="text-link">
              Vezi ce construim <ArrowRight />
            </Link>
          </div>

          <ul className="hero__points">
            <li>
              <b>01</b>
              <span>
                Lucrăm direct cu dumneavoastră — fără intermediari între cerință și
                echipa care scrie codul.
              </span>
            </li>
            <li>
              <b>02</b>
              <span>
                Livrăm în incremente funcționale, cu o versiune accesibilă în mediu
                de test încă din primele etape de dezvoltare.
              </span>
            </li>
            <li>
              <b>03</b>
              <span>
                Codul și documentația vă aparțin; aplicația poate rula pe
                infrastructura noastră administrată sau în mediul dumneavoastră.
              </span>
            </li>
          </ul>
        </div>

        <SystemDiagram />
      </section>

      <section className="section band">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Proiect real · produs SaaS</p>
            <h2 className="h-section" style={{ marginBlock: 'var(--s-4) var(--s-5)' }}>
              Contabo. <em>Contabilitate completă în cloud.</em>
            </h2>
            <p style={{ maxWidth: '38ch', lineHeight: 1.75 }}>
              {featuredProject.approach} Reprezentarea alăturată este ilustrativă;
              produsul funcțional poate fi explorat direct.
            </p>
            <ul className="checklist" style={{ marginBlock: 'var(--s-6)' }}>
              <li>
                <CheckIcon />
                <span>Documente primite și emise într-un singur flux</span>
              </li>
              <li>
                <CheckIcon />
                <span>e-Factura, bancă, casă, balanță și TVA</span>
              </li>
              <li>
                <CheckIcon />
                <span>Moduri de lucru distincte pentru patron și contabil</span>
              </li>
            </ul>
            <div className="btn-row">
              <a
                href={featuredProject.href}
                className="btn btn--secondary"
                target="_blank"
                rel="noreferrer noopener"
              >
                Explorează produsul <ArrowUpRight />
              </a>
              <Link to="/proiecte" className="text-link">
                Vezi portofoliul <ArrowRight />
              </Link>
            </div>
          </div>

          <OpsWindow />
        </div>
      </section>

      <div className="capability-band">
        <ul aria-label="Capabilități principale">
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="Servicii" title={<>Ce construim</>}>
            <p>
              Cinci direcții de lucru. Cele mai multe proiecte încep cu una și se
              extind spre celelalte pe măsură ce sistemul crește.
            </p>
          </SectionHead>

          <ul className="service-list">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.id]
              return (
                <li key={service.id}>
                  <Link className="service-row" to={`/servicii#${service.id}`}>
                    <span className="service-row__index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="service-row__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="service-row__title">{service.title}</span>
                    <span className="service-row__text">{service.summary}</span>
                    <ArrowUpRight className="service-row__arrow" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <div>
            <p className="eyebrow">Următorul pas</p>
            <h2 style={{ marginTop: 'var(--s-4)' }}>
              Aveți un proces care a devenit <em>prea important</em> pentru Excel?
            </h2>
          </div>
          <Link to="/contact" className="round-cta">
            <span>Discutăm proiectul</span>
            <ArrowUpRight />
          </Link>
        </div>
      </section>
    </>
  )
}
