import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <>
      <Outlet />
      {/*
        One Toaster for the whole app. Every toast dismisses itself after five
        seconds and carries a close button, so a message can never sit on the
        screen with no way to get rid of it.
      */}
      <Toaster richColors closeButton position="top-right" duration={5000} />
    </>
  )
}
