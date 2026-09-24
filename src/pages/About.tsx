import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import SectionHead from '../components/SectionHead'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowUpRight, CheckIcon } from '../components/Icons'
import { company, principles, process } from '../content/site'

export default function About() {
  usePageMeta(
    'Despre',
    'Cum lucrăm, ce ne asumăm și ce nu promitem. Un studio performant, cu contact direct între client și echipa de dezvoltare.',
  )

  return (
    <>
      <PageIntro
        eyebrow="Despre"
        note="Echipă performantă · răspundere directă"
        title={
          <>
            Un studio performant, cu <em>răspundere directă.</em>
          </>
        }
        description={`${company.foundedNote} Discutați despre arhitectură, termene și compromisuri cu persoanele care implementează, nu cu un intermediar.`}
      />

      <section className="section section--tight">
        <div className="wrap">
          <ul className="facts">
            <li>
              <span className="facts__label">Mod de lucru</span>
              <span className="facts__value">Remote, UTC+2/+3</span>
            </li>
            <li>
              <span className="facts__label">Limbi de lucru</span>
              <span className="facts__value">Română, engleză</span>
            </li>
            <li>
              <span className="facts__label">Proprietatea codului</span>
              <span className="facts__value">A clientului</span>
            </li>
            <li>
              <span className="facts__label">Timp de răspuns</span>
              <span className="facts__value">2 zile lucrătoare</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section band">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Poziționare</p>
            <h2 className="h-section" style={{ marginBlock: 'var(--s-4) var(--s-5)' }}>
              Ce <em>nu</em> veți găsi aici
            </h2>
            <p style={{ maxWidth: '34ch', lineHeight: 1.75 }}>
              Preferăm o pagină mai puțin impresionantă decât una care promite ce nu
              putem susține.
            </p>
          </div>
          <ul className="checklist">
            <li>
              <CheckIcon />
              <span>
                Fără logo-uri de clienți și fără testimoniale pe care nu le putem
                proba public.
              </span>
            </li>
            <li>
              <CheckIcon />
              <span>
                Fără cifre de tipul „creștere de X%” rupte de contextul în care au
                apărut.
              </span>
            </li>
            <li>
              <CheckIcon />
              <span>
                Fără echipe fictive: dacă avem nevoie de un specialist din exterior,
                vă spunem înainte.
              </span>
            </li>
            <li>
              <CheckIcon />
              <span>
                Fără livrare „la cheie” fără documentație. Predarea include tot ce e
                necesar ca altcineva să continue.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="Proces"
            title={
              <>
                Cum decurge <em>o colaborare.</em>
              </>
            }
          >
            <p>
              Etapele sunt aceleași indiferent de mărimea proiectului. Ce variază este
              durata fiecărui ciclu de livrare.
            </p>
          </SectionHead>

          <ol className="process">
            {process.map((step, index) => (
              <li key={step.title}>
                <span className="process__num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="process__body">
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
          <SectionHead
            eyebrow="Angajamente"
            title={
              <>
                Principiile după care <em>lucrăm.</em>
              </>
            }
          />
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
              Hai să facem problema <em>clară împreună.</em>
            </h2>
          </div>
          <Link to="/contact" className="round-cta" aria-label="Începeți conversația">
            <ArrowUpRight />
          </Link>
        </div>
      </section>
    </>
  )
}
