const RELOAD_TS_KEY = 'stackedu:chunk-reload-ts'
const RELOAD_COOLDOWN_MS = 10_000

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Importing a module script failed')
  )
}

/** Reload once when a code-split chunk is missing — common right after a deploy. */
export function handleChunkLoadError(error: unknown): boolean {
  if (!isChunkLoadError(error) || typeof window === 'undefined') return false

  const lastReload = Number(sessionStorage.getItem(RELOAD_TS_KEY) ?? 0)
  const now = Date.now()
  if (now - lastReload < RELOAD_COOLDOWN_MS) return false

  sessionStorage.setItem(RELOAD_TS_KEY, String(now))
  window.location.reload()
  return true
}

export function installStaleChunkRecovery(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    handleChunkLoadError(event.payload ?? new Error('Failed to fetch dynamically imported module'))
  })
}
