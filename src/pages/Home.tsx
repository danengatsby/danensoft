import { Link } from 'react-router-dom'
import SectionHead from '../components/SectionHead'
import SystemDiagram from '../components/SystemDiagram'
import OpsWindow from '../components/OpsWindow'
import { usePageMeta } from '../hooks/usePageMeta'
import { serviceIcons } from '../components/serviceIcons'
import { ArrowRight, ArrowUpRight, CheckIcon } from '../components/Icons'
import { capabilities, principles, process, services } from '../content/site'

export default function Home() {
  usePageMeta(
    'Aplicații web, integrări și automatizări',
    'Studio de produs software: aplicații web pe măsură, integrări între sisteme și automatizări pentru companii care au depășit foile de calcul.',
  )

  return (
    <>
      <section className="wrap hero">
        <div>
          <p className="eyebrow">Studio de produs software</p>
          <h1>
            Software care înlocuiește <em>munca manuală.</em>
          </h1>
          <p className="hero__lead">
            Construim aplicații web, integrări între sisteme și automatizări pentru
            companii care au depășit foile de calcul și instrumentele neconectate.
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
                de test din prima săptămână de dezvoltare.
              </span>
            </li>
            <li>
              <b>03</b>
              <span>
                Codul, infrastructura și documentația rămân în conturile
                dumneavoastră, de la început.
              </span>
            </li>
          </ul>
        </div>

        <SystemDiagram />
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
              Patru direcții de lucru. Cele mai multe proiecte încep cu una și se
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

      <section className="section band">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Concept de capabilitate</p>
            <h2 className="h-section" style={{ marginBlock: 'var(--s-4) var(--s-5)' }}>
              Un singur tablou. <em>Mai puține presupuneri.</em>
            </h2>
            <p style={{ maxWidth: '38ch', lineHeight: 1.75 }}>
              Exemplu conceptual de panou care aduce comenzile, excepțiile și
              acțiunile într-o interfață comună. Nu este captura unui produs livrat.
            </p>
            <ul className="checklist" style={{ marginBlock: 'var(--s-6)' }}>
              <li>
                <CheckIcon />
                <span>Priorități vizibile pentru fiecare rol</span>
              </li>
              <li>
                <CheckIcon />
                <span>Automatizări cu puncte clare de control uman</span>
              </li>
              <li>
                <CheckIcon />
                <span>Istoric complet al deciziilor</span>
              </li>
            </ul>
            <Link to="/proiecte" className="btn btn--secondary">
              Vezi exemplele <ArrowRight />
            </Link>
          </div>

          <OpsWindow />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="Mod de lucru"
            title={
              <>
                Un proiect previzibil se recunoaște <em>devreme.</em>
              </>
            }
          >
            <p>
              Nu promitem certitudini pe care nimeni nu le poate susține la începutul
              unui proiect software. Facem progresul vizibil suficient de devreme
              încât deciziile costisitoare să fie luate cu informații reale.
            </p>
          </SectionHead>

          <ol className="process">
            {process.map((step, index) => (
              <li key={step.title}>
                <span className="process__num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="process__body">
                  <p className="mono-sm">{step.duration}</p>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
                <b className="process__tag">{step.duration}</b>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead eyebrow="Principii" title={<>Ce puteți cere de la noi</>}>
            <p>
              Angajamente de lucru, nu promisiuni de marketing. Dacă vreunul dintre
              ele nu este respectat, aveți un motiv întemeiat să ne întrerupeți
              colaborarea.
            </p>
          </SectionHead>

          <div className="columns">
            {principles.map((principle, index) => (
              <article key={principle.title}>
                <span className="columns__num">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>
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
          <Link to="/contact" className="round-cta" aria-label="Discutați proiectul">
            <ArrowUpRight />
          </Link>
        </div>
      </section>
    </>
  )
}
