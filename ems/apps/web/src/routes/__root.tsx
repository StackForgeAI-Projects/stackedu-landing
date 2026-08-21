import { createRootRoute, ErrorComponent, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { InactivityLogoutNotice } from '@/components/InactivityLogoutNotice'
import { handleChunkLoadError, isChunkLoadError } from '@/lib/chunk-reload'

export const Route = createRootRoute({
  component: Root,
  errorComponent: RootError,
})

function RootError({ error }: { error: Error }) {
  useEffect(() => {
    handleChunkLoadError(error)
  }, [error])

  if (isChunkLoadError(error)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Loading the latest version…
        </p>
      </div>
    )
  }

  return <ErrorComponent error={error} />
}

function Root() {
  return (
    <>
      <Outlet />
      <Toaster richColors closeButton position="top-right" duration={5000} style={{ zIndex: 99999 }} />
      <InactivityLogoutNotice />
    </>
  )
}
