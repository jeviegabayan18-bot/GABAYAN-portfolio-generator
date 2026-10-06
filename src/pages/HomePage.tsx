import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/title.ts'

const STEPS = [
  { number: '1', title: 'Enter information', text: 'Name, photo, school, skills, projects, and links.' },
  { number: '2', title: 'Save', text: 'The details are stored so they are still there after a refresh.' },
  { number: '3', title: 'Choose a template', text: 'Pick Simple, Modern, or Creative.' },
  { number: '4', title: 'Preview', text: 'View the page, switch templates, edit, or delete.' },
]

export function HomePage() {
  usePageTitle('Portfolio Generator')
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">School project</p>
        <h1>Portfolio Generator</h1>
        <p className="lede">
          Enter your information, save it, and generate a personal portfolio from one of three
          templates. You can come back later to edit or delete it.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary btn-lg" to="/create">
            Create Portfolio
          </Link>
          <Link className="btn btn-secondary btn-lg" to="/manage">
            Manage portfolios
          </Link>
        </div>
      </section>
      <ol className="steps">
        {STEPS.map((step) => (
          <li key={step.number}>
            <span>{step.number}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
