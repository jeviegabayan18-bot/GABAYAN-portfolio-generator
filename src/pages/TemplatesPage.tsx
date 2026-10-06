import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getDataLayer } from '../data/index.ts'
import type { Portfolio } from '../data/types.ts'
import { MissingPortfolio } from '../components/MissingPortfolio.tsx'
import { usePageTitle } from '../lib/title.ts'
import { TEMPLATES } from '../lib/templates.ts'
import { PortfolioView } from '../templates/PortfolioView.tsx'
import { SAMPLE_PORTFOLIO } from '../templates/sample.ts'

export function TemplatesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const justSaved = Boolean((location.state as { saved?: boolean } | null)?.saved)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loadedId, setLoadedId] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (id !== loadedId) {
    setLoadedId(id)
    setLoading(true)
    setMissing(false)
    setPortfolio(null)
    setSelected(null)
    setError(null)
  }

  usePageTitle('Choose a template')

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
        setSelected(found.template_id)
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

  async function generate() {
    if (!id || selected === null || saving) return
    setSaving(true)
    setError(null)
    try {
      await getDataLayer().updatePortfolio(id, { template_id: selected })
      navigate(`/portfolio/${id}`)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not save the template.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="status">Loading templates…</p>
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
  if (missing || !portfolio) return <MissingPortfolio />

  return (
    <div className="page">
      <header className="page-intro">
        <h1>Choose a template</h1>
        <p>
          {portfolio
            ? `Pick a layout for ${portfolio.full_name}. You can switch later from the preview.`
            : 'Pick one of the three layouts.'}
        </p>
      </header>
      {justSaved ? (
        <p className="status status-success" role="status">
          Saved. Choose one of the three templates, then generate the portfolio.
        </p>
      ) : null}
      {error ? (
        <p className="status status-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="template-grid">
        {TEMPLATES.map((template) => {
          const isSelected = selected === template.id
          return (
            <article key={template.id} className={isSelected ? 'template-card is-selected' : 'template-card'}>
              <div className="thumb-frame" aria-hidden="true">
                <div className="thumb-scale">
                  <PortfolioView portfolio={{ ...SAMPLE_PORTFOLIO, template_id: template.id }} />
                </div>
              </div>
              <label className="template-choice">
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={isSelected}
                  onChange={() => setSelected(template.id)}
                />
                <span>
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                </span>
              </label>
            </article>
          )
        })}
      </div>
      <div className="button-row template-actions">
        <button type="button" className="btn btn-primary btn-lg" disabled={selected === null || saving} onClick={generate}>
          {saving ? 'Generating…' : 'Generate Portfolio'}
        </button>
        {id ? (
          <Link className="btn btn-secondary" to={`/edit/${id}`}>
            Edit information
          </Link>
        ) : null}
      </div>
    </div>
  )
}
