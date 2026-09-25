import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Portfolio from './pages/Portfolio'
import ProjectDetail from './pages/ProjectDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'
import LanguageProvider from './components/LanguageProvider'

export function AppRoutes() {
  return (
    <LanguageProvider><Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="servicii" element={<Services />} />
        <Route path="proiecte" element={<Portfolio />} />
        <Route path="proiecte/:projectId" element={<ProjectDetail />} />
        <Route path="despre" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="confidentialitate" element={<Privacy />} />
        <Route path="en" element={<Home />} />
        <Route path="en/services" element={<Services />} />
        <Route path="en/projects" element={<Portfolio />} />
        <Route path="en/projects/:projectId" element={<ProjectDetail />} />
        <Route path="en/about" element={<About />} />
        <Route path="en/contact" element={<Contact />} />
        <Route path="en/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes></LanguageProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
