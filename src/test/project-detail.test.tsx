import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { publishedProjects } from '../content/site'
import { translate } from '../lib/language'

afterEach(() => localStorage.clear())

it.each(publishedProjects)('deschide studiul de caz pentru $id fără a părăsi site-ul', async (project) => {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/proiecte']}><AppRoutes /></MemoryRouter>)
  const name = project.title.split(' — ')[0]
  const card = screen.getByRole('link', { name: `Vezi studiul de caz: ${name}` })
  expect(card).not.toHaveAttribute('target')
  await user.click(card)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(project.title)
  expect(screen.getByText(project.problem)).toBeInTheDocument()
  expect(screen.getByText(project.approach)).toBeInTheDocument()
  expect(screen.getByText(project.result!)).toBeInTheDocument()
  const external = screen.getByRole('link', { name: /Deschide site-ul/ })
  expect(external).toHaveAttribute('href', project.href)
  expect(external).toHaveAttribute('target', '_blank')
  expect(external).toHaveAttribute('rel', 'noreferrer noopener')

  await user.click(screen.getByRole('button', { name: 'English' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(translate('en', project.title))
  expect(screen.getByRole('heading', { name: 'Context and challenge' })).toBeInTheDocument()
  expect(screen.getByText(translate('en', project.approach))).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'All projects' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Software projects and digital experiences.')
})

it.each(['absent', 'flux-comenzi'])('afișează 404 pentru proiectul fără studiu de caz: %s', (id) => {
  render(<MemoryRouter initialEntries={[`/proiecte/${id}`]}><AppRoutes /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/nu există/i)
  expect(screen.queryByRole('link', { name: /Deschide site-ul/ })).not.toBeInTheDocument()
})
