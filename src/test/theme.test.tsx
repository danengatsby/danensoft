import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach } from 'vitest'
import { AppRoutes } from '../App'
import { THEME_KEY } from '../lib/theme'

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('comutator zi/noapte', () => {
  it('pornește pe tema deschisă când nu există o preferință salvată', () => {
    renderApp()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('comută pe tema întunecată și înapoi', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: /comută pe tema întunecată/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    await user.click(screen.getByRole('button', { name: /comută pe tema deschisă/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('salvează preferința și o reîncarcă la următoarea vizită', async () => {
    const user = userEvent.setup()
    const first = renderApp()

    await user.click(screen.getByRole('button', { name: /comută pe tema întunecată/i }))
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')

    first.unmount()
    renderApp()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(
      screen.getByRole('button', { name: /comută pe tema deschisă/i }),
    ).toBeInTheDocument()
  })

  it('setează color-scheme pentru controalele native', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(document.documentElement.style.colorScheme).toBe('light')
    await user.click(screen.getByRole('button', { name: /comută pe tema întunecată/i }))
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
