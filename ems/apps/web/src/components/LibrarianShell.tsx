import { AppShell } from '@/components/AppShell'
import { LIBRARIAN, LIBRARIAN_NAV } from '@/data/librarian'

interface LibrarianShellProps {
  pageTitle: string
  children: React.ReactNode
}

export function LibrarianShell({ pageTitle, children }: LibrarianShellProps) {
  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle={pageTitle}
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARY"
      infoCardValue={LIBRARIAN.office}
      infoCardSubtext={LIBRARIAN.employeeId}
    >
      {children}
    </AppShell>
  )
}
