export function filled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatUpdated(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatYearRange(start: number | null, end: number | null): string {
  if (start && end) return `${start} – ${end}`
  if (start) return String(start)
  if (end) return String(end)
  return ''
}

export function formatDateRange(
  start: string | null,
  end: string | null,
  current: boolean,
): string {
  const startLabel = formatMonth(start)
  if (current) return startLabel ? `${startLabel} – Present` : 'Present'
  const endLabel = formatMonth(end)
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  return startLabel || endLabel
}

export function techList(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function linkHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatMonth(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}
