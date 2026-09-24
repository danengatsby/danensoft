import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowRight } from '../components/Icons'
import { privacySections, privacyUpdated } from '../content/privacy'
import { company } from '../content/site'

export default function Privacy() {
  usePageMeta(
    'Confidențialitate',
    'Ce date colectăm prin formularul de contact, ce facem cu ele și ce drepturi aveți.',
  )

  return (
    <>
      <PageIntro
        eyebrow="Confidențialitate"
        note={`Draft · actualizat ${privacyUpdated}`}
        title={
          <>
            Ce date colectăm și <em>ce facem cu ele.</em>
          </>
        }
        description="Textul descrie corect ce face site-ul din punct de vedere tehnic, dar nu a fost verificat juridic și nu conține încă datele reale ale operatorului."
      />

      <section className="section">
        <div className="wrap wrap--narrow">
          <p className="notice">
            <strong>Document în lucru.</strong> Trebuie revizuit de un consultant
            înainte de publicarea pe domeniul final.
          </p>

          {privacySections.map((section) => (
            <article
              key={section.title}
              style={{
                marginTop: 'var(--s-7)',
                paddingBottom: 'var(--s-6)',
                borderBottom: '1px solid var(--c-rule)',
              }}
            >
              <h2 className="h-sub">{section.title}</h2>
              <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="prose" style={{ maxWidth: 'none' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}

          <p style={{ marginTop: 'var(--s-6)' }}>
            Întrebări despre datele dumneavoastră?{' '}
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>

          <p style={{ marginTop: 'var(--s-5)' }}>
            <Link to="/contact" className="text-link">
              Înapoi la formular <ArrowRight />
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
