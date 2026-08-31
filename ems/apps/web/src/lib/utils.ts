import { formatAppDateDdMmYyyy } from '@stackedu/shared'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose Tailwind class names with conflict resolution.
 * Import this from @/lib/utils — never from individual components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build avatar initials from a full name.
 * e.g. "Marie-Claire Ingabire" → "MI"
 */
export function initialsFrom(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'

  const first = parts[0]![0]!
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : ''

  return (first + last).toUpperCase()
}

/**
 * Format an integer monetary amount using the globally selected currency.
 * Currency is persisted in localStorage key 'stackedu_currency'.
 * RWF (default): "RWF 45,000"  |  USD: "$45.00" (1000 RWF = $1 mock rate)
 */
export function formatCurrency(amount: number): string {
  let currency = 'RWF'
  try { currency = localStorage.getItem('stackedu_currency') ?? 'RWF' } catch { /* SSR */ }
  if (currency === 'USD') {
    const usd = amount / 1000
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `RWF ${amount.toLocaleString('en-RW')}`
}

/** Read the active currency code from localStorage. */
export function getActiveCurrency(): string {
  try { return localStorage.getItem('stackedu_currency') ?? 'RWF' } catch { return 'RWF' }
}

/** Persist the selected currency to localStorage. */
export function setActiveCurrency(code: string): void {
  try { localStorage.setItem('stackedu_currency', code) } catch { /* SSR */ }
}

/**
 * Parse API / Postgres timestamps reliably.
 * Handles "2026-08-21 16:07:38.164+00" without showing raw ms or offset in the UI.
 */
export function parseAppDateTime(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  let iso = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  if (/[+-]\d{2}$/.test(iso)) iso = `${iso}:00`

  let parsed = new Date(iso)
  if (!Number.isNaN(parsed.getTime())) return parsed

  iso = trimmed.replace(' ', 'T').replace(/\.\d+/, '')
  if (/[+-]\d{2}$/.test(iso)) iso = `${iso}:00`
  parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Format a date for dense UI (tables, badges).
 * e.g. 2026-06-30 → "30-06-2026"
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (date == null || date === '') return '—'
  const parsed = parseAppDateTime(date)
  if (!parsed) return formatAppDateDdMmYyyy(date)
  return formatAppDateDdMmYyyy(parsed)
}

/**
 * Format a date for confirmations and full views.
 * e.g. 2026-06-30 → "Tuesday, 30-06-2026"
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (date == null || date === '') return '—'
  const parsed = parseAppDateTime(date)
  if (!parsed) return formatAppDateDdMmYyyy(date)
  const weekday = parsed.toLocaleDateString('en-GB', { weekday: 'long' })
  return `${weekday}, ${formatAppDateDdMmYyyy(parsed)}`
}

/**
 * Format a time in 24-hour clock per StackEDU conventions.
 * e.g. 14:30, not 2:30 PM
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (date == null || date === '') return '—'
  const parsed = parseAppDateTime(date)
  if (!parsed) return '—'
  return parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format a date and time for tables, activity feeds and receipts.
 * e.g. "21 Aug 2026, 16:07" — never milliseconds or timezone offsets.
 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (value == null || value === '') return '—'
  const parsed = parseAppDateTime(value)
  if (!parsed) {
    if (typeof value === 'string') {
      return value.replace(/\.\d+/, '').replace(/([+-]\d{2}(?::\d{2})?)$/, '').trim()
    }
    return '—'
  }
  return `${formatDateShort(parsed)}, ${formatTime(parsed)}`
}
