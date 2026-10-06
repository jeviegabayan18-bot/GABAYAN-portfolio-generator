import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDataLayer } from '../data/index.ts'
import type { Portfolio } from '../data/types.ts'
import { MissingPortfolio } from '../components/MissingPortfolio.tsx'
import { usePageTitle } from '../lib/title.ts'
import { TEMPLATES } from '../lib/templates.ts'
import { PortfolioView } from '../templates/PortfolioView.tsx'

export function PreviewPage() {
  const { id } = useParams()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loadedId, setLoadedId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (id !== loadedId) {
    setLoadedId(id)
    setLoading(true)
    setMissing(false)
    setPortfolio(null)
    setError(null)
  }

  usePageTitle(portfolio?.full_name ?? 'Preview')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getDataLayer()
      .getPortfolio(id)
      .then((found) => {
        if (cancelled) return
        if (!found) {
          setMissing(true)
          return
        }
        setPortfolio(found)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load this portfolio.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function switchTemplate(templateId: number) {
    if (!id || !portfolio || switching || portfolio.template_id === templateId) return
    setSwitching(true)
    setError(null)
    try {
      const updated = await getDataLayer().updatePortfolio(id, { template_id: templateId })
      setPortfolio(updated)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not change the template.')
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="status">Loading portfolio…</p>
      </div>
    )
  }
  if (error && !portfolio) {
    return (
      <div className="page page-narrow">
        <p className="status status-error" role="alert">
          {error}
        </p>
      </div>
    )
  }
  if (missing || !portfolio || !id) return <MissingPortfolio />

  return (
    <div className="preview-page">
      <div className="preview-toolbar no-print">
        <div className="toolbar-group">
          <span className="toolbar-label">Template</span>
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={portfolio.template_id === template.id ? 'chip-button is-on' : 'chip-button'}
              aria-pressed={portfolio.template_id === template.id}
              disabled={switching}
              onClick={() => switchTemplate(template.id)}
            >
              {template.name}
            </button>
          ))}
          {switching ? <span className="hint">Saving…</span> : null}
        </div>
        <div className="toolbar-actions">
          <Link className="btn btn-secondary" to={`/edit/${id}`}>
            Edit
          </Link>
          <Link className="btn btn-secondary" to="/manage">
            Back to Manage
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>
      {error ? (
        <p className="status status-error no-print" role="alert">
          {error}
        </p>
      ) : null}
      {portfolio.template_id === null ? (
        <div className="page page-narrow no-print">
          <div className="empty-state">
            <h1>Choose a template to generate this portfolio</h1>
            <p>Use the template buttons above, or go back to the template page.</p>
            <Link className="btn btn-primary" to={`/templates/${id}`}>
              Choose a template
            </Link>
          </div>
        </div>
      ) : (
        <div className="preview-stage">
          <PortfolioView portfolio={portfolio} />
        </div>
      )}
    </div>
  )
}
