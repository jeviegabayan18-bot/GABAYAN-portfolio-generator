import type { TemplateSlug } from '../data/types.ts'

export interface TemplateInfo {
  id: number
  slug: TemplateSlug
  name: string
  description: string
}

/**
 * Ids 1, 2, and 3 are the rows inserted by supabase/migrations/0001_init.sql.
 * Do not renumber them without changing that seed.
 */
export const TEMPLATES: readonly TemplateInfo[] = [
  {
    id: 1,
    slug: 'simple',
    name: 'Simple',
    description: 'A clean single-column page with a white background and quiet type.',
  },
  {
    id: 2,
    slug: 'modern',
    name: 'Modern',
    description: 'A card layout with a colored header, skill bars, and a project grid.',
  },
  {
    id: 3,
    slug: 'creative',
    name: 'Creative',
    description: 'A bold sidebar and timeline with strong color and a different reading order.',
  },
]

export function templateById(id: number | null): TemplateInfo | null {
  if (id === null) return null
  return TEMPLATES.find((template) => template.id === id) ?? null
}

export const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Familiar',
  3: 'Comfortable',
  4: 'Strong',
  5: 'Advanced',
}
