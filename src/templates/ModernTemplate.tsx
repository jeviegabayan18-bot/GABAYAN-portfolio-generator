import type { Portfolio } from '../data/types.ts'
import { Icon } from '../components/Icon.tsx'
import { Portrait } from '../components/Portrait.tsx'
import {
  filled,
  formatDateRange,
  formatYearRange,
  linkHost,
  techList,
} from '../lib/format.ts'
import { LEVEL_LABELS } from '../lib/templates.ts'

export function ModernTemplate({ portfolio }: { portfolio: Portfolio }) {
  return (
    <article className="folio folio-modern">
      <header className="modern-hero">
        <Portrait name={portfolio.full_name} url={portfolio.profile_picture_url} className="modern-portrait" />
        <div>
          <p className="modern-kicker">Portfolio</p>
          <h1>{portfolio.full_name}</h1>
          {filled(portfolio.about_me) ? <p className="modern-about pre">{portfolio.about_me}</p> : null}
          <ul className="modern-contact">
            <li>
              <Icon name="mail" />
              <a href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
            </li>
            {filled(portfolio.contact_number) ? (
              <li>
                <Icon name="phone" />
                <a href={`tel:${portfolio.contact_number}`}>{portfolio.contact_number}</a>
              </li>
            ) : null}
            {filled(portfolio.address) ? (
              <li>
                <Icon name="pin" />
                <span>{portfolio.address}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </header>

      <div className="modern-body">
        {portfolio.skills.length > 0 ? (
          <section className="modern-block">
            <h2>Skills</h2>
            <ul className="modern-skills">
              {portfolio.skills.map((skill) => (
                <li key={skill.id} className="modern-card">
                  <div className="modern-skill-top">
                    <strong>{skill.name}</strong>
                    {skill.level ? <span>{LEVEL_LABELS[skill.level]}</span> : null}
                  </div>
                  {skill.level ? (
                    <div className="skill-bar" aria-hidden="true">
                      <span style={{ width: `${skill.level * 20}%` }} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {portfolio.projects.length > 0 ? (
          <section className="modern-block">
            <h2>Projects</h2>
            <div className="modern-project-grid">
              {portfolio.projects.map((project) => (
                <article key={project.id} className="modern-card modern-project">
                  <h3>{project.title}</h3>
                  {filled(project.description) ? <p className="pre">{project.description}</p> : null}
                  {techList(project.technologies).length > 0 ? (
                    <ul className="chips">
                      {techList(project.technologies).map((tech) => (
                        <li key={tech}>{tech}</li>
                      ))}
                    </ul>
                  ) : null}
                  {filled(project.project_url) ? (
                    <a className="modern-link" href={project.project_url} target="_blank" rel="noreferrer">
                      <Icon name="link" />
                      {linkHost(project.project_url)}
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {portfolio.work_experience.length > 0 ? (
          <section className="modern-block">
            <h2>Experience</h2>
            <div className="modern-stack">
              {portfolio.work_experience.map((job) => (
                <article key={job.id} className="modern-card">
                  <div className="modern-split">
                    <h3>{job.position}</h3>
                    <span>{formatDateRange(job.start_date, job.end_date, job.is_current)}</span>
                  </div>
                  <p className="modern-company">{job.company}</p>
                  {filled(job.description) ? <p className="pre">{job.description}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {portfolio.education.length > 0 ? (
          <section className="modern-block">
            <h2>Education</h2>
            <div className="modern-stack">
              {portfolio.education.map((row) => (
                <article key={row.id} className="modern-card">
                  <div className="modern-split">
                    <h3>{row.school}</h3>
                    <span>{formatYearRange(row.start_year, row.end_year)}</span>
                  </div>
                  {filled(row.degree) || filled(row.field_of_study) ? (
                    <p className="modern-company">
                      {[row.degree, row.field_of_study].filter(filled).join(' · ')}
                    </p>
                  ) : null}
                  {filled(row.description) ? <p className="pre">{row.description}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {portfolio.social_links.length > 0 ? (
          <section className="modern-block">
            <h2>Links</h2>
            <ul className="chips modern-links">
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
      </div>
    </article>
  )
}
