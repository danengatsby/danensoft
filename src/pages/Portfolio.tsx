import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import ProjectVisual from '../components/ProjectVisual'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowUpRight } from '../components/Icons'
import { projectCategories, projects } from '../content/site'

export default function Portfolio() {
  usePageMeta(
    'Proiecte',
    'Studii de capabilitate: probleme concrete de business și modul în care le rezolvăm tehnic.',
  )

  const [filter, setFilter] = useState('Toate')

  const visible = useMemo(
    () =>
      filter === 'Toate'
        ? projects
        : projects.filter((project) => project.category === filter),
    [filter],
  )

  return (
    <>
      <PageIntro
        eyebrow="Proiecte"
        note="Toate exemplele sunt ilustrative"
        title={
          <>
            Capabilitatea se vede <em>mai bine în context.</em>
          </>
        }
        description="Mai jos sunt studii de capabilitate construite intern: problema de la care se pornește și abordarea tehnică pe care o aplicăm."
      />

      <section className="section">
        <div className="wrap">
          <p className="notice" style={{ maxWidth: '60ch', marginBottom: 'var(--s-6)' }}>
            <strong>Notă.</strong> Acestea sunt exemple realizate intern, nu lucrări
            de client, și nu conțin date reale. Nu publicăm nume de clienți, cifre de
            rezultat sau recomandări pe care nu le putem susține. Referințe
            verificabile pot fi furnizate la cerere, cu acordul clienților respectivi.
          </p>

          <ul className="filter-bar" aria-label="Filtrare după categorie">
            {projectCategories.map((category) => (
              <li key={category}>
                <button
                  type="button"
                  className="filter-btn"
                  aria-pressed={filter === category}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>

          <p
            className="mono-sm"
            role="status"
            aria-live="polite"
            style={{ marginBottom: 'var(--s-5)' }}
          >
            {visible.length} {visible.length === 1 ? 'exemplu' : 'exemple'} afișate
          </p>

          <ul className="work-grid">
            {visible.map((project) => (
              <li key={project.id}>
                <article className={`work-card tone-${project.tone}`}>
                  <div className="work-card__meta">
                    <span>{project.category}</span>
                    <span>{project.glyph}</span>
                  </div>
                  <div className="work-card__visual">
                    <ProjectVisual motif={project.motif} />
                  </div>
                  <h2 className="work-card__title">{project.title}</h2>
                  <p>
                    <strong>Problema.</strong> {project.problem}
                  </p>
                  <p>
                    <strong>Abordarea.</strong> {project.approach}
                  </p>
                  <ul className="tag-row">
                    {project.stack.map((item) => (
                      <li key={item} className="tag">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <div>
            <p className="eyebrow">Proiectul dumneavoastră</p>
            <h2 style={{ marginTop: 'var(--s-4)' }}>
              Recunoașteți una dintre <em>situațiile de mai sus?</em>
            </h2>
            <p className="prose">
              Scrieți-ne despre a dumneavoastră. Vă spunem ce am face diferit față de
              exemplul general și de ce.
            </p>
          </div>
          <Link to="/contact" className="round-cta" aria-label="Spuneți-ne despre proiect">
            <ArrowUpRight />
          </Link>
        </div>
      </section>
    </>
  )
}
