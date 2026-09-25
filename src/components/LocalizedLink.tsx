import { Link as RouterLink, NavLink as RouterNavLink, type LinkProps, type NavLinkProps, type To } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { localizePath, type Language } from '../lib/routes'

function localize(to: To, language: Language): To {
  return typeof to === 'string' ? localizePath(to, language)
    : { ...to, pathname: to.pathname ? localizePath(to.pathname, language) : to.pathname }
}
export function Link({ to, ...props }: LinkProps) {
  const { language } = useLanguage()
  return <RouterLink {...props} to={localize(to, language)} />
}
export function NavLink({ to, ...props }: NavLinkProps) {
  const { language } = useLanguage()
  return <RouterNavLink {...props} to={localize(to, language)} />
}
