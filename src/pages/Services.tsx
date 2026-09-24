import { Link } from 'react-router-dom'
import PageIntro from '../components/PageIntro'
import SectionHead from '../components/SectionHead'
import { usePageMeta } from '../hooks/usePageMeta'
import { serviceIcons } from '../components/serviceIcons'
import { ArrowRight, ArrowUpRight, CheckIcon } from '../components/Icons'
import { faq, services } from '../content/site'

export default function Services() {
  usePageMeta(
    'Servicii',
    'Aplicații cloud, integrări și automatizări, AI aplicat, mentenanță și operare pe infrastructură proprie.',
  )

  return (
    <>
      <PageIntro
        eyebrow="Servicii"
        note="Cloud · SaaS · Integrări · AI · Mentenanță"
        title={
          <>
            Cinci direcții, <em>impact măsurabil.</em>
          </>
        }
        description="Fiecare serviciu include ce livrăm concret și tehnologiile pe care le folosim de obicei. Alegerea finală depinde de sistemele pe care le aveți deja."
      />

      <section className="section">
        <div className="wrap">
          {services.map((service, index) => {
            const Icon = serviceIcons[service.id]
            return (
              <article
                key={service.id}
                id={service.id}
                className="service-detail"
                style={{ scrollMarginTop: '6rem' }}
              >
                <div className="service-detail__index">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Icon />
                </div>
                <div>
                  <h2>{service.title}</h2>
                  <div className="service-detail__cols">
                    <div>
                      <h3>Situația</h3>
                      <p>{service.summary}</p>
                    </div>
                    <div>
                      <h3>Cum lucrăm</h3>
                      <p>{service.detail}</p>
                    </div>
                    <div>
                      <h3>Primiți concret</h3>
                      <ul className="service-deliverables">
                        {service.deliverables.map((item) => (
                          <li key={item}>
                            <CheckIcon />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <ul className="tag-row">
                    {service.stack.map((item) => (
                      <li key={item} className="tag">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead
            eyebrow="Colaborare"
            title={
              <>
                Întrebări puse <em>înainte de start.</em>
              </>
            }
          >
            <p>
              Dacă întrebarea dumneavoastră nu apare aici, scrieți-ne — răspundem
              chiar dacă răspunsul este că nu suntem potriviți pentru proiect.
            </p>
          </SectionHead>

          <div className="grid grid--2">
            {faq.map((item) => (
              <article key={item.q} className="card">
                <h3 className="h-card">{item.q}</h3>
                <p>{item.a}</p>
              </article>
            ))}
          </div>

          <p style={{ marginTop: 'var(--s-6)' }}>
            <Link to="/proiecte" className="text-link">
              Vezi exemple de implementare <ArrowRight />
            </Link>
          </p>
        </div>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <div>
            <p className="eyebrow">Nu sunteți sigur?</p>
            <h2 style={{ marginTop: 'var(--s-4)' }}>
              Descrieți situația <em>așa cum este.</em>
            </h2>
            <p className="prose">
              Dacă nu este de competența noastră, vă spunem direct și, când putem,
              recomandăm o alternativă.
            </p>
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
