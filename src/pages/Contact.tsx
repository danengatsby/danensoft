import PageIntro from '../components/PageIntro'
import ContactForm from '../components/ContactForm'
import { usePageMeta } from '../hooks/usePageMeta'
import { CheckIcon, MailIcon } from '../components/Icons'
import { company, social } from '../content/site'

export default function Contact() {
  usePageMeta(
    'Contact',
    'Scrieți-ne despre procesul pe care vreți să îl automatizați sau despre aplicația de care aveți nevoie.',
  )

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        note="Răspuns în maximum două zile lucrătoare"
        title={
          <>
            Spuneți-ne ce trebuie <em>construit.</em>
          </>
        }
        description="Cel mai util prim mesaj descrie procesul actual și ce ar trebui să se schimbe. Nu aveți nevoie de o specificație tehnică — o construim împreună."
      />

      <section className="section">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div>
            <p
              className="eyebrow"
              style={{ marginBottom: 'var(--s-5)', color: 'var(--c-accent)' }}
            >
              <MailIcon style={{ width: '1.1rem', height: '1.1rem' }} />
              Brief / start
            </p>
            <h2 className="h-sub">Nu aveți nevoie de un caiet de sarcini perfect.</h2>
            <p className="prose" style={{ marginTop: 'var(--s-4)' }}>
              Un context sincer este mai util decât o listă lungă de funcții.
            </p>

            <div style={{ marginTop: 'var(--s-6)' }}>
              <p className="mono-sm" style={{ marginBottom: 'var(--s-4)' }}>
                Un început bun include
              </p>
              <ul className="checklist">
                <li>
                  <CheckIcon />
                  <span>procesul sau produsul vizat</span>
                </li>
                <li>
                  <CheckIcon />
                  <span>cine îl folosește astăzi</span>
                </li>
                <li>
                  <CheckIcon />
                  <span>ce anume costă timp sau bani</span>
                </li>
                <li>
                  <CheckIcon />
                  <span>sistemele care trebuie integrate</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: 'var(--s-6)' }}>
              <p className="mono-sm" style={{ marginBottom: 'var(--s-4)' }}>
                Date de contact
              </p>
              <ul className="checklist">
                <li>
                  <CheckIcon />
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </li>
                {company.phone && (
                  <li>
                    <CheckIcon />
                    <a href={`tel:${company.phone.replace(/\s/g, '')}`}>
                      {company.phone}
                    </a>
                  </li>
                )}
                <li>
                  <CheckIcon />
                  <span>{company.location}</span>
                </li>
                {social.map((item) => (
                  <li key={item.href}>
                    <CheckIcon />
                    <a href={item.href} target="_blank" rel="noreferrer noopener">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  )
}
