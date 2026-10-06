import type { ReactNode } from 'react'

export function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="req"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function Section({
  title,
  hint,
  children,
  onAdd,
  addLabel,
  atLimit,
}: {
  title: string
  hint: string
  children: ReactNode
  onAdd: () => void
  addLabel: string
  atLimit: boolean
}) {
  return (
    <section className="form-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <p>{hint}</p>
      </div>
      <div className="stack">{children}</div>
      <button type="button" className="btn btn-secondary" onClick={onAdd} disabled={atLimit}>
        {atLimit ? 'Maximum of 12 entries' : addLabel}
      </button>
    </section>
  )
}

export function Entry({
  title,
  onRemove,
  error,
  children,
}: {
  title: string
  onRemove: () => void
  error?: string
  children: ReactNode
}) {
  return (
    <div className={error ? 'entry entry-invalid' : 'entry'}>
      <div className="entry-bar">
        <h3>{title}</h3>
        <button type="button" className="text-button" onClick={onRemove}>
          Remove
        </button>
      </div>
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}
