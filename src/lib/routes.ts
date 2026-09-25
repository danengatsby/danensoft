import { publishedProjects } from '../content/site'

export type Language = 'ro' | 'en'
export const languages: Language[] = ['ro', 'en']
export const pageDefinitions = [
  { path: '/', en: '/en/', title: 'Dezvoltare software pentru afaceri', description: 'Dan Enache: dezvoltare de aplicații web și SaaS, integrări, automatizări și operare cloud. Un partener tehnic de la analiză la mentenanță.' },
  { path: '/servicii', en: '/en/services/', title: 'Servicii', description: 'Aplicații cloud, integrări și automatizări, AI aplicat, mentenanță și operare pe infrastructură proprie.' },
  { path: '/proiecte', en: '/en/projects/', title: 'Proiecte', description: 'Contabo, PCS, Poetio și RVR Taxi: proiecte reale de aplicații web, site-uri de prezentare și publicații digitale, alături de demonstrații interne.' },
  { path: '/despre', en: '/en/about/', title: 'Despre', description: 'Dan Enache, inginer software din Iași. Aplicații cloud, produse SaaS și colaborare directă, de la idee la lansare.' },
  { path: '/contact', en: '/en/contact/', title: 'Contact', description: 'Scrieți-ne despre procesul pe care vreți să îl automatizați sau despre aplicația de care aveți nevoie.' },
  { path: '/confidentialitate', en: '/en/privacy/', title: 'Confidențialitate', description: 'Ce date colectăm prin formularul de contact, ce facem cu ele și ce drepturi aveți.' },
  ...publishedProjects.map((project) => ({ path: `/proiecte/${project.id}`, en: `/en/projects/${project.id}/`, title: project.title, description: project.summary ?? project.approach })),
]
export const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/'
export const languageFromPath = (path: string): Language => path === '/en' || path.startsWith('/en/') ? 'en' : 'ro'
export const findPage = (path: string) => pageDefinitions.find((page) => [page.path, page.en].some((value) => normalizePath(value) === normalizePath(path)))
export const localizedPagePath = (page: typeof pageDefinitions[number], language: Language) => language === 'en' ? page.en : page.path === '/' ? '/' : `${page.path}/`

/** Transformă doar paginile publice. API, conturi, resurse și linkuri externe rămân intacte. */
export function localizePath(to: string, language: Language): string {
  if (!to.startsWith('/') || to.startsWith('//')) return to
  const match = to.match(/^([^?#]*)(.*)$/)!
  const page = findPage(match[1])
  return page ? localizedPagePath(page, language) + match[2] : to
}

export function languageSwitchPath(path: string, language: Language): string {
  const translated = localizePath(path, language)
  if (findPage(path.split(/[?#]/)[0])) return translated
  // O pagină inexistentă nu are o traducere; selectorul oferă pagina principală.
  return language === 'en' ? '/en/' : '/'
}
