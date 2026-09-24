import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { company, nav } from '../content/site'
import ThemeToggle from './ThemeToggle'
import { ArrowUpRight } from './Icons'

const [firstWord, ...restWords] = company.name.split(' ')

export default function Header() {
  const [open, setOpen] = useState(false)
  const navId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const [renderedPath, setRenderedPath] = useState(pathname)

  // Închide meniul la schimbarea rutei — inclusiv la navigarea cu butonul „înapoi”.
  // Ajustarea stării în timpul randării evită o randare suplimentară cu meniul deschis.
  if (pathname !== renderedPath) {
    setRenderedPath(pathname)
    setOpen(false)
  }

  // Escape închide meniul și readuce focusul pe buton.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            {company.initials}
          </span>
          <span>
            {firstWord} <b>{restWords.join(' ')}</b>
          </span>
        </Link>

        {/*
          Vizibilitatea este controlată din CSS, nu prin atributul `hidden`:
          pe desktop navigația trebuie să rămână în arborele de accesibilitate,
          iar pe mobil `display: none` o scoate corect din el când e închisă.
        */}
        <nav
          id={navId}
          className="nav"
          data-open={open}
          aria-label="Navigație principală"
        >
          <ul className="nav__list">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className="nav__link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* Zonă de cont: servită de serviciul Node, deci navigare completă. */}
          <a href="/cont" className="nav__link nav__link--account">
            Cont
          </a>
          <Link to="/contact" className="btn btn--dark">
            Cere o ofertă <ArrowUpRight />
          </Link>
        </nav>

        {open && (
          <button
            type="button"
            className="nav-backdrop"
            aria-label="Închide meniul"
            onClick={() => setOpen(false)}
          />
        )}

        <div className="site-header__actions">
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="icon-btn nav-toggle"
            aria-expanded={open}
            aria-controls={navId}
            aria-label={open ? 'Închide meniul' : 'Deschide meniul'}
            onClick={() => setOpen((value) => !value)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
