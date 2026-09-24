import { useLanguage } from '../hooks/useLanguage'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  eyebrow: string
  title: ReactNode
  description: string
  note?: string
  parent?: { label: string; to: string }
}

export default function PageIntro({ eyebrow, title, description, note, parent }: Props) {
  const { t } = useLanguage()
  return (
    <section className="page-intro">
      <div className="wrap">
        <div className="page-intro__top">
          <nav className="page-breadcrumb" aria-label={t("Locație în site")}>
            <Link to="/">{t("Acasă")}</Link><span aria-hidden="true">/</span>
            {parent && <><Link to={parent.to}>{parent.label}</Link><span aria-hidden="true">/</span></>}
            <span aria-current="page">{eyebrow}</span>
          </nav>
          {note && <p className="page-intro__note">{note}</p>}
        </div>
        <div className="page-intro__body">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </section>
  )
}
