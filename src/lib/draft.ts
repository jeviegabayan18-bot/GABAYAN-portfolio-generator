import type { Portfolio } from '../data/types.ts'

export interface EducationDraft {
  key: string
  school: string
  degree: string
  field_of_study: string
  start_year: string
  end_year: string
  description: string
}

export interface SkillDraft {
  key: string
  name: string
  level: string
}

export interface ProjectDraft {
  key: string
  title: string
  description: string
  project_url: string
  technologies: string
}

export interface WorkDraft {
  key: string
  company: string
  position: string
  start_date: string
  end_date: string
  is_current: boolean
  description: string
}

export interface LinkDraft {
  key: string
  platform: string
  url: string
}

export interface Draft {
  full_name: string
  email: string
  contact_number: string
  address: string
  about_me: string
  education: EducationDraft[]
  skills: SkillDraft[]
  projects: ProjectDraft[]
  work_experience: WorkDraft[]
  social_links: LinkDraft[]
}

function key(): string {
  return crypto.randomUUID()
}

export function blankEducation(): EducationDraft {
  return {
    key: key(),
    school: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: '',
    description: '',
  }
}

export function blankSkill(): SkillDraft {
  return { key: key(), name: '', level: '' }
}

export function blankProject(): ProjectDraft {
  return { key: key(), title: '', description: '', project_url: '', technologies: '' }
}

export function blankWork(): WorkDraft {
  return {
    key: key(),
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  }
}

export function blankLink(): LinkDraft {
  return { key: key(), platform: '', url: '' }
}

export function blankDraft(): Draft {
  return {
    full_name: '',
    email: '',
    contact_number: '',
    address: '',
    about_me: '',
    education: [blankEducation()],
    skills: [blankSkill()],
    projects: [blankProject()],
    work_experience: [blankWork()],
    social_links: [blankLink()],
  }
}

export function draftFromPortfolio(portfolio: Portfolio): Draft {
  return {
    full_name: portfolio.full_name,
    email: portfolio.email,
    contact_number: portfolio.contact_number ?? '',
    address: portfolio.address ?? '',
    about_me: portfolio.about_me ?? '',
    education:
      portfolio.education.length > 0
        ? portfolio.education.map((row) => ({
            key: row.id,
            school: row.school,
            degree: row.degree ?? '',
            field_of_study: row.field_of_study ?? '',
            start_year: row.start_year === null ? '' : String(row.start_year),
            end_year: row.end_year === null ? '' : String(row.end_year),
            description: row.description ?? '',
          }))
        : [blankEducation()],
    skills:
      portfolio.skills.length > 0
        ? portfolio.skills.map((row) => ({
            key: row.id,
            name: row.name,
            level: row.level === null ? '' : String(row.level),
          }))
        : [blankSkill()],
    projects:
      portfolio.projects.length > 0
        ? portfolio.projects.map((row) => ({
            key: row.id,
            title: row.title,
            description: row.description ?? '',
            project_url: row.project_url ?? '',
            technologies: row.technologies ?? '',
          }))
        : [blankProject()],
    work_experience:
      portfolio.work_experience.length > 0
        ? portfolio.work_experience.map((row) => ({
            key: row.id,
            company: row.company,
            position: row.position,
            start_date: row.start_date ?? '',
            end_date: row.end_date ?? '',
            is_current: row.is_current,
            description: row.description ?? '',
          }))
        : [blankWork()],
    social_links:
      portfolio.social_links.length > 0
        ? portfolio.social_links.map((row) => ({
            key: row.id,
            platform: row.platform,
            url: row.url,
          }))
        : [blankLink()],
  }
}

export const MAX_ROWS = 12

export const PLATFORMS = [
  'GitHub',
  'LinkedIn',
  'Website',
  'Twitter / X',
  'Instagram',
  'Facebook',
  'Other',
]
