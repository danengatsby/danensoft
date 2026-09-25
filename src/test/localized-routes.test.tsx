import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { AppRoutes } from '../App'
import { render as prerender } from '../prerender'
import { findPage, languageFromPath, languages, localizedPagePath, localizePath, pageDefinitions } from '../lib/routes'

it.each(pageDefinitions)('prerandează conținutul EN și linkul către RO pentru $en', (page) => {
  const html = prerender(page.en)
  const document = new DOMParser().parseFromString(html, 'text/html')
  expect(document.querySelector('a[aria-label="English"]')?.getAttribute('href')).toBe(page.en)
  expect(document.querySelector('a[aria-label="Română"]')?.getAttribute('href')).toBe(localizedPagePath(page, 'ro'))
  expect(document.querySelector('a[aria-label="English"]')?.getAttribute('aria-current')).toBe('page')
  expect(document.body.textContent).toContain('Skip to content')
  expect(document.querySelector('a[href="/en/contact/"]')).not.toBeNull()
})

it('păstrează parametrii și ancorele la traducerea adreselor, fără a modifica API sau conturi', () => {
  expect(localizePath('/servicii?source=home#cloud', 'en')).toBe('/en/services/?source=home#cloud')
  expect(localizePath('/en/projects/contabo/?ref=home', 'ro')).toBe('/proiecte/contabo/?ref=home')
  for (const path of ['/cont', '/api/contact', '/projects/contabo.jpg', 'https://example.test/', '//example.test/']) {
    expect(localizePath(path, 'en')).toBe(path)
  }
  expect(findPage('/en/missing')).toBeUndefined()
  expect(languageFromPath('/enough')).toBe('ro')
})

it.each(languages)('canonical și hreflang sunt corecte la acces direct în %s', (language) => {
  const page = pageDefinitions.find((page) => page.path === '/servicii')!
  render(<MemoryRouter initialEntries={[localizedPagePath(page, language) + '?ref=campaign']}><AppRoutes /></MemoryRouter>)
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', `https://danenachesoft.space${localizedPagePath(page, language)}`)
  expect(document.querySelector('link[hreflang="ro"]')).toHaveAttribute('href', 'https://danenachesoft.space/servicii/')
  expect(document.querySelector('link[hreflang="en"]')).toHaveAttribute('href', 'https://danenachesoft.space/en/services/')
  expect(document.querySelector('link[hreflang="x-default"]')).toHaveAttribute('href', 'https://danenachesoft.space/servicii/')
})

function History() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>Test back</button>
}
it('schimbarea limbii și istoricul browserului actualizează pagina și metadatele', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/servicii?ref=home']}><History /><AppRoutes /></MemoryRouter>)
  await user.click(screen.getByRole('link', { name: 'English' }))
  expect(screen.getByRole('link', { name: 'Română' })).toHaveAttribute('href', '/servicii/?ref=home')
  expect(document.documentElement.lang).toBe('en')
  await user.click(screen.getByRole('button', { name: 'Test back' }))
  expect(document.documentElement.lang).toBe('ro')
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://danenachesoft.space/servicii/')
})

it('pagina 404 engleză nu are canonical sau hreflang și revenirea reactivează indexarea', async () => {
  render(<MemoryRouter initialEntries={['/en/does-not-exist']}><AppRoutes /></MemoryRouter>)
  expect(document.querySelector('link[rel="canonical"]')).toBeNull()
  expect(document.querySelector('link[hreflang]')).toBeNull()
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
  await userEvent.click(screen.getByRole('link', { name: /Back to home/ }))
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index,follow')
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://danenachesoft.space/en/')
})
