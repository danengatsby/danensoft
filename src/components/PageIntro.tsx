import type { ReactNode } from 'react'

type Props = {
  eyebrow: string
  title: ReactNode
  description: string
  note?: string
}

export default function PageIntro({ eyebrow, title, description, note }: Props) {
  return (
    <section className="page-intro">
      <div className="wrap">
        <div className="page-intro__top">
          <p className="eyebrow">{eyebrow}</p>
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
