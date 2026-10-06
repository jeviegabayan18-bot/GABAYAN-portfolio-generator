import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/title.ts'

export function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="page page-narrow">
      <div className="empty-state">
        <h1>Page not found</h1>
        <p>That address does not match a page in Portfolio Generator.</p>
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
      </div>
    </div>
  )
}
