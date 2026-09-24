import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
import ContactForm from '../components/ContactForm'
import { validate } from '../lib/contact'

function renderForm() {
  return render(
    <MemoryRouter>
      <ContactForm />
    </MemoryRouter>,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nume și prenume/i), 'Ana Popescu')
  await user.type(screen.getByLabelText(/e-mail/i), 'ana@exemplu.ro')
  await user.type(
    screen.getByLabelText(/despre ce este vorba/i),
    'Introducem manual facturile primite pe e-mail în programul de contabilitate.',
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('validate()', () => {
  it('respinge câmpurile goale', () => {
    const errors = validate({
      name: '',
      email: '',
      organisation: '',
      topic: 'x',
      message: '',
    })
    expect(errors.name).toBeDefined()
    expect(errors.email).toBeDefined()
    expect(errors.message).toBeDefined()
  })

  it('respinge un e-mail invalid', () => {
    const errors = validate({
      name: 'Ana Popescu',
      email: 'ana@localhost',
      organisation: '',
      topic: 'x',
      message: 'Un mesaj suficient de lung pentru validare.',
    })
    expect(errors.email).toBeDefined()
  })

  it('acceptă datele complete', () => {
    const errors = validate({
      name: 'Ana Popescu',
      email: 'ana@exemplu.ro',
      organisation: 'Exemplu SRL',
      topic: 'x',
      message: 'Avem un proces manual de introducere a facturilor.',
    })
    expect(errors).toEqual({})
  })

  it.each([5000, 5001, 5100])('verifică limita pentru un mesaj de %i caractere', (length) => {
    const errors = validate({
      name: 'Ana Popescu', email: 'ana@exemplu.ro', organisation: '', topic: 'x',
      message: 'a'.repeat(length),
    })
    if (length <= 5000) expect(errors.message).toBeUndefined()
    else expect(errors.message).toMatch(/5\.000 de caractere/)
  })

  it('include spațiile marginale în limita mesajului', () => {
    expect(validate({
      name: 'Ana Popescu', email: 'ana@exemplu.ro', organisation: '', topic: 'x',
      message: ` ${'a'.repeat(5000)} `,
    }).message).toMatch(/5\.000 de caractere/)
  })
})

describe('<ContactForm />', () => {
  it('păstrează textul lipit peste limită, explică eroarea și permite corectarea', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()
    await fillValidForm(user)
    const message = screen.getByLabelText(/despre ce este vorba/i)
    await user.clear(message)
    await user.paste('a'.repeat(5100))
    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))

    expect(message).toHaveValue('a'.repeat(5100))
    expect(message).toHaveFocus()
    expect(message).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/mesajul poate avea cel mult 5\.000 de caractere/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    await user.clear(message)
    await user.paste('a'.repeat(5000))
    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).message).toBe('a'.repeat(5000))
    expect(screen.getByRole('status')).toHaveTextContent(/mesaj trimis/i)
  })

  it('afișează erori și mută focusul pe primul câmp invalid', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))

    expect(await screen.findByText(/introduceți numele/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nume și prenume/i)).toHaveFocus()
    expect(screen.getByLabelText(/nume și prenume/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('trimite datele la endpoint și confirmă doar după un răspuns reușit', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/mesaj trimis/i)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/contact')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({
      name: 'Ana Popescu',
      email: 'ana@exemplu.ro',
    })
  })

  it('nu pretinde succes când serverul respinge cererea', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/eșuat/i)
    expect(status).not.toHaveTextContent(/mesaj trimis/i)
  })

  it('afișează explicația API-ului la 422 și păstrează textul pentru corectare', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ error: 'Mesajul poate avea cel mult 5.000 de caractere.' }),
    }))
    renderForm()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/mesajul poate avea cel mult 5\.000 de caractere/i)
    expect(screen.getByLabelText(/despre ce este vorba/i)).toHaveValue(
      'Introducem manual facturile primite pe e-mail în programul de contabilitate.',
    )
  })

  it('rulează demonstrativ, fără să trimită nimic, când endpoint-ul lipsește', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', '')
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /trimite mesajul/i }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/nu a fost trimis/i)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole('link', { name: /deschideți mesajul în clientul de e-mail/i }),
    ).toHaveAttribute('href', expect.stringContaining('mailto:'))
  })
})
