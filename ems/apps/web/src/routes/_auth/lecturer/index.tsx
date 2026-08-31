import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/lecturer/')({
  beforeLoad: () => { throw redirect({ to: '/lecturer/dashboard' }) },
  component: () => null,
})
