import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import CodeBackdrop from './CodeBackdrop'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  // La navigare: sus în pagină și focus pe conținut, pentru utilizatorii de tastatură.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="page">
      <CodeBackdrop />
      <a className="skip-link" href="#continut">
        Sari la conținut
      </a>
      <Header />
      <main id="continut" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
