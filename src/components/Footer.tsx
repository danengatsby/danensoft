import { Link } from 'react-router-dom'
import { company, legalNav, nav, serverNav, social } from '../content/site'

const [firstWord, ...restWords] = company.name.split(' ')

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__grid">
          <div>
            <Link to="/" className="brand">
              <span className="brand__mark" aria-hidden="true">
                {company.initials}
              </span>
              <span>
                {firstWord} <b>{restWords.join(' ')}</b>
              </span>
            </Link>
            <p className="site-footer__statement">
              Aplicații cloud și produse SaaS pentru procese care nu mai încap în
              foi de calcul.
            </p>
          </div>

          <div className="site-footer__cols">
            <div>
              <h2>Navigare</h2>
              <ul>
                {nav.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
                {legalNav.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
                {/* Zonă privată, servită de serviciul Node: navigare completă, nu prin router. */}
                {serverNav.map((item) => (
                  <li key={item.to}>
                    <a href={item.to} rel="nofollow">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2>Contact</h2>
              <ul>
                <li>
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </li>
                {company.phone && (
                  <li>
                    <a href={`tel:${company.phone.replace(/\s/g, '')}`}>
                      {company.phone}
                    </a>
                  </li>
                )}
                <li className="muted">{company.location}</li>
                {social.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer noopener">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="site-footer__bar">
          <span>
            © {new Date().getFullYear()} {company.name} · {company.legal}
          </span>
          <span>Aplicații cloud · SaaS · Integrări · Mentenanță</span>
        </div>
      </div>
    </footer>
  )
}
