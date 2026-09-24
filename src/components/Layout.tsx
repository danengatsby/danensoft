import { useLanguage } from '../hooks/useLanguage'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const { t } = useLanguage()
  const { pathname, hash } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  // Linkurile către servicii ajung la secțiunea cerută, sub antetul fix.
  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (isFirstRender.current) {
      isFirstRender.current = false
      target?.scrollIntoView({ behavior: 'instant', block: 'start' })
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, hash])

  return (
    <div className="page">
      <a className="skip-link" href="#continut">{t("Sari la conținut")}</a>
      <Header />
      <main id="continut" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
