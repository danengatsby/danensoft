import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../App'
import { LANGUAGE_KEY, translate } from '../lib/language'

function renderPage(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>)
}

beforeEach(() => { localStorage.removeItem(LANGUAGE_KEY); vi.stubGlobal('scrollTo', vi.fn()) })
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  localStorage.removeItem(LANGUAGE_KEY)
  document.documentElement.lang = 'ro'
})

describe('Language selection', () => {
  it('changes the URL, content, metadata and navigation and supports direct English access', async () => {
    const user = userEvent.setup()
    const first = renderPage()
    await user.click(screen.getByRole('link', { name: 'English' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Web applications and integrationsfor your business.')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('Software development for business · Dan Enache')
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/')
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    await user.click(within(nav).getByRole('link', { name: 'Services' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Software services, from analysis to maintenance.')
    first.unmount()
    renderPage('/en/about/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('A technical partner involved at every stage.')
    await user.click(screen.getByRole('link', { name: 'Română' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Un partener tehnic implicat în fiecare etapă.')
    expect(document.documentElement.lang).toBe('ro')
  })

  it('preserves the selected project category when the language changes', async () => {
    const user = userEvent.setup()
    renderPage('/proiecte')
    await user.click(screen.getByRole('button', { name: 'Mobil' }))
    await user.click(screen.getByRole('link', { name: 'English' }))
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Application for field teams' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 published projects · 1 demo')
  })

  it('preserves form values and selected topic, translates errors and submits the original values', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', '/api/contact')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderPage('/contact')
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ana Test')
    await user.selectOptions(screen.getByLabelText('Subiect'), 'Integrări și automatizări')
    await user.click(screen.getByRole('button', { name: 'Trimite mesajul' }))
    await user.click(screen.getByRole('link', { name: 'English' }))
    expect(screen.getByLabelText('Full name')).toHaveValue('Ana Test')
    expect(screen.getByLabelText('Subject')).toHaveValue('Integrări și automatizări')
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email', { exact: true }), 'ana@example.com')
    await user.type(screen.getByLabelText('Tell us about your project'), 'A project description long enough to be valid.')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('Message sent.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ name: 'Ana Test', email: 'ana@example.com', topic: 'Integrări și automatizări' })
  })

  it('keeps switching functional when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
    renderPage()
    await userEvent.click(screen.getByRole('link', { name: 'English' }))
    expect(document.documentElement.lang).toBe('en')
  })

  it('uses the URL despite an old preference or a storage event from another tab', () => {
    localStorage.setItem(LANGUAGE_KEY, 'en')
    const first = renderPage('/contact')
    expect(screen.getByLabelText('Nume și prenume')).toBeInTheDocument()
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LANGUAGE_KEY, newValue: 'en' })))
    expect(screen.getByLabelText('Nume și prenume')).toBeInTheDocument()
    first.unmount()
    localStorage.setItem(LANGUAGE_KEY, 'ro')
    renderPage('/en/contact/')
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
  })

  it('preserves surrounding spaces and interpolates project names and domains', () => {
    expect(translate('en', ' Vezi site-ul ')).toBe(' Visit website ')
    expect(translate('en', 'Deschide {name} — {domain} (filă nouă)', { name: 'Poetio', domain: 'poetio.cloud' })).toBe('Open Poetio — poetio.cloud (new tab)')
  })
})
