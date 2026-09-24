import { Link, useParams } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import ContactCTA from '../components/ContactCTA'
import { ArrowRight, ArrowUpRight, CheckIcon } from '../components/Icons'
import { publishedProjects, type Project } from '../content/site'
import { useLanguage } from '../hooks/useLanguage'
import { usePageMeta } from '../hooks/usePageMeta'
import NotFound from './NotFound'

function CaseStudy({ project }: { project: Project }) {
  const { t } = useLanguage()
  usePageMeta(project.title, project.summary ?? project.approach)
  const name = project.title.split(' — ')[0]

  return (
    <>
      <PageIntro
        eyebrow={name}
        parent={{ label: t('Proiecte'), to: '/proiecte' }}
        note={t('Studiu de caz')}
        title={t(project.title)}
        description={t(project.summary ?? project.approach)}
      />
      <section className="section">
        <div className="wrap case-study">
          <div className="case-study__overview">
            {project.preview && (
              <figure className="case-study__preview">
                <img src={project.preview} alt={t('Captură a site-ului {name}', { name })} width="1200" height="780" />
                <figcaption>{t('Previzualizare proiect')} · {name}</figcaption>
              </figure>
            )}
            <aside className="case-study__facts" aria-label={t('Proiectul pe scurt')}>
              <p className="eyebrow">{t('Proiectul pe scurt')}</p>
              <dl>
                <div><dt>{t('Tip de proiect')}</dt><dd>{t(project.category)}</dd></div>
                <div><dt>{t('Disponibilitate')}</dt><dd>{t('Proiect publicat')}</dd></div>
                {project.contribution && <div><dt>{t('Rolul meu')}</dt><dd>{t(project.contribution.role)}</dd></div>}
              </dl>
              <ul className="tag-row">{project.stack.map((item) => <li className="tag" key={item}>{t(item)}</li>)}</ul>
              {project.href && (
                <a className="btn btn--primary" href={project.href} target="_blank" rel="noreferrer noopener">
                  {t('Deschide site-ul')}<ArrowUpRight /><span className="sr-only">{t('(filă nouă)')}</span>
                </a>
              )}
              <Link to="/proiecte" className="text-link">{t('Toate proiectele')}<ArrowRight /></Link>
            </aside>
          </div>
          <div className="case-study__story">
            <section className="case-study__section" aria-labelledby="project-context">
              <span className="case-study__number" aria-hidden="true">01</span>
              <div><h2 id="project-context">{t('Contextul și problema')}</h2><p>{t(project.problem)}</p></div>
            </section>
            {project.contribution && (
              <section className="case-study__section case-study__section--contribution" aria-labelledby="project-contribution">
                <span className="case-study__number" aria-hidden="true">02</span>
                <div>
                  <h2 id="project-contribution">{t('Contribuția mea')}</h2>
                  <ul className="case-study__responsibilities">{project.contribution.responsibilities.map((item) => <li key={item}><CheckIcon /><span>{t(item)}</span></li>)}</ul>
                </div>
              </section>
            )}
            <section className="case-study__section" aria-labelledby="project-solution">
              <span className="case-study__number" aria-hidden="true">{project.contribution ? '03' : '02'}</span>
              <div><h2 id="project-solution">{t('Soluția realizată')}</h2><p>{t(project.approach)}</p></div>
            </section>
            {project.result && (
              <section className="case-study__section" aria-labelledby="project-result">
                <span className="case-study__number" aria-hidden="true">{project.contribution ? '04' : '03'}</span>
                <div><h2 id="project-result">{t('Rezultatul')}</h2><p>{t(project.result)}</p></div>
              </section>
            )}
          </div>
        </div>
      </section>
      <ContactCTA />
    </>
  )
}

export default function ProjectDetail() {
  const { projectId } = useParams()
  const project = publishedProjects.find((item) => item.id === projectId)
  return project ? <CaseStudy project={project} /> : <NotFound />
}
