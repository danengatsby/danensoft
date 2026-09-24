import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('rutare', () => {
  it('afișează pagina principală', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { level: 1, name: /din excel/i }),
    ).toBeInTheDocument()
  })

  it('afișează pagina de servicii', () => {
    renderAt('/servicii')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /cinci direcții/i,
    )
  })

  it('afișează 404 pentru o adresă necunoscută', () => {
    renderAt('/adresa-inexistenta')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /nu există/i,
    )
  })

  it('navighează din meniu către contact', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const primaryNav = screen.getByRole('navigation', { name: /navigație principală/i })
    await user.click(within(primaryNav).getByRole('link', { name: 'Contact' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /spuneți-ne ce trebuie construit/i,
    )
  })

  it('meniul mobil se deschide, se închide cu Escape și anunță starea', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const toggle = screen.getByRole('button', { name: /meniu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })
})

describe('pagina de confidențialitate', () => {
  it('este accesibilă din subsol și identifică operatorul', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const footer = screen.getByRole('contentinfo')
    await user.click(within(footer).getByRole('link', { name: /confidențialitate/i }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/ce date colectăm/i)
    expect(screen.getByText(/operatorul este MOLDOVAN LUX S\.R\.L\./i)).toBeInTheDocument()
  })
})
