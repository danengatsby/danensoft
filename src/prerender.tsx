import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App'

export function render(pathname: string) {
  return renderToStaticMarkup(
    <StaticRouter location={pathname}>
      <AppRoutes />
    </StaticRouter>,
  )
}
