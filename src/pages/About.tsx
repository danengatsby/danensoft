import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import SectionHead from '../components/SectionHead'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowUpRight, CheckIcon } from '../components/Icons'
import { audiences, company, principles, process, team } from '../content/site'

export default function About() {
  usePageMeta(
    'Despre',
    'Moldovan Lux este un studio software din Iași, coordonat de Enache Dan, pentru aplicații cloud și produse SaaS.',
  )

  return (
    <>
      <PageIntro
        eyebrow="Despre"
        note="Iași · studio software independent"
        title={
          <>
            Răspundere directă, <em>de la idee la producție.</em>
          </>
        }
        description={`${company.foundedNote} Discuțiile despre scop, termene și compromisuri nu trec prin straturi comerciale inutile.`}
      />

      <section className="section section--tight">
        <div className="wrap">
          <ul className="facts">
            <li>
              <span className="facts__label">Mod de lucru</span>
              <span className="facts__value">Iași · remote</span>
            </li>
            <li>
              <span className="facts__label">Clienți</span>
              <span className="facts__value">{audiences.join(' · ')}</span>
            </li>
            <li>
              <span className="facts__label">Operare cloud</span>
              <span className="facts__value">Infrastructură proprie</span>
            </li>
            <li>
              <span className="facts__label">Timp de răspuns</span>
              <span className="facts__value">2 zile lucrătoare</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead
            eyebrow="Echipă"
            title={
              <>
                Știți cu cine <em>discutați.</em>
              </>
            }
          >
            <p>
              Același contact rămâne implicat de la evaluarea inițială până la
              lansare și operare.
            </p>
          </SectionHead>
          <div className="team-grid">
            {team.map((member) => (
              <article className="team-card" key={member.name}>
                <span className="team-card__mark" aria-hidden="true">
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <div>
                  <p className="mono-sm">{member.role}</p>
                  <h2>ing.soft {member.name}</h2>
                  <p>{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
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
          <Link to="/contact" className="round-cta">
            <span>Discutăm proiectul</span>
            <ArrowUpRight />
          </Link>
        </div>
      </section>
    </>
  )
}
