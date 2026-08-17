import { APP_VERSION } from '@/lib/app-meta'

export function AppVersion() {
  return (
    <div
      className="pointer-events-none absolute bottom-3 right-8 sm:right-10 z-20 select-none"
      style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem', letterSpacing: '0.02em' }}
      aria-label={`StackEDU version ${APP_VERSION}`}
    >
      v{APP_VERSION}
    </div>
  )
}
