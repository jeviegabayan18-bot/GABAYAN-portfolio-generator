import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { FormPage } from './pages/FormPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ManagePage } from './pages/ManagePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PreviewPage } from './pages/PreviewPage.tsx'
import { TemplatesPage } from './pages/TemplatesPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<FormPage mode="create" />} />
          <Route path="/edit/:id" element={<FormPage mode="edit" />} />
          <Route path="/templates/:id" element={<TemplatesPage />} />
          <Route path="/portfolio/:id" element={<PreviewPage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
