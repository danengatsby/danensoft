import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import ContactForm from '../components/ContactForm'
import LanguageProvider from '../components/LanguageProvider'
import LanguageSwitch from '../components/LanguageSwitch'
import { CONTACT_TIMEOUT_MS } from '../lib/contact-request'

function renderForm(path = '/contact/') {
  vi.stubEnv('VITE_CONTACT_ENDPOINT', '/api/contact')
  const view = render(<MemoryRouter initialEntries={[path]}><LanguageProvider><LanguageSwitch /><ContactForm /></LanguageProvider></MemoryRouter>)
  const form = view.container.querySelector('form')!
  for (const [name, value] of Object.entries({ name: 'Ana Test', email: 'ana@example.com', organisation: 'Firma Test', message: 'Un mesaj de test care trebuie păstrat integral.' })) {
    fireEvent.change(form.querySelector(`[name="${name}"]`)!, { target: { value } })
  }
  return { ...view, form }
}

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('expirarea deblochează formularul, păstrează datele și ignoră confirmarea întârziată', async () => {
  vi.useFakeTimers()
  let lateResponse: (response: Response) => void = () => {}
  const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { lateResponse = resolve }))
  vi.stubGlobal('fetch', fetchMock)
  const { form } = renderForm()
  fireEvent.submit(form)
  fireEvent.submit(form)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByLabelText('Nume și prenume')).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('cel mult 15 secunde')
  await act(() => vi.advanceTimersByTimeAsync(CONTACT_TIMEOUT_MS))
  expect(screen.getByRole('status')).toHaveTextContent('Mesajul poate fi deja salvat')
  expect(screen.getByRole('status')).toHaveFocus()
  expect(screen.getByRole('button')).toBeEnabled()
  expect(screen.getByLabelText('Nume și prenume')).toHaveValue('Ana Test')
  expect(screen.getByLabelText('Nume și prenume')).toBeEnabled()
  const mailto = screen.getByRole('link', { name: 'Deschideți mesajul în clientul de e-mail' }).getAttribute('href')!
  expect(decodeURIComponent(mailto)).toContain('Un mesaj de test care trebuie păstrat integral.')
  await act(async () => { lateResponse(new Response('{"ok":true}', { status: 201 })) })
  expect(screen.getByRole('status')).not.toHaveTextContent('Mesaj trimis.')
  expect(screen.getByLabelText('Despre ce este vorba')).toHaveValue('Un mesaj de test care trebuie păstrat integral.')
  expect(fetchMock).toHaveBeenCalledTimes(1)

  // O reîncercare explicită poate reuși; confirmarea golește datele numai atunci.
  fetchMock.mockResolvedValueOnce(new Response('{"ok":true}', { status: 201 }))
  await act(async () => { fireEvent.submit(form) })
  expect(screen.getByRole('status')).toHaveTextContent('Mesaj trimis.')
  expect(screen.getByLabelText('Nume și prenume')).toHaveValue('')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('anulează cererea când formularul este demontat', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetchMock)
  const { form, unmount } = renderForm()
  fireEvent.submit(form)
  await act(async () => unmount())
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})

it('afișează și traduce erorile serverului fără cod HTTP sau detalii tehnice', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private stack trace', { status: 503 })))
  const { form } = renderForm('/en/contact/')
  await act(async () => { fireEvent.submit(form) })
  expect(screen.getByRole('status')).toHaveTextContent('temporarily unavailable')
  expect(screen.getByRole('status')).not.toHaveTextContent(/HTTP|503|private stack trace/)
  fireEvent.click(screen.getByRole('link', { name: 'Română' }))
  expect(screen.getByRole('status')).toHaveTextContent('temporar indisponibil')
  expect(screen.getByLabelText('Nume și prenume')).toHaveValue('Ana Test')
})

it('afișează erorile 422 lângă câmpuri și mută focusul la primul', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'internal exception', fields: ['email', 'organisation', 'topic'] }), { status: 422 })))
  const { form } = renderForm('/en/contact/')
  await act(async () => { fireEvent.submit(form) })
  const email = screen.getByLabelText('Email', { exact: true })
  expect(email).toHaveFocus()
  expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(email).toHaveAccessibleDescription('Please enter a valid email address.')
  expect(screen.getByLabelText('Organisation (optional)')).toHaveAccessibleDescription('Check the organisation you entered.')
  expect(screen.getByLabelText('Subject')).toHaveAccessibleDescription('Select a valid subject.')
  expect(screen.queryByText('internal exception')).not.toBeInTheDocument()
})

it('schimbă limba în timpul așteptării fără a retrimite sau a prelungi termenul', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetchMock)
  const { form } = renderForm()
  fireEvent.submit(form)
  await act(() => vi.advanceTimersByTimeAsync(5_000))
  fireEvent.click(screen.getByRole('link', { name: 'English' }))
  expect(screen.getByRole('status')).toHaveTextContent('up to 15 seconds')
  await act(() => vi.advanceTimersByTimeAsync(CONTACT_TIMEOUT_MS - 5_000))
  expect(screen.getByRole('status')).toHaveTextContent('Your message may already be saved')
  expect(screen.getByLabelText('Full name')).toHaveValue('Ana Test')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
