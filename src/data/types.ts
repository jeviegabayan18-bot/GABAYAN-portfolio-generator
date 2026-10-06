export type TemplateSlug = 'simple' | 'modern' | 'creative'

export type DataMode = 'supabase' | 'local'

export interface Education {
  id: string
  portfolio_id: string
  sort_order: number
  school: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
  description: string | null
  created_at: string
}

export interface Skill {
  id: string
  portfolio_id: string
  sort_order: number
  name: string
  level: number | null
  created_at: string
}

export interface Project {
  id: string
  portfolio_id: string
  sort_order: number
  title: string
  description: string | null
  project_url: string | null
  technologies: string | null
  created_at: string
}

export interface WorkExperience {
  id: string
  portfolio_id: string
  sort_order: number
  company: string
  position: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
  created_at: string
}

export interface SocialLink {
  id: string
  portfolio_id: string
  sort_order: number
  platform: string
  url: string
  created_at: string
}

export interface Portfolio {
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
  education: Education[]
  skills: Skill[]
  projects: Project[]
  work_experience: WorkExperience[]
  social_links: SocialLink[]
}

export interface PortfolioSummary {
  id: string
  full_name: string
  email: string
  profile_picture_url: string | null
  template_id: number | null
  updated_at: string
}

export interface EducationInput {
  school: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
  description: string | null
}

export interface SkillInput {
  name: string
  level: number | null
}

export interface ProjectInput {
  title: string
  description: string | null
  project_url: string | null
  technologies: string | null
}

export interface WorkExperienceInput {
  company: string
  position: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
}

export interface SocialLinkInput {
  platform: string
  url: string
}

/** Full write used when creating a portfolio. Child arrays replace nothing yet. */
export interface PortfolioWrite {
  full_name: string
  email: string
  contact_number: string | null
  address: string | null
  about_me: string | null
  profile_picture_url: string | null
  profile_picture_path: string | null
  template_id: number | null
  education: EducationInput[]
  skills: SkillInput[]
  projects: ProjectInput[]
  work_experience: WorkExperienceInput[]
  social_links: SocialLinkInput[]
}

/**
 * Partial update. A child array, when present, replaces every existing row
 * for that table. Omit a child array to leave those rows alone.
 * Null clears an optional column. Undefined leaves it unchanged.
 */
export interface PortfolioUpdate {
  full_name?: string
  email?: string
  contact_number?: string | null
  address?: string | null
  about_me?: string | null
  profile_picture_url?: string | null
  profile_picture_path?: string | null
  template_id?: number | null
  education?: EducationInput[]
  skills?: SkillInput[]
  projects?: ProjectInput[]
  work_experience?: WorkExperienceInput[]
  social_links?: SocialLinkInput[]
}

export interface ProfilePicture {
  url: string
  path: string
}

/**
 * One interface, two backends. The app calls these methods only.
 * Supabase is used when the env vars are set. Otherwise localStorage is used.
 */
export interface DataLayer {
  readonly mode: DataMode
  createPortfolio(input: PortfolioWrite): Promise<Portfolio>
  listPortfolios(): Promise<PortfolioSummary[]>
  getPortfolio(id: string): Promise<Portfolio | null>
  updatePortfolio(id: string, input: PortfolioUpdate): Promise<Portfolio>
  deletePortfolio(id: string): Promise<void>
  uploadProfilePicture(portfolioId: string, file: File): Promise<ProfilePicture>
  deleteProfilePicture(path: string): Promise<void>
}
