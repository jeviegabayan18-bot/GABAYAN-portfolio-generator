import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDataLayer } from '../data/index.ts'
import type { PortfolioSummary } from '../data/types.ts'
import { Portrait } from '../components/Portrait.tsx'
import { formatUpdated } from '../lib/format.ts'
import { usePageTitle } from '../lib/title.ts'
import { templateById } from '../lib/templates.ts'

export function ManagePage() {
  const [items, setItems] = useState<PortfolioSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<PortfolioSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  usePageTitle('Manage portfolios')

  useEffect(() => {
    let cancelled = false
    getDataLayer()
      .listPortfolios()
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load portfolios.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function askDelete(item: PortfolioSummary) {
    setPending(item)
    dialogRef.current?.showModal()
  }

  async function confirmDelete() {
    if (!pending || deleting) return
    setDeleting(true)
    setError(null)
    try {
      await getDataLayer().deletePortfolio(pending.id)
      setItems((current) => current.filter((item) => item.id !== pending.id))
      setNotice(`Deleted ${pending.full_name}.`)
      dialogRef.current?.close()
      setPending(null)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not delete that portfolio.')
      dialogRef.current?.close()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-intro page-intro-row">
        <div>
          <h1>Manage portfolios</h1>
          <p>Open a saved portfolio to view it, edit the details, change the template, or delete it.</p>
        </div>
        <Link className="btn btn-primary" to="/create">
          Create Portfolio
        </Link>
      </header>

      {notice ? (
        <p className="status status-success" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="status status-error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="status">Loading portfolios…</p> : null}

      {!loading && items.length === 0 ? (
        <div className="empty-state">
          <h2>No portfolios yet</h2>
          <p>Create one to save your information and generate a page.</p>
          <Link className="btn btn-primary" to="/create">
            Create Portfolio
          </Link>
        </div>
      ) : null}

      <ul className="manage-list">
        {items.map((item) => {
          const template = templateById(item.template_id)
          return (
            <li key={item.id} className="manage-card">
              <Portrait name={item.full_name} url={item.profile_picture_url} className="manage-portrait" />
              <div className="manage-copy">
                <h2>{item.full_name}</h2>
                <p>{item.email}</p>
                <p className="manage-meta">
                  {template ? template.name : 'No template yet'}
                  {' · Updated '}
                  {formatUpdated(item.updated_at)}
                </p>
              </div>
              <div className="manage-actions">
                <Link className="btn btn-secondary" to={`/portfolio/${item.id}`}>
                  View
                </Link>
                <Link className="btn btn-secondary" to={`/edit/${item.id}`}>
                  Edit
                </Link>
                <Link className="btn btn-secondary" to={`/templates/${item.id}`}>
                  Change template
                </Link>
                <button type="button" className="btn btn-danger" onClick={() => askDelete(item)}>
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <dialog
        ref={dialogRef}
        className="modal"
        onClose={() => setPending(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close()
        }}
      >
        <h2>Delete this portfolio?</h2>
        <p>
          {pending
            ? `${pending.full_name}'s information, photo, and template choice will be removed. This cannot be undone.`
            : 'This cannot be undone.'}
        </p>
        <div className="button-row">
          <button type="button" className="btn btn-secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" disabled={deleting} onClick={confirmDelete}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
