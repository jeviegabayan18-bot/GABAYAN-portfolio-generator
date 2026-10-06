import type {
  EducationInput,
  PortfolioWrite,
  ProjectInput,
  SkillInput,
  SocialLinkInput,
  WorkExperienceInput,
} from '../data/types.ts'
import type {
  Draft,
  EducationDraft,
  LinkDraft,
  ProjectDraft,
  SkillDraft,
  WorkDraft,
} from './draft.ts'

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export interface FormErrors {
  full_name?: string
  email?: string
  contact_number?: string
  address?: string
  about_me?: string
  education: Record<number, string>
  skills: Record<number, string>
  projects: Record<number, string>
  work_experience: Record<number, string>
  social_links: Record<number, string>
}

export function emptyErrors(): FormErrors {
  return {
    education: {},
    skills: {},
    projects: {},
    work_experience: {},
    social_links: {},
  }
}

export function hasErrors(errors: FormErrors): boolean {
  return Boolean(
    errors.full_name ||
      errors.email ||
      errors.contact_number ||
      errors.address ||
      errors.about_me ||
      Object.keys(errors.education).length ||
      Object.keys(errors.skills).length ||
      Object.keys(errors.projects).length ||
      Object.keys(errors.work_experience).length ||
      Object.keys(errors.social_links).length,
  )
}

export function validateDraft(
  draft: Draft,
  templateId: number | null,
  picture: { url: string | null; path: string | null },
): { errors: FormErrors; value: PortfolioWrite | null } {
  const errors = emptyErrors()

  const fullName = draft.full_name.trim()
  if (!fullName) errors.full_name = 'Full name is required.'
  else if (fullName.length > 120) errors.full_name = 'Full name must be 120 characters or fewer.'

  const email = draft.email.trim()
  if (!email) errors.email = 'Email is required.'
  else if (email.length > 200 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter an email address like name@school.edu.'
  }

  const contact = clean(draft.contact_number)
  if (contact && (contact.length < 3 || contact.length > 40)) {
    errors.contact_number = 'Contact number must be between 3 and 40 characters.'
  }

  const address = clean(draft.address)
  if (address && address.length > 300) errors.address = 'Address must be 300 characters or fewer.'

  const about = clean(draft.about_me)
  if (about && about.length > 4000) errors.about_me = 'About me must be 4000 characters or fewer.'

  const education = collectEducation(draft.education, errors)
  const skills = collectSkills(draft.skills, errors)
  const projects = collectProjects(draft.projects, errors)
  const work = collectWork(draft.work_experience, errors)
  const links = collectLinks(draft.social_links, errors)

  if (hasErrors(errors)) return { errors, value: null }

  return {
    errors,
    value: {
      full_name: fullName,
      email,
      contact_number: contact,
      address,
      about_me: about,
      profile_picture_url: picture.url,
      profile_picture_path: picture.path,
      template_id: templateId,
      education,
      skills,
      projects,
      work_experience: work,
      social_links: links,
    },
  }
}

function collectEducation(rows: EducationDraft[], errors: FormErrors): EducationInput[] {
  const kept: EducationInput[] = []
  rows.forEach((row, index) => {
    if (isBlank([row.school, row.degree, row.field_of_study, row.start_year, row.end_year, row.description])) {
      return
    }
    const messages: string[] = []
    const school = row.school.trim()
    if (!school) messages.push('School is required.')
    else if (school.length > 160) messages.push('School must be 160 characters or fewer.')
    const degree = lengthCheck(row.degree, 160, 'Degree')
    const field = lengthCheck(row.field_of_study, 160, 'Field of study')
    const description = lengthCheck(row.description, 2000, 'Description')
    const start = parseYear(row.start_year, 'Start year')
    const end = parseYear(row.end_year, 'End year')
    if (degree.error) messages.push(degree.error)
    if (field.error) messages.push(field.error)
    if (description.error) messages.push(description.error)
    if (start.error) messages.push(start.error)
    if (end.error) messages.push(end.error)
    if (start.year && end.year && end.year < start.year) {
      messages.push('End year cannot be earlier than the start year.')
    }
    if (messages.length) {
      errors.education[index] = messages.join(' ')
      return
    }
    kept.push({
      school,
      degree: degree.value,
      field_of_study: field.value,
      start_year: start.year,
      end_year: end.year,
      description: description.value,
    })
  })
  return kept
}

function collectSkills(rows: SkillDraft[], errors: FormErrors): SkillInput[] {
  const kept: SkillInput[] = []
  rows.forEach((row, index) => {
    if (isBlank([row.name, row.level])) return
    const messages: string[] = []
    const name = row.name.trim()
    if (!name) messages.push('Skill name is required.')
    else if (name.length > 80) messages.push('Skill name must be 80 characters or fewer.')
    let level: number | null = null
    if (row.level.trim()) {
      level = Number(row.level)
      if (!Number.isInteger(level) || level < 1 || level > 5) {
        messages.push('Level must be from 1 to 5.')
      }
    }
    if (messages.length) {
      errors.skills[index] = messages.join(' ')
      return
    }
    kept.push({ name, level })
  })
  return kept
}

function collectProjects(rows: ProjectDraft[], errors: FormErrors): ProjectInput[] {
  const kept: ProjectInput[] = []
  rows.forEach((row, index) => {
    if (isBlank([row.title, row.description, row.project_url, row.technologies])) return
    const messages: string[] = []
    const title = row.title.trim()
    if (!title) messages.push('Project title is required.')
    else if (title.length > 160) messages.push('Title must be 160 characters or fewer.')
    const description = lengthCheck(row.description, 2000, 'Description')
    const technologies = lengthCheck(row.technologies, 300, 'Technologies')
    const url = parseUrl(row.project_url, true)
    if (description.error) messages.push(description.error)
    if (technologies.error) messages.push(technologies.error)
    if (url.error) messages.push(url.error)
    if (messages.length) {
      errors.projects[index] = messages.join(' ')
      return
    }
    kept.push({
      title,
      description: description.value,
      project_url: url.url,
      technologies: technologies.value,
    })
  })
  return kept
}

function collectWork(rows: WorkDraft[], errors: FormErrors): WorkExperienceInput[] {
  const kept: WorkExperienceInput[] = []
  rows.forEach((row, index) => {
    const empty = isBlank([row.company, row.position, row.start_date, row.end_date, row.description]) && !row.is_current
    if (empty) return
    const messages: string[] = []
    const company = row.company.trim()
    const position = row.position.trim()
    if (!company) messages.push('Company is required.')
    else if (company.length > 160) messages.push('Company must be 160 characters or fewer.')
    if (!position) messages.push('Position is required.')
    else if (position.length > 160) messages.push('Position must be 160 characters or fewer.')
    const description = lengthCheck(row.description, 2000, 'Description')
    const start = parseDate(row.start_date, 'Start date')
    const end = row.is_current ? { value: null as string | null, error: undefined } : parseDate(row.end_date, 'End date')
    if (description.error) messages.push(description.error)
    if (start.error) messages.push(start.error)
    if (end.error) messages.push(end.error)
    if (start.value && end.value && end.value < start.value) {
      messages.push('End date cannot be earlier than the start date.')
    }
    if (messages.length) {
      errors.work_experience[index] = messages.join(' ')
      return
    }
    kept.push({
      company,
      position,
      start_date: start.value,
      end_date: row.is_current ? null : end.value,
      is_current: row.is_current,
      description: description.value,
    })
  })
  return kept
}

function collectLinks(rows: LinkDraft[], errors: FormErrors): SocialLinkInput[] {
  const kept: SocialLinkInput[] = []
  rows.forEach((row, index) => {
    if (isBlank([row.platform, row.url])) return
    const messages: string[] = []
    const platform = row.platform.trim()
    if (!platform) messages.push('Platform is required.')
    else if (platform.length > 80) messages.push('Platform must be 80 characters or fewer.')
    const url = parseUrl(row.url, false)
    if (url.error) messages.push(url.error)
    if (!url.url && !url.error) messages.push('URL is required.')
    if (messages.length) {
      errors.social_links[index] = messages.join(' ')
      return
    }
    kept.push({ platform, url: url.url ?? '' })
  })
  return kept
}

function isBlank(values: string[]): boolean {
  return values.every((value) => value.trim() === '')
}

function clean(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function lengthCheck(
  value: string,
  max: number,
  label: string,
): { value: string | null; error?: string } {
  const trimmed = value.trim()
  if (!trimmed) return { value: null }
  if (trimmed.length > max) return { value: null, error: `${label} must be ${max} characters or fewer.` }
  return { value: trimmed }
}

function parseYear(value: string, label: string): { year: number | null; error?: string } {
  const trimmed = value.trim()
  if (!trimmed) return { year: null }
  if (!/^\d{4}$/.test(trimmed)) return { year: null, error: `${label} must be a 4-digit year.` }
  const year = Number(trimmed)
  if (year < 1950 || year > 2100) return { year: null, error: `${label} must be between 1950 and 2100.` }
  return { year }
}

function parseDate(value: string, label: string): { value: string | null; error?: string } {
  const trimmed = value.trim()
  if (!trimmed) return { value: null }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { value: null, error: `${label} is not a valid date.` }
  return { value: trimmed }
}

function parseUrl(value: string, optional: boolean): { url: string | null; error?: string } {
  const trimmed = value.trim()
  if (!trimmed) return { url: null, error: optional ? undefined : undefined }
  if (trimmed.length > 300) return { url: null, error: 'That link must be 300 characters or fewer.' }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { url: null, error: 'Enter a full link starting with http:// or https://.' }
    }
  } catch {
    return { url: null, error: 'Enter a full link starting with http:// or https://.' }
  }
  return { url: trimmed }
}
