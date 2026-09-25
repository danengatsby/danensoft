import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { allRoutes, projectRoutes } from '../content/site'
import { pageDefinitions, normalizePath } from '../lib/routes'

const ROUTES = [
  '/',
  '/servicii',
  '/proiecte',
  '/despre',
  '/contact',
  '/confidentialitate',
  '/404-test',
  ...projectRoutes.map((route) => route.to),
  ...pageDefinitions.map((page) => page.en),
  '/en/404-test',
]
const KNOWN_PATHS = new Set([...allRoutes.map((item) => item.to), ...pageDefinitions.map((page) => normalizePath(page.en))])

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe.each(ROUTES)('structura paginii %s', (path) => {
  it('are exact un titlu de nivel 1', () => {
    renderAt(path)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('are reperele de pagină și linkul de sărire la conținut', () => {
    renderAt(path)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sari la conținut|skip to content/i })).toHaveAttribute(
      'href',
      '#continut',
    )
  })

  it('nu conține linkuri interne către rute inexistente', () => {
    const { container } = renderAt(path)
    const internal = Array.from(container.querySelectorAll('a[href^="/"]'))
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => !href.startsWith('//'))

    for (const href of internal) {
      const pathname = new URL(href, 'https://example.test').pathname
      expect(KNOWN_PATHS.has(normalizePath(pathname))).toBe(true)
    }
  })

  it('nu conține linkuri sau butoane fără text accesibil', () => {
    renderAt(path)
    for (const element of [
      ...screen.getAllByRole('link'),
      ...screen.getAllByRole('button'),
    ]) {
      expect(element).toHaveAccessibleName()
    }
  })

  it('deschide linkurile externe în siguranță', () => {
    const { container } = renderAt(path)
    for (const anchor of container.querySelectorAll<HTMLAnchorElement>(
      'a[target="_blank"]',
    )) {
      expect(anchor.rel).toContain('noopener')
    }
  })
})

describe('formularul de contact', () => {
  it('are etichetă pentru fiecare câmp completabil', () => {
    const { container } = renderAt('/contact')
    const fields = container.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), textarea, select',
    )

    expect(fields.length).toBeGreaterThan(0)
    for (const field of fields) {
      // Câmpul-capcană pentru roboți este ascuns intenționat.
      if (field.closest('.honeypot')) continue
      const label = container.querySelector(`label[for="${field.id}"]`)
      expect(label, `lipsește eticheta pentru #${field.id}`).not.toBeNull()
    }
  })
})
