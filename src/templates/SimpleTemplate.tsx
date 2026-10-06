import type { Portfolio } from '../data/types.ts'
import { Portrait } from '../components/Portrait.tsx'
import {
  filled,
  formatDateRange,
  formatYearRange,
  linkHost,
  techList,
} from '../lib/format.ts'
import { LEVEL_LABELS } from '../lib/templates.ts'

export function SimpleTemplate({ portfolio }: { portfolio: Portfolio }) {
  const years = (start: number | null, end: number | null) => formatYearRange(start, end)
  return (
    <article className="folio folio-simple">
      <header className="simple-header">
        <Portrait name={portfolio.full_name} url={portfolio.profile_picture_url} className="simple-portrait" />
        <div>
          <h1>{portfolio.full_name}</h1>
          <p className="simple-contact">
            <a href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
            {filled(portfolio.contact_number) ? <span>{portfolio.contact_number}</span> : null}
            {filled(portfolio.address) ? <span>{portfolio.address}</span> : null}
          </p>
        </div>
      </header>

      {filled(portfolio.about_me) ? (
        <section className="simple-section">
          <h2>About</h2>
          <p className="pre">{portfolio.about_me}</p>
        </section>
      ) : null}

      {portfolio.education.length > 0 ? (
        <section className="simple-section">
          <h2>Education</h2>
          {portfolio.education.map((row) => (
            <article key={row.id} className="simple-item">
              <div className="simple-item-top">
                <h3>{row.school}</h3>
                <span>{years(row.start_year, row.end_year)}</span>
              </div>
              {filled(row.degree) || filled(row.field_of_study) ? (
                <p className="simple-meta">
                  {[row.degree, row.field_of_study].filter(filled).join(' · ')}
                </p>
              ) : null}
              {filled(row.description) ? <p className="pre">{row.description}</p> : null}
            </article>
          ))}
        </section>
      ) : null}

      {portfolio.skills.length > 0 ? (
        <section className="simple-section">
          <h2>Skills</h2>
          <ul className="simple-skills">
            {portfolio.skills.map((skill) => (
              <li key={skill.id}>
                {skill.name}
                {skill.level ? <span> · {LEVEL_LABELS[skill.level]}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {portfolio.projects.length > 0 ? (
        <section className="simple-section">
          <h2>Projects</h2>
          {portfolio.projects.map((project) => (
            <article key={project.id} className="simple-item">
              <h3>{project.title}</h3>
              {filled(project.description) ? <p className="pre">{project.description}</p> : null}
              {techList(project.technologies).length > 0 ? (
                <p className="simple-meta">{techList(project.technologies).join(', ')}</p>
              ) : null}
              {filled(project.project_url) ? (
                <a href={project.project_url} target="_blank" rel="noreferrer">
                  {linkHost(project.project_url)}
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {portfolio.work_experience.length > 0 ? (
        <section className="simple-section">
          <h2>Experience</h2>
          {portfolio.work_experience.map((job) => (
            <article key={job.id} className="simple-item">
              <div className="simple-item-top">
                <h3>
                  {job.position}
                  <span className="simple-at"> at {job.company}</span>
                </h3>
                <span>{formatDateRange(job.start_date, job.end_date, job.is_current)}</span>
              </div>
              {filled(job.description) ? <p className="pre">{job.description}</p> : null}
            </article>
          ))}
        </section>
      ) : null}

      {portfolio.social_links.length > 0 ? (
        <section className="simple-section">
          <h2>Links</h2>
          <ul className="simple-links">
            {portfolio.social_links.map((link) => (
              <li key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
