import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { PageGuide } from '@/components/PageGuide'
import { LECTURER_NAV } from '@/data/lecturer'
import { getLecturerProfile, lecturerProfileQueryKey } from '@/lib/api/lecturer'
import { initialsFrom } from '@/lib/utils'

interface LecturerShellProps {
  pageTitle: string
  guide?: string
  children: React.ReactNode
}

export function LecturerShell({ pageTitle, guide, children }: LecturerShellProps) {
  const { data } = useQuery({
    queryKey: lecturerProfileQueryKey,
    queryFn: getLecturerProfile,
  })

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle={pageTitle}
      userName={data?.fullName ?? 'Lecturer'}
      userRole="Lecturer"
      userInitials={data ? initialsFrom(data.fullName) : 'LC'}
      unreadCount={data?.unreadCount ?? 0}
      infoCardLabel="LECTURER ID"
      infoCardValue={data?.staffId ?? '—'}
      infoCardSubtext={data?.department}
    >
      {guide ? (
        <div style={{ padding: '20px 16px 0' }}>
          <PageGuide pageKey={`lecturer:${pageTitle}`}>{guide}</PageGuide>
        </div>
      ) : null}
      {children}
    </AppShell>
  )
}
