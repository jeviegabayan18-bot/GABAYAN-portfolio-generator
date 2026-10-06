import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { imageExtension, validateImageFile } from '../lib/images.ts'
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

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const PROFILE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET?.trim() || 'profile-pictures'

export function isSupabaseConfigured(): boolean {
  if (!url || !anonKey) return false
  if (/your-project/i.test(url) || /your-anon|your-key|placeholder/i.test(anonKey)) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

interface JoinedPortfolio {
  id: string
  full_name: string
  email: string
  contact_number: string | null
  address: string | null
  about_me: string | null
  profile_picture_url: string | null
  profile_picture_path: string | null
  template_id: number | null
  created_at: string
  updated_at: string
  education: Education[] | Education | null
  skills: Skill[] | Skill | null
  projects: Project[] | Project | null
  work_experience: WorkExperience[] | WorkExperience | null
  social_links: SocialLink[] | SocialLink | null
}

const PORTFOLIO_COLUMNS = `
  id, full_name, email, contact_number, address, about_me,
  profile_picture_url, profile_picture_path, template_id, created_at, updated_at,
  education ( id, portfolio_id, sort_order, school, degree, field_of_study, start_year, end_year, description, created_at ),
  skills ( id, portfolio_id, sort_order, name, level, created_at ),
  projects ( id, portfolio_id, sort_order, title, description, project_url, technologies, created_at ),
  work_experience ( id, portfolio_id, sort_order, company, position, start_date, end_date, is_current, description, created_at ),
  social_links ( id, portfolio_id, sort_order, platform, url, created_at )
`

function databaseError(error: { message: string }): Error {
  return new Error(error.message)
}

function isBadId(error: { code?: string }): boolean {
  return error.code === '22P02'
}

function asArray<T>(value: T[] | T | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function byOrder<T extends { sort_order: number }>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => a.sort_order - b.sort_order)
}

function toPortfolio(row: JoinedPortfolio): Portfolio {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    contact_number: row.contact_number,
    address: row.address,
    about_me: row.about_me,
    profile_picture_url: row.profile_picture_url,
    profile_picture_path: row.profile_picture_path,
    template_id: row.template_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    education: byOrder(asArray(row.education)),
    skills: byOrder(asArray(row.skills)),
    projects: byOrder(asArray(row.projects)),
    work_experience: byOrder(asArray(row.work_experience)),
    social_links: byOrder(asArray(row.social_links)),
  }
}

function educationRows(portfolioId: string, rows: EducationInput[]) {
  return rows.map((row, index) => ({
    portfolio_id: portfolioId,
    sort_order: index,
    school: row.school,
    degree: row.degree,
    field_of_study: row.field_of_study,
    start_year: row.start_year,
    end_year: row.end_year,
    description: row.description,
  }))
}

function skillRows(portfolioId: string, rows: SkillInput[]) {
  return rows.map((row, index) => ({
    portfolio_id: portfolioId,
    sort_order: index,
    name: row.name,
    level: row.level,
  }))
}

function projectRows(portfolioId: string, rows: ProjectInput[]) {
  return rows.map((row, index) => ({
    portfolio_id: portfolioId,
    sort_order: index,
    title: row.title,
    description: row.description,
    project_url: row.project_url,
    technologies: row.technologies,
  }))
}

function workRows(portfolioId: string, rows: WorkExperienceInput[]) {
  return rows.map((row, index) => ({
    portfolio_id: portfolioId,
    sort_order: index,
    company: row.company,
    position: row.position,
    start_date: row.start_date,
    end_date: row.end_date,
    is_current: row.is_current,
    description: row.description,
  }))
}

function linkRows(portfolioId: string, rows: SocialLinkInput[]) {
  return rows.map((row, index) => ({
    portfolio_id: portfolioId,
    sort_order: index,
    platform: row.platform,
    url: row.url,
  }))
}

export function createSupabaseDataLayer(): DataLayer {
  const supabase: SupabaseClient = createClient(url, anonKey)
  const bucket = PROFILE_BUCKET

  async function readPortfolio(id: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from('portfolios')
      .select(PORTFOLIO_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      if (isBadId(error)) return null
      throw databaseError(error)
    }
    if (!data) return null
    return toPortfolio(data as unknown as JoinedPortfolio)
  }

  async function replaceTable(
    table: 'education' | 'skills' | 'projects' | 'work_experience' | 'social_links',
    portfolioId: string,
    rows: Record<string, unknown>[],
  ): Promise<void> {
    const deleted = await supabase.from(table).delete().eq('portfolio_id', portfolioId)
    if (deleted.error) throw databaseError(deleted.error)
    if (rows.length === 0) return
    const inserted = await supabase.from(table).insert(rows)
    if (inserted.error) throw databaseError(inserted.error)
  }

  async function replaceChildren(portfolioId: string, input: PortfolioUpdate): Promise<void> {
    if (input.education) {
      await replaceTable('education', portfolioId, educationRows(portfolioId, input.education))
    }
    if (input.skills) {
      await replaceTable('skills', portfolioId, skillRows(portfolioId, input.skills))
    }
    if (input.projects) {
      await replaceTable('projects', portfolioId, projectRows(portfolioId, input.projects))
    }
    if (input.work_experience) {
      await replaceTable('work_experience', portfolioId, workRows(portfolioId, input.work_experience))
    }
    if (input.social_links) {
      await replaceTable('social_links', portfolioId, linkRows(portfolioId, input.social_links))
    }
  }

  function headerPatch(input: PortfolioUpdate, forceTouch: boolean): Record<string, unknown> {
    const patch: Record<string, unknown> = {}
    const keys = [
      'full_name',
      'email',
      'contact_number',
      'address',
      'about_me',
      'profile_picture_url',
      'profile_picture_path',
      'template_id',
    ] as const
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        patch[key] = input[key] ?? null
      }
    }
    if (forceTouch && Object.keys(patch).length === 0) {
      patch.updated_at = new Date().toISOString()
    }
    return patch
  }

  async function removePicture(path: string): Promise<void> {
    if (!path || path.startsWith('local/')) return
    const removed = await supabase.storage.from(bucket).remove([path])
    if (removed.error) throw databaseError(removed.error)
  }

  return {
    mode: 'supabase',

    async createPortfolio(input: PortfolioWrite): Promise<Portfolio> {
      const inserted = await supabase
        .from('portfolios')
        .insert({
          full_name: input.full_name,
          email: input.email,
          contact_number: input.contact_number,
          address: input.address,
          about_me: input.about_me,
          profile_picture_url: input.profile_picture_url,
          profile_picture_path: input.profile_picture_path,
          template_id: input.template_id,
        })
        .select('id')
        .single()
      if (inserted.error) throw databaseError(inserted.error)
      const id = String((inserted.data as { id: string }).id)
      await replaceChildren(id, input)
      const portfolio = await readPortfolio(id)
      if (!portfolio) throw new Error('Saved portfolio could not be read back.')
      return portfolio
    },

    async listPortfolios(): Promise<PortfolioSummary[]> {
      const { data, error } = await supabase
        .from('portfolios')
        .select('id, full_name, email, profile_picture_url, template_id, updated_at')
        .order('updated_at', { ascending: false })
      if (error) throw databaseError(error)
      return ((data ?? []) as PortfolioSummary[]).map((row) => ({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        profile_picture_url: row.profile_picture_url,
        template_id: row.template_id,
        updated_at: row.updated_at,
      }))
    },

    async getPortfolio(id: string): Promise<Portfolio | null> {
      return readPortfolio(id)
    },

    async updatePortfolio(id: string, input: PortfolioUpdate): Promise<Portfolio> {
      const patch = headerPatch(input, true)
      const updated = await supabase.from('portfolios').update(patch).eq('id', id).select('id').maybeSingle()
      if (updated.error) {
        if (isBadId(updated.error)) throw new Error('Portfolio not found.')
        throw databaseError(updated.error)
      }
      if (!updated.data) throw new Error('Portfolio not found.')
      await replaceChildren(id, input)
      const portfolio = await readPortfolio(id)
      if (!portfolio) throw new Error('Portfolio not found.')
      return portfolio
    },

    async deletePortfolio(id: string): Promise<void> {
      const existing = await readPortfolio(id)
      if (!existing) return
      if (existing.profile_picture_path) {
        await removePicture(existing.profile_picture_path)
      }
      const { error } = await supabase.from('portfolios').delete().eq('id', id)
      if (error) throw databaseError(error)
    },

    async uploadProfilePicture(portfolioId: string, file: File): Promise<ProfilePicture> {
      const problem = validateImageFile(file)
      if (problem) throw new Error(problem)
      const path = `${portfolioId}/${crypto.randomUUID()}.${imageExtension(file)}`
      const uploaded = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })
      if (uploaded.error) throw databaseError(uploaded.error)
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return { url: data.publicUrl, path }
    },

    async deleteProfilePicture(path: string): Promise<void> {
      await removePicture(path)
    },
  }
}
