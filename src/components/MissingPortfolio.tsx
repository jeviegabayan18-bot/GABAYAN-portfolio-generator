import { Link } from 'react-router-dom'

export function MissingPortfolio() {
  return (
    <div className="page page-narrow">
      <div className="empty-state">
        <h1>Portfolio not found</h1>
        <p>No saved portfolio matches this link. It may have been deleted.</p>
        <div className="button-row">
          <Link className="btn btn-primary" to="/create">
            Create Portfolio
          </Link>
          <Link className="btn btn-secondary" to="/manage">
            Manage portfolios
          </Link>
        </div>
      </div>
    </div>
  )
}
