import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/librarian/')({
  component: LibrarianDashboardPlaceholder,
})

function LibrarianDashboardPlaceholder() {
  return <div className="p-8 t-h2">Librarian dashboard — coming soon.</div>
}
