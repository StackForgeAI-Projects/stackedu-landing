const PALETTE = ['#0D9488', '#7C3AED', '#D97706', '#2563EB', '#E11D48', '#059669']

/** Stable colour for a course code so every screen shows the same badge. */
export function courseColor(code: string): string {
  let hash = 0
  for (const char of code) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]!
}

export function formatClock(value: string): string {
  return value.slice(0, 5)
}
