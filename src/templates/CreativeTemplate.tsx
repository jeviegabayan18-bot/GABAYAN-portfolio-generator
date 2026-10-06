import type { Portfolio } from '../data/types.ts'
import { Portrait } from '../components/Portrait.tsx'
import {
  filled,
  formatDateRange,
  formatYearRange,
  techList,
} from '../lib/format.ts'
import { LEVEL_LABELS } from '../lib/templates.ts'

export function CreativeTemplate({ portfolio }: { portfolio: Portfolio }) {
  return (
    <article className="folio folio-creative">
      <aside className="creative-aside">
        <Portrait
          name={portfolio.full_name}
          url={portfolio.profile_picture_url}
          className="creative-portrait"
        />
        <h1>{portfolio.full_name}</h1>
        <ul className="creative-contact">
          <li>
            <a href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
          </li>
          {filled(portfolio.contact_number) ? <li>{portfolio.contact_number}</li> : null}
          {filled(portfolio.address) ? <li>{portfolio.address}</li> : null}
        </ul>

        {portfolio.skills.length > 0 ? (
          <div className="creative-skills">
            <h2>Skills</h2>
            <ul>
              {portfolio.skills.map((skill) => (
                <li key={skill.id}>
                  <div className="creative-skill-label">
                    <span>{skill.name}</span>
                    {skill.level ? <span>{LEVEL_LABELS[skill.level]}</span> : null}
                  </div>
                  {skill.level ? (
                    <div className="creative-meter" aria-hidden="true">
                      <span style={{ width: `${skill.level * 20}%` }} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {portfolio.social_links.length > 0 ? (
          <div className="creative-links">
            <h2>Links</h2>
            <ul>
              {portfolio.social_links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      <div className="creative-main">
        {filled(portfolio.about_me) ? (
          <blockquote className="creative-about pre">{portfolio.about_me}</blockquote>
        ) : null}

        {portfolio.work_experience.length > 0 ? (
          <section>
            <h2>Experience</h2>
            <div className="timeline">
              {portfolio.work_experience.map((job) => (
                <article key={job.id}>
                  <p className="creative-when">
                    {formatDateRange(job.start_date, job.end_date, job.is_current)}
                  </p>
                  <h3>{job.position}</h3>
                  <p className="creative-where">{job.company}</p>
                  {filled(job.description) ? <p className="pre">{job.description}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {portfolio.projects.length > 0 ? (
          <section>
            <h2>Projects</h2>
            <div className="creative-projects">
              {portfolio.projects.map((project) => (
                <article key={project.id} className="creative-project">
                  <h3>{project.title}</h3>
                  {filled(project.description) ? <p className="pre">{project.description}</p> : null}
                  {techList(project.technologies).length > 0 ? (
                    <p className="creative-tech">{techList(project.technologies).join(' · ')}</p>
                  ) : null}
                  {filled(project.project_url) ? (
                    <a href={project.project_url} target="_blank" rel="noreferrer">
                      View project
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {portfolio.education.length > 0 ? (
          <section>
            <h2>Education</h2>
            <div className="creative-schools">
              {portfolio.education.map((row) => (
                <article key={row.id}>
                  <p className="creative-year">{formatYearRange(row.start_year, row.end_year)}</p>
                  <h3>{row.school}</h3>
                  {filled(row.degree) || filled(row.field_of_study) ? (
                    <p>{[row.degree, row.field_of_study].filter(filled).join(' · ')}</p>
                  ) : null}
                  {filled(row.description) ? <p className="pre">{row.description}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
