import { compressImage, validateImageFile } from '../lib/images.ts'
import type {
  DataLayer,
  Education,
  EducationInput,
  Portfolio,
  PortfolioSummary,
  PortfolioUpdate,
  PortfolioWrite,
  ProfilePicture,
  Project,
  ProjectInput,
  Skill,
  SkillInput,
  SocialLink,
  SocialLinkInput,
  WorkExperience,
  WorkExperienceInput,
} from './types.ts'

const STORAGE_KEY = 'portfolio-generator.v1'

interface Store {
  portfolios: Portfolio[]
}

function emptyStore(): Store {
  return { portfolios: [] }
}

function readStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyStore()
  try {
    const parsed = JSON.parse(raw) as Store
    if (!parsed || !Array.isArray(parsed.portfolios)) return emptyStore()
    return { portfolios: parsed.portfolios.map(normalize) }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    throw new Error(
      'This browser is out of space for demo data. Delete a portfolio or connect the online database.',
    )
  }
}

function normalize(portfolio: Portfolio): Portfolio {
  return {
    ...portfolio,
    education: Array.isArray(portfolio.education) ? portfolio.education : [],
    skills: Array.isArray(portfolio.skills) ? portfolio.skills : [],
    projects: Array.isArray(portfolio.projects) ? portfolio.projects : [],
    work_experience: Array.isArray(portfolio.work_experience) ? portfolio.work_experience : [],
    social_links: Array.isArray(portfolio.social_links) ? portfolio.social_links : [],
  }
}

function summary(portfolio: Portfolio): PortfolioSummary {
  return {
    id: portfolio.id,
    full_name: portfolio.full_name,
    email: portfolio.email,
    profile_picture_url: portfolio.profile_picture_url,
    template_id: portfolio.template_id,
    updated_at: portfolio.updated_at,
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function mapEducation(portfolioId: string, rows: EducationInput[]): Education[] {
  const created_at = nowIso()
  return rows.map((row, index) => ({
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    sort_order: index,
    school: row.school,
    degree: row.degree,
    field_of_study: row.field_of_study,
    start_year: row.start_year,
    end_year: row.end_year,
    description: row.description,
    created_at,
  }))
}

function mapSkills(portfolioId: string, rows: SkillInput[]): Skill[] {
  const created_at = nowIso()
  return rows.map((row, index) => ({
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    sort_order: index,
    name: row.name,
    level: row.level,
    created_at,
  }))
}

function mapProjects(portfolioId: string, rows: ProjectInput[]): Project[] {
  const created_at = nowIso()
  return rows.map((row, index) => ({
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    sort_order: index,
    title: row.title,
    description: row.description,
    project_url: row.project_url,
    technologies: row.technologies,
    created_at,
  }))
}

function mapWork(portfolioId: string, rows: WorkExperienceInput[]): WorkExperience[] {
  const created_at = nowIso()
  return rows.map((row, index) => ({
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    sort_order: index,
    company: row.company,
    position: row.position,
    start_date: row.start_date,
    end_date: row.end_date,
    is_current: row.is_current,
    description: row.description,
    created_at,
  }))
}

function mapLinks(portfolioId: string, rows: SocialLinkInput[]): SocialLink[] {
  const created_at = nowIso()
  return rows.map((row, index) => ({
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    sort_order: index,
    platform: row.platform,
    url: row.url,
    created_at,
  }))
}

function applyUpdate(current: Portfolio, input: PortfolioUpdate): Portfolio {
  const next: Portfolio = { ...current, updated_at: nowIso() }
  if (input.full_name !== undefined) next.full_name = input.full_name
  if (input.email !== undefined) next.email = input.email
  if ('contact_number' in input) next.contact_number = input.contact_number ?? null
  if ('address' in input) next.address = input.address ?? null
  if ('about_me' in input) next.about_me = input.about_me ?? null
  if ('profile_picture_url' in input) next.profile_picture_url = input.profile_picture_url ?? null
  if ('profile_picture_path' in input) next.profile_picture_path = input.profile_picture_path ?? null
  if ('template_id' in input) next.template_id = input.template_id ?? null
  if (input.education) next.education = mapEducation(current.id, input.education)
  if (input.skills) next.skills = mapSkills(current.id, input.skills)
  if (input.projects) next.projects = mapProjects(current.id, input.projects)
  if (input.work_experience) next.work_experience = mapWork(current.id, input.work_experience)
  if (input.social_links) next.social_links = mapLinks(current.id, input.social_links)
  return next
}

export function createLocalDataLayer(): DataLayer {
  return {
    mode: 'local',

    async createPortfolio(input: PortfolioWrite): Promise<Portfolio> {
      const id = crypto.randomUUID()
      const timestamp = nowIso()
      const portfolio: Portfolio = {
        id,
        full_name: input.full_name,
        email: input.email,
        contact_number: input.contact_number,
        address: input.address,
        about_me: input.about_me,
        profile_picture_url: input.profile_picture_url,
        profile_picture_path: input.profile_picture_path,
        template_id: input.template_id,
        created_at: timestamp,
        updated_at: timestamp,
        education: mapEducation(id, input.education),
        skills: mapSkills(id, input.skills),
        projects: mapProjects(id, input.projects),
        work_experience: mapWork(id, input.work_experience),
        social_links: mapLinks(id, input.social_links),
      }
      const store = readStore()
      store.portfolios.unshift(portfolio)
      writeStore(store)
      return portfolio
    },

    async listPortfolios(): Promise<PortfolioSummary[]> {
      return readStore()
        .portfolios
        .slice()
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        .map(summary)
    },

    async getPortfolio(id: string): Promise<Portfolio | null> {
      return readStore().portfolios.find((portfolio) => portfolio.id === id) ?? null
    },

    async updatePortfolio(id: string, input: PortfolioUpdate): Promise<Portfolio> {
      const store = readStore()
      const index = store.portfolios.findIndex((portfolio) => portfolio.id === id)
      const current = store.portfolios[index]
      if (!current) throw new Error('Portfolio not found.')
      const next = applyUpdate(current, input)
      store.portfolios[index] = next
      writeStore(store)
      return next
    },

    async deletePortfolio(id: string): Promise<void> {
      const store = readStore()
      store.portfolios = store.portfolios.filter((portfolio) => portfolio.id !== id)
      writeStore(store)
    },

    async uploadProfilePicture(portfolioId: string, file: File): Promise<ProfilePicture> {
      const problem = validateImageFile(file)
      if (problem) throw new Error(problem)
      const url = await compressImage(file)
      return {
        url,
        path: `local/${portfolioId}/${crypto.randomUUID()}.jpg`,
      }
    },

    async deleteProfilePicture(): Promise<void> {
      // Demo mode keeps the photo on the portfolio row as a data URL.
      // Clearing profile_picture_url, or deleting the portfolio, removes it.
    },
  }
}
