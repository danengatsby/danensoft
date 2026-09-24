import { useLanguage } from '../hooks/useLanguage'
import { Link } from 'react-router-dom'
import { ArrowRight } from './Icons'
import type { Project } from '../content/site'

export default function PublishedProjectCard({ project }: { project: Project }) {
  const { t } = useLanguage()
  if (!project.href) return null

  const [name, ...subtitle] = project.title.split(' — ')
  const domain = new URL(project.href).hostname

  return (
    <article className="published-project">
      <Link
        className="published-project__link"
        to={`/proiecte/${project.id}`}
        aria-label={t('Vezi studiul de caz: {name}', { name })}
      >
        <div className={`published-project__preview tone-${project.tone}`}>
          {project.preview && (
            <img src={project.preview} alt="" width="1200" height="780" loading="lazy" />
          )}
          <span className="published-project__badge">{t("Proiect real")}</span>
        </div>
        <div className="published-project__body">
          <span className="published-project__category">{t(project.category)}</span>
          <h3>{t(name)}</h3>
          <p className="published-project__subtitle">{t(subtitle.join(' — '))}</p>
          <p className="published-project__description">{t(project.summary ?? project.approach)}</p>
          <div className="published-project__footer">
            <span className="published-project__site">{domain}</span>
            <span className="published-project__action">{t("Studiu de caz")}<ArrowRight /></span>
          </div>
        </div>
      </Link>
    </article>
  )
}
