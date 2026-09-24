import { useLanguage } from '../hooks/useLanguage'
import { useMemo, useState } from 'react'
import PageIntro from '../components/PageIntro'
import ContactCTA from '../components/ContactCTA'
import ProjectVisual from '../components/ProjectVisual'
import PublishedProjectCard from '../components/PublishedProjectCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowUpRight } from '../components/Icons'
import { projectCategories, projects } from '../content/site'

export default function Portfolio() {
  const { t } = useLanguage()
  usePageMeta(
    'Proiecte',
    'Contabo, PCS, Poetio și RVR Taxi: proiecte reale de aplicații web, site-uri de prezentare și publicații digitale, alături de demonstrații interne.',
  )

  const [filter, setFilter] = useState('Toate')

  const visible = useMemo(
    () =>
      filter === 'Toate'
        ? projects
        : projects.filter((project) => project.category === filter),
    [filter],
  )

  const published = visible.filter((project) => project.kind === 'real')
  const demos = visible.filter((project) => project.kind === 'demo')

  return (
    <>
      <PageIntro
        eyebrow={t("Proiecte")}
        note={t("Proiecte reale · demonstrații marcate distinct")}
        title={
          <>{t("Proiecte software și prezențe digitale.")}</>
        }
        description={t("Contabo, PCS, Poetio și RVR Taxi: de la contabilitate și operațiuni taxi la comunicare publică și poezie. Soluții construite pentru nevoi și utilizatori diferiți.")}
      />

      <section className="section portfolio-section">
        <div className="wrap">
          <div className="portfolio-toolbar">
          <p className="sidebar-label">{t("Filtrați proiectele")}</p>
          <ul className="filter-bar" aria-label={t("Filtrare după categorie")}>
            {projectCategories.map((category) => (
              <li key={category}>
                <button
                  type="button"
                  className="filter-btn"
                  aria-pressed={filter === category}
                  onClick={() => setFilter(category)}
                >
                  {t(category)}
                </button>
              </li>
            ))}
          </ul>

          <p
            className="mono-sm"
            role="status"
            aria-live="polite"
          >
            {published.length} {t(published.length === 1 ? 'proiect publicat' : 'proiecte publicate')}
            {demos.length > 0 && ` · ${demos.length} ${t(demos.length === 1 ? 'demonstrație' : 'demonstrații')}`}
          </p>

          </div>

          {published.length > 0 && (
            <section className="published-section" aria-labelledby="published-title">
              <div className="portfolio-section-head">
                <h2 id="published-title">{t("Proiecte publicate")}</h2>
                <p>{t("Fiecare proiect are un studiu de caz și un link separat către site.")}</p>
              </div>
              <ul className="published-grid">
                {published.map((project) => (
                  <li key={project.id}><PublishedProjectCard project={project} /></li>
                ))}
              </ul>
            </section>
          )}

          {demos.length > 0 && (
            <details className="portfolio-demos" key={filter} open={filter !== 'Toate'}>
              <summary>{t("Demonstrații de capabilitate ")}<span>{demos.length}</span></summary>
              <p>{t("Studii interne care ilustrează tipuri de aplicații și integrări. Acestea nu sunt proiecte publicate și nu au un site de vizitat.")}</p>
              <ul className="work-grid">
                {demos.map((project) => (
                  <li key={project.id}>
                    <article className={`work-card tone-${project.tone}`}>
                      <div className="work-card__meta">
                        <span>
                          {t(project.kind === 'real' ? 'Proiect real' : 'Demonstrație')} ·{' '}
                          {t(project.category)}
                        </span>
                        <span>{project.glyph}</span>
                      </div>
                      <div className="work-card__visual">
                        <ProjectVisual motif={project.motif} />
                      </div>
                      <h3 className="work-card__title">{t(project.title)}</h3>
                      <p>
                        <strong>{t("Problema.")}</strong> {t(project.problem)}
                      </p>
                      <p>
                        <strong>{t("Abordarea.")}</strong> {t(project.approach)}
                      </p>
                      {project.result && (
                        <p>
                          <strong>{t("Rezultatul.")}</strong> {t(project.result)}
                        </p>
                      )}
                      <ul className="tag-row">
                        {project.stack.map((item) => (
                          <li key={item} className="tag">
                            {t(item)}
                          </li>
                        ))}
                  </ul>
                  {project.href && (
                    <a
                      className="work-card__link"
                      href={project.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >{t("Vezi proiectul ")}<ArrowUpRight />
                    </a>
                  )}
                </article>
              </li>
            ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      <ContactCTA />
    </>
  )
}
