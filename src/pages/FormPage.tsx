import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getDataLayer, isDemoMode } from '../data/index.ts'
import { Entry, Field, Section } from '../components/FormBits.tsx'
import { MissingPortfolio } from '../components/MissingPortfolio.tsx'
import { Portrait } from '../components/Portrait.tsx'
import {
  MAX_ROWS,
  PLATFORMS,
  blankDraft,
  blankEducation,
  blankLink,
  blankProject,
  blankSkill,
  blankWork,
  draftFromPortfolio,
} from '../lib/draft.ts'
import type {
  Draft,
  EducationDraft,
  LinkDraft,
  ProjectDraft,
  SkillDraft,
  WorkDraft,
} from '../lib/draft.ts'
import { validateImageFile } from '../lib/images.ts'
import { usePageTitle } from '../lib/title.ts'
import { emptyErrors, hasErrors, validateDraft } from '../lib/validate.ts'
import type { FormErrors } from '../lib/validate.ts'

export function FormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams()
  const id = params.id
  const navigate = useNavigate()
  const location = useLocation()
  const routedError = (location.state as { error?: string } | null)?.error

  const [draft, setDraft] = useState<Draft>(blankDraft)
  const [errors, setErrors] = useState<FormErrors>(emptyErrors)
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [existingUrl, setExistingUrl] = useState<string | null>(null)
  const [existingPath, setExistingPath] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(routedError ?? null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [missing, setMissing] = useState(false)
  const [saving, setSaving] = useState(false)

  usePageTitle(mode === 'edit' ? 'Edit portfolio' : 'Portfolio information')

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !id) return
    let cancelled = false
    getDataLayer()
      .getPortfolio(id)
      .then((portfolio) => {
        if (cancelled) return
        if (!portfolio) {
          setMissing(true)
          return
        }
        setDraft(draftFromPortfolio(portfolio))
        setExistingUrl(portfolio.profile_picture_url)
        setExistingPath(portfolio.profile_picture_path)
        setTemplateId(portfolio.template_id)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFormError(error instanceof Error ? error.message : 'Could not load this portfolio.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, id])

  const previewUrl = filePreview ?? (removePhoto ? null : existingUrl)

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0]
    event.target.value = ''
    if (!next) return
    const problem = validateImageFile(next)
    if (problem) {
      setPhotoError(problem)
      return
    }
    setPhotoError(null)
    setRemovePhoto(false)
    setFile(next)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const objectUrl = URL.createObjectURL(next)
    previewRef.current = objectUrl
    setFilePreview(objectUrl)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setFormError(null)

    const removing = removePhoto && !file
    const picture = {
      url: removing ? null : existingUrl,
      path: removing ? null : existingPath,
    }
    const result = validateDraft(draft, templateId, picture)
    setErrors(result.errors)
    if (photoError || !result.value || hasErrors(result.errors)) {
      window.setTimeout(() => {
        const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        invalid?.focus()
      }, 0)
      if (!photoError && hasErrors(result.errors)) {
        setFormError('Please fix the highlighted fields before saving.')
      }
      return
    }

    const data = getDataLayer()
    setSaving(true)
    try {
      const saved =
        mode === 'edit' && id
          ? await data.updatePortfolio(id, result.value)
          : await data.createPortfolio(result.value)

      if (file) {
        try {
          const uploaded = await data.uploadProfilePicture(saved.id, file)
          await data.updatePortfolio(saved.id, {
            profile_picture_url: uploaded.url,
            profile_picture_path: uploaded.path,
          })
          if (existingPath) await data.deleteProfilePicture(existingPath)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'The photo could not be saved.'
          if (mode === 'create') {
            navigate(`/edit/${saved.id}`, { replace: true, state: { error: message } })
            return
          }
          setFormError(message)
          setExistingUrl(saved.profile_picture_url)
          setExistingPath(saved.profile_picture_path)
          return
        }
      } else if (removing && existingPath) {
        await data.deleteProfilePicture(existingPath)
      }

      navigate(`/templates/${saved.id}`, {
        replace: mode === 'create',
        state: { saved: true },
      })
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Could not save this portfolio.')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'edit' && loading) {
    return (
      <div className="page page-narrow">
        <p className="status">Loading portfolio…</p>
      </div>
    )
  }
  if (missing) return <MissingPortfolio />

  return (
    <div className="page page-narrow">
      <header className="page-intro">
        <h1>{mode === 'edit' ? 'Edit portfolio' : 'Portfolio information'}</h1>
        <p>
          Fields marked with * are required. Sections you leave blank are hidden on the generated
          portfolio.
        </p>
      </header>

      {formError ? (
        <p className="status status-error" role="alert">
          {formError}
        </p>
      ) : null}

      <form className="portfolio-form" noValidate onSubmit={onSubmit}>
        <section className="form-section">
          <div className="section-heading">
            <h2>Personal info</h2>
            <p>This is the header of the portfolio.</p>
          </div>
          <div className="photo-row">
            <Portrait name={draft.full_name || 'Profile'} url={previewUrl} className="form-portrait" />
            <div>
              <label htmlFor="photo">Profile picture</label>
              <input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onFile}
              />
              <p className="hint">JPG, PNG, WEBP, or GIF. Maximum 2 MB.</p>
              {isDemoMode() ? (
                <p className="hint">
                  Demo mode stores a compressed copy in this browser. A connected database stores
                  the file in Supabase Storage.
                </p>
              ) : null}
              {previewUrl ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setFile(null)
                    setRemovePhoto(true)
                    setPhotoError(null)
                    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
                    previewRef.current = null
                    setFilePreview(null)
                  }}
                >
                  Remove photo
                </button>
              ) : null}
              {photoError ? <p className="field-error">{photoError}</p> : null}
            </div>
          </div>
          <div className="form-grid">
            <Field id="full-name" label="Full name" required error={errors.full_name}>
              <input
                id="full-name"
                value={draft.full_name}
                onChange={(event) => setDraft({ ...draft, full_name: event.target.value })}
                autoComplete="name"
                maxLength={120}
                aria-invalid={errors.full_name ? true : undefined}
                aria-describedby={errors.full_name ? 'full-name-error' : undefined}
              />
            </Field>
            <Field id="email" label="Email" required error={errors.email}>
              <input
                id="email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                autoComplete="email"
                maxLength={200}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </Field>
            <Field id="phone" label="Contact number" error={errors.contact_number}>
              <input
                id="phone"
                type="tel"
                value={draft.contact_number}
                onChange={(event) => setDraft({ ...draft, contact_number: event.target.value })}
                autoComplete="tel"
                maxLength={40}
                aria-invalid={errors.contact_number ? true : undefined}
                aria-describedby={errors.contact_number ? 'phone-error' : undefined}
              />
            </Field>
            <div className="span-2">
              <Field id="address" label="Address" error={errors.address}>
                <textarea
                  id="address"
                  rows={2}
                  value={draft.address}
                  onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                  autoComplete="street-address"
                  maxLength={300}
                  aria-invalid={errors.address ? true : undefined}
                  aria-describedby={errors.address ? 'address-error' : undefined}
                />
              </Field>
            </div>
            <div className="span-2">
              <Field id="about" label="About me" error={errors.about_me}>
                <textarea
                  id="about"
                  rows={5}
                  value={draft.about_me}
                  onChange={(event) => setDraft({ ...draft, about_me: event.target.value })}
                  maxLength={4000}
                  aria-invalid={errors.about_me ? true : undefined}
                  aria-describedby={errors.about_me ? 'about-error' : undefined}
                />
              </Field>
            </div>
          </div>
        </section>

        <Section
          title="Education"
          hint="School, degree, and years. Add one card per school."
          addLabel="Add education"
          atLimit={draft.education.length >= MAX_ROWS}
          onAdd={() => setDraft({ ...draft, education: [...draft.education, blankEducation()] })}
        >
          {draft.education.length === 0 ? <p className="hint">No education entries yet.</p> : null}
          {draft.education.map((row, index) => (
            <Entry
              key={row.key}
              title={`School ${index + 1}`}
              error={errors.education[index]}
              onRemove={() => setDraft({ ...draft, education: removeAt(draft.education, index) })}
            >
              <div className="form-grid">
                <Field id={`school-${row.key}`} label="School" required>
                  <input
                    id={`school-${row.key}`}
                    value={row.school}
                    maxLength={160}
                    onChange={(event) => updateEducation(index, { school: event.target.value })}
                  />
                </Field>
                <Field id={`degree-${row.key}`} label="Degree">
                  <input
                    id={`degree-${row.key}`}
                    value={row.degree}
                    maxLength={160}
                    onChange={(event) => updateEducation(index, { degree: event.target.value })}
                  />
                </Field>
                <Field id={`field-${row.key}`} label="Field of study">
                  <input
                    id={`field-${row.key}`}
                    value={row.field_of_study}
                    maxLength={160}
                    onChange={(event) =>
                      updateEducation(index, { field_of_study: event.target.value })
                    }
                  />
                </Field>
                <div className="year-pair">
                  <Field id={`start-year-${row.key}`} label="Start year">
                    <input
                      id={`start-year-${row.key}`}
                      inputMode="numeric"
                      value={row.start_year}
                      maxLength={4}
                      onChange={(event) => updateEducation(index, { start_year: event.target.value })}
                    />
                  </Field>
                  <Field id={`end-year-${row.key}`} label="End year">
                    <input
                      id={`end-year-${row.key}`}
                      inputMode="numeric"
                      value={row.end_year}
                      maxLength={4}
                      onChange={(event) => updateEducation(index, { end_year: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="span-2">
                  <Field id={`edu-desc-${row.key}`} label="Description">
                    <textarea
                      id={`edu-desc-${row.key}`}
                      rows={2}
                      value={row.description}
                      maxLength={2000}
                      onChange={(event) =>
                        updateEducation(index, { description: event.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            </Entry>
          ))}
        </Section>

        <Section
          title="Skills"
          hint="Level is optional. 1 is beginner and 5 is advanced."
          addLabel="Add skill"
          atLimit={draft.skills.length >= MAX_ROWS}
          onAdd={() => setDraft({ ...draft, skills: [...draft.skills, blankSkill()] })}
        >
          {draft.skills.length === 0 ? <p className="hint">No skills yet.</p> : null}
          {draft.skills.map((row, index) => (
            <Entry
              key={row.key}
              title={`Skill ${index + 1}`}
              error={errors.skills[index]}
              onRemove={() => setDraft({ ...draft, skills: removeAt(draft.skills, index) })}
            >
              <div className="form-grid">
                <Field id={`skill-${row.key}`} label="Skill" required>
                  <input
                    id={`skill-${row.key}`}
                    value={row.name}
                    maxLength={80}
                    onChange={(event) => updateSkill(index, { name: event.target.value })}
                  />
                </Field>
                <Field id={`level-${row.key}`} label="Level">
                  <select
                    id={`level-${row.key}`}
                    value={row.level}
                    onChange={(event) => updateSkill(index, { level: event.target.value })}
                  >
                    <option value="">Optional</option>
                    <option value="1">1 — Beginner</option>
                    <option value="2">2 — Familiar</option>
                    <option value="3">3 — Comfortable</option>
                    <option value="4">4 — Strong</option>
                    <option value="5">5 — Advanced</option>
                  </select>
                </Field>
              </div>
            </Entry>
          ))}
        </Section>

        <Section
          title="Projects"
          hint="A title is enough. Add a link and technologies if you have them."
          addLabel="Add project"
          atLimit={draft.projects.length >= MAX_ROWS}
          onAdd={() => setDraft({ ...draft, projects: [...draft.projects, blankProject()] })}
        >
          {draft.projects.length === 0 ? <p className="hint">No projects yet.</p> : null}
          {draft.projects.map((row, index) => (
            <Entry
              key={row.key}
              title={`Project ${index + 1}`}
              error={errors.projects[index]}
              onRemove={() => setDraft({ ...draft, projects: removeAt(draft.projects, index) })}
            >
              <div className="form-grid">
                <Field id={`title-${row.key}`} label="Title" required>
                  <input
                    id={`title-${row.key}`}
                    value={row.title}
                    maxLength={160}
                    onChange={(event) => updateProject(index, { title: event.target.value })}
                  />
                </Field>
                <Field id={`tech-${row.key}`} label="Technologies">
                  <input
                    id={`tech-${row.key}`}
                    value={row.technologies}
                    maxLength={300}
                    placeholder="HTML, CSS, JavaScript"
                    onChange={(event) => updateProject(index, { technologies: event.target.value })}
                  />
                </Field>
                <div className="span-2">
                  <Field id={`project-url-${row.key}`} label="Project link">
                    <input
                      id={`project-url-${row.key}`}
                      type="url"
                      value={row.project_url}
                      maxLength={300}
                      placeholder="https://"
                      onChange={(event) => updateProject(index, { project_url: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="span-2">
                  <Field id={`project-desc-${row.key}`} label="Description">
                    <textarea
                      id={`project-desc-${row.key}`}
                      rows={3}
                      value={row.description}
                      maxLength={2000}
                      onChange={(event) => updateProject(index, { description: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </Entry>
          ))}
        </Section>

        <Section
          title="Experience"
          hint="Jobs, internships, or volunteer work."
          addLabel="Add experience"
          atLimit={draft.work_experience.length >= MAX_ROWS}
          onAdd={() => setDraft({ ...draft, work_experience: [...draft.work_experience, blankWork()] })}
        >
          {draft.work_experience.length === 0 ? <p className="hint">No experience yet.</p> : null}
          {draft.work_experience.map((row, index) => (
            <Entry
              key={row.key}
              title={`Experience ${index + 1}`}
              error={errors.work_experience[index]}
              onRemove={() =>
                setDraft({ ...draft, work_experience: removeAt(draft.work_experience, index) })
              }
            >
              <div className="form-grid">
                <Field id={`company-${row.key}`} label="Company" required>
                  <input
                    id={`company-${row.key}`}
                    value={row.company}
                    maxLength={160}
                    onChange={(event) => updateWork(index, { company: event.target.value })}
                  />
                </Field>
                <Field id={`position-${row.key}`} label="Position" required>
                  <input
                    id={`position-${row.key}`}
                    value={row.position}
                    maxLength={160}
                    onChange={(event) => updateWork(index, { position: event.target.value })}
                  />
                </Field>
                <Field id={`start-${row.key}`} label="Start date">
                  <input
                    id={`start-${row.key}`}
                    type="date"
                    value={row.start_date}
                    onChange={(event) => updateWork(index, { start_date: event.target.value })}
                  />
                </Field>
                <Field id={`end-${row.key}`} label="End date">
                  <input
                    id={`end-${row.key}`}
                    type="date"
                    value={row.is_current ? '' : row.end_date}
                    disabled={row.is_current}
                    onChange={(event) => updateWork(index, { end_date: event.target.value })}
                  />
                </Field>
                <div className="span-2">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={row.is_current}
                      onChange={(event) =>
                        updateWork(index, {
                          is_current: event.target.checked,
                          end_date: event.target.checked ? '' : row.end_date,
                        })
                      }
                    />
                    I currently work here
                  </label>
                </div>
                <div className="span-2">
                  <Field id={`work-desc-${row.key}`} label="Description">
                    <textarea
                      id={`work-desc-${row.key}`}
                      rows={3}
                      value={row.description}
                      maxLength={2000}
                      onChange={(event) => updateWork(index, { description: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </Entry>
          ))}
        </Section>

        <Section
          title="Links"
          hint="Social media or a personal website. Include https://."
          addLabel="Add link"
          atLimit={draft.social_links.length >= MAX_ROWS}
          onAdd={() => setDraft({ ...draft, social_links: [...draft.social_links, blankLink()] })}
        >
          {draft.social_links.length === 0 ? <p className="hint">No links yet.</p> : null}
          {draft.social_links.map((row, index) => (
            <Entry
              key={row.key}
              title={`Link ${index + 1}`}
              error={errors.social_links[index]}
              onRemove={() => setDraft({ ...draft, social_links: removeAt(draft.social_links, index) })}
            >
              <div className="form-grid">
                <Field id={`platform-${row.key}`} label="Platform" required>
                  <input
                    id={`platform-${row.key}`}
                    list="platform-list"
                    value={row.platform}
                    maxLength={80}
                    onChange={(event) => updateLink(index, { platform: event.target.value })}
                  />
                </Field>
                <Field id={`url-${row.key}`} label="URL" required>
                  <input
                    id={`url-${row.key}`}
                    type="url"
                    value={row.url}
                    maxLength={300}
                    placeholder="https://"
                    onChange={(event) => updateLink(index, { url: event.target.value })}
                  />
                </Field>
              </div>
            </Entry>
          ))}
          <datalist id="platform-list">
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform} />
            ))}
          </datalist>
        </Section>

        <div className="save-bar">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save and choose a template'}
          </button>
          <p className="hint">Next you will pick one of the three templates.</p>
        </div>
      </form>
    </div>
  )

  function updateEducation(index: number, patch: Partial<EducationDraft>) {
    setDraft((current) => ({
      ...current,
      education: replaceAt(current.education, index, patch),
    }))
  }
  function updateSkill(index: number, patch: Partial<SkillDraft>) {
    setDraft((current) => ({ ...current, skills: replaceAt(current.skills, index, patch) }))
  }
  function updateProject(index: number, patch: Partial<ProjectDraft>) {
    setDraft((current) => ({ ...current, projects: replaceAt(current.projects, index, patch) }))
  }
  function updateWork(index: number, patch: Partial<WorkDraft>) {
    setDraft((current) => ({
      ...current,
      work_experience: replaceAt(current.work_experience, index, patch),
    }))
  }
  function updateLink(index: number, patch: Partial<LinkDraft>) {
    setDraft((current) => ({
      ...current,
      social_links: replaceAt(current.social_links, index, patch),
    }))
  }
}

function replaceAt<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
}

function removeAt<T>(rows: T[], index: number): T[] {
  return rows.filter((_, rowIndex) => rowIndex !== index)
}
