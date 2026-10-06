import { createLocalDataLayer } from './local.ts'
import { createSupabaseDataLayer, isSupabaseConfigured } from './supabase.ts'
import type { DataLayer } from './types.ts'

let cached: DataLayer | null = null

/**
 * Picks the backend once. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * and redeploy to switch from demo mode to Supabase. No code change.
 */
export function getDataLayer(): DataLayer {
  if (!cached) {
    cached = isSupabaseConfigured() ? createSupabaseDataLayer() : createLocalDataLayer()
  }
  return cached
}

export function isDemoMode(): boolean {
  return getDataLayer().mode === 'local'
}

export type {
  DataLayer,
  Portfolio,
  PortfolioSummary,
  PortfolioUpdate,
  PortfolioWrite,
} from './types.ts'
