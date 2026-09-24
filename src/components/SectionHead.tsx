import type { ReactNode } from 'react'

type Props = {
  eyebrow: string
  title: ReactNode
  children?: ReactNode
  id?: string
}

export default function SectionHead({ eyebrow, title, children, id }: Props) {
  return (
    <div className="section-head">
      <div className="section-head__title">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="h-section">
          {title}
        </h2>
      </div>
      {children ? <div className="prose">{children}</div> : null}
    </div>
  )
}
