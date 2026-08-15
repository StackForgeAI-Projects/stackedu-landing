import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/student/')({
  component: () => <Navigate to="/student/dashboard" />,
})
