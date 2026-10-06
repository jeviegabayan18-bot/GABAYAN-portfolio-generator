/**
 * Live check against the Supabase project named in the environment.
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the shell, or from
 * .env.local / .env if those variables are not already set. The key may be a
 * publishable key (sb_publishable_...) or a legacy anon JWT. Secret keys are refused.
 *
 * Before the SQL has been pasted, this stops at the templates table with
 * instructions to run supabase/setup_all.sql. It does not leave test rows behind.
 */
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.VITE_SUPABASE_URL?.trim() ?? ''
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
const bucket = process.env.VITE_SUPABASE_BUCKET?.trim() || 'profile-pictures'

function pass(step) {
  console.log(`PASS  ${step}`)
}

function fail(step, detail) {
  console.log(detail ? `FAIL  ${step}: ${detail}` : `FAIL  ${step}`)
}

function schemaMissing(error) {
  const code = error?.code ?? ''
  const message = `${error?.message ?? ''}`
  return (
    code === 'PGRST205' ||
    /schema cache/i.test(message) ||
    /could not find the table/i.test(message) ||
    /relation ["']?(public\.)?\w+["']? does not exist/i.test(message)
  )
}

function bucketMissing(error) {
  const message = `${error?.message ?? ''}`
  return /bucket not found/i.test(message) || /bucket does not exist/i.test(message)
}

function printSchemaHelp() {
  console.log('')
  console.log('The database schema is not installed yet.')
  console.log('Open the Supabase dashboard → SQL Editor, paste the entire file')
  console.log('supabase/setup_all.sql, and run it. That one file creates the tables,')
  console.log('the three templates, row level security, and the profile-pictures bucket.')
  console.log('Then run npm run db:check again.')
}

function loadEnvFile(name) {
  if (!existsSync(name)) return
  const text = readFileSync(name, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const envKey = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[envKey] === undefined) process.env[envKey] = value
  }
}

// 1x1 PNG. Small enough for the 2 MB bucket limit.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

if (!url || !key) {
  fail('env', 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (shell or .env.local).')
  process.exit(1)
}

if (key.startsWith('sb_secret_') || /service_role/i.test(key)) {
  fail('env', 'Refusing a secret or service-role key. Use the publishable key (sb_publishable_...).')
  process.exit(1)
}

if (/your-project/i.test(url) || /your-key|placeholder|your-anon/i.test(key)) {
  fail('env', 'Those values are still the placeholders from .env.example.')
  process.exit(1)
}

pass('env')

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let portfolioId = null
let picturePath = null
let failed = false

async function cleanup() {
  if (picturePath) {
    const removed = await supabase.storage.from(bucket).remove([picturePath])
    if (removed.error && !bucketMissing(removed.error)) {
      console.log(`WARN  cleanup picture: ${removed.error.message}`)
    }
    picturePath = null
  }
  if (portfolioId) {
    const deleted = await supabase.from('portfolios').delete().eq('id', portfolioId)
    if (deleted.error && !schemaMissing(deleted.error)) {
      console.log(`WARN  cleanup portfolio: ${deleted.error.message}`)
    }
    portfolioId = null
  }
}

try {
  const templates = await supabase.from('templates').select('id, slug').order('id')
  if (templates.error) {
    fail('templates', templates.error.message)
    if (schemaMissing(templates.error)) printSchemaHelp()
    failed = true
  } else {
    const slugs = (templates.data ?? []).map((row) => row.slug).sort()
    const expected = ['creative', 'modern', 'simple']
    if (slugs.length !== 3 || expected.some((slug, index) => slugs[index] !== slug)) {
      fail('templates', `expected slugs simple, modern, creative; got ${slugs.join(', ') || 'none'}`)
      failed = true
    } else {
      pass('templates (3 rows)')
    }
  }

  if (failed) {
    process.exitCode = 1
  } else {
    const email = `db-check-${Date.now()}@example.com`
    const created = await supabase
      .from('portfolios')
      .insert({
        full_name: 'DB Check',
        email,
        contact_number: '555-0100',
        address: 'Test address',
        about_me: 'Temporary row created by npm run db:check. It should be deleted.',
        template_id: 1,
      })
      .select('id')
      .single()

    if (created.error || !created.data?.id) {
      fail('create portfolio', created.error?.message ?? 'no id returned')
      if (schemaMissing(created.error)) printSchemaHelp()
      throw new Error('stop')
    }
    portfolioId = created.data.id
    pass('create portfolio')

    const children = await Promise.all([
      supabase.from('education').insert({
        portfolio_id: portfolioId,
        sort_order: 0,
        school: 'Northwind University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_year: 2026,
        end_year: 2030,
      }),
      supabase.from('skills').insert({
        portfolio_id: portfolioId,
        sort_order: 0,
        name: 'JavaScript',
        level: 3,
      }),
      supabase.from('projects').insert({
        portfolio_id: portfolioId,
        sort_order: 0,
        title: 'DB Check Project',
        description: 'Temporary',
        project_url: 'https://example.com/db-check',
        technologies: 'JavaScript',
      }),
      supabase.from('work_experience').insert({
        portfolio_id: portfolioId,
        sort_order: 0,
        company: 'City Library',
        position: 'Assistant',
        start_date: '2025-06-01',
        end_date: null,
        is_current: true,
      }),
      supabase.from('social_links').insert({
        portfolio_id: portfolioId,
        sort_order: 0,
        platform: 'Website',
        url: 'https://example.com',
      }),
    ])
    const childError = children.find((result) => result.error)?.error
    if (childError) {
      fail('create child rows', childError.message)
      throw new Error('stop')
    }
    pass('create child rows')

    const read = await supabase
      .from('portfolios')
      .select('id, full_name, email, education(id), skills(id), projects(id), work_experience(id), social_links(id)')
      .eq('id', portfolioId)
      .maybeSingle()
    if (read.error || !read.data) {
      fail('read portfolio', read.error?.message ?? 'row missing')
      throw new Error('stop')
    }
    const counts = ['education', 'skills', 'projects', 'work_experience', 'social_links']
    const short = counts.find((name) => !Array.isArray(read.data[name]) || read.data[name].length !== 1)
    if (short || read.data.email !== email) {
      fail('read portfolio', 'child rows or email did not match')
      throw new Error('stop')
    }
    pass('read portfolio')

    const updated = await supabase
      .from('portfolios')
      .update({ full_name: 'DB Check Updated' })
      .eq('id', portfolioId)
      .select('full_name')
      .single()
    if (updated.error) {
      fail('update portfolio', updated.error.message)
      throw new Error('stop')
    }
    pass('update portfolio')

    if (updated.data?.full_name !== 'DB Check Updated') {
      fail('confirm update', `full_name is ${updated.data?.full_name ?? 'empty'}`)
      throw new Error('stop')
    }
    pass('confirm update')

    picturePath = `db-check/${crypto.randomUUID()}.png`
    const uploaded = await supabase.storage.from(bucket).upload(picturePath, TINY_PNG, {
      contentType: 'image/png',
      upsert: false,
    })
    if (uploaded.error) {
      fail('upload profile picture', uploaded.error.message)
      if (bucketMissing(uploaded.error)) {
        console.log('')
        console.log(`The ${bucket} bucket was not found.`)
        console.log('Paste supabase/setup_all.sql into the SQL Editor and run it again.')
      }
      picturePath = null
      throw new Error('stop')
    }
    pass('upload profile picture')

    const removed = await supabase.storage.from(bucket).remove([picturePath])
    if (removed.error) {
      fail('delete profile picture', removed.error.message)
      throw new Error('stop')
    }
    picturePath = null
    pass('delete profile picture')

    const deleted = await supabase.from('portfolios').delete().eq('id', portfolioId)
    if (deleted.error) {
      fail('delete portfolio', deleted.error.message)
      throw new Error('stop')
    }
    const goneId = portfolioId
    portfolioId = null
    pass('delete portfolio')

    const after = await supabase.from('portfolios').select('id').eq('id', goneId).maybeSingle()
    if (after.error) {
      fail('confirm deleted', after.error.message)
      throw new Error('stop')
    }
    if (after.data) {
      fail('confirm deleted', 'the test row is still in portfolios')
      portfolioId = goneId
      throw new Error('stop')
    }
    pass('confirm deleted')
  }
} catch (error) {
  if (error instanceof Error && error.message === 'stop') {
    process.exitCode = 1
  } else {
    fail('unexpected', error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
} finally {
  await cleanup()
}

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('All checks passed.')
