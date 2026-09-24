import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { ArrowRight } from '../components/Icons'
import { nav } from '../content/site'

export default function NotFound() {
  usePageMeta('Pagină inexistentă', 'Adresa accesată nu corespunde niciunei pagini.')

  return (
    <div className="wrap notfound">
      <p className="eyebrow">404 · rută necunoscută</p>
      <h1>
        Pagina aceasta <em>nu există.</em>
      </h1>
      <p className="prose">
        Probabil adresa a fost scrisă greșit sau pagina a fost mutată. Puteți relua
        din secțiunile de mai jos.
      </p>
      <ul className="tag-row" style={{ gap: 'var(--s-3)', marginTop: 'var(--s-3)' }}>
        {nav.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="btn btn--secondary">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/" className="text-link">
        Înapoi acasă <ArrowRight />
      </Link>
    </div>
  )
}
