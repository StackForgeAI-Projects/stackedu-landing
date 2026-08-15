import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/academic/')({
  beforeLoad: () => { throw redirect({ to: '/academic/dashboard' }) },
  component: () => null,
})
