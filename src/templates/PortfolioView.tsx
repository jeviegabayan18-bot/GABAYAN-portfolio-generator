import type { Portfolio } from '../data/types.ts'
import { templateById } from '../lib/templates.ts'
import { CreativeTemplate } from './CreativeTemplate.tsx'
import { ModernTemplate } from './ModernTemplate.tsx'
import { SimpleTemplate } from './SimpleTemplate.tsx'

export function PortfolioView({ portfolio }: { portfolio: Portfolio }) {
  const slug = templateById(portfolio.template_id)?.slug ?? 'simple'
  if (slug === 'modern') return <ModernTemplate portfolio={portfolio} />
  if (slug === 'creative') return <CreativeTemplate portfolio={portfolio} />
  return <SimpleTemplate portfolio={portfolio} />
}
