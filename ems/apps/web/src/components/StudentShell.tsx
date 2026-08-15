import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { PageGuide } from '@/components/PageGuide'
import { STUDENT_NAV } from '@/data/student'
import { getStudentProfile, studentProfileQueryKey } from '@/lib/api/student'

interface StudentShellProps {
  pageTitle: string
  guide?: string
  children: React.ReactNode
}

export function StudentShell({ pageTitle, guide, children }: StudentShellProps) {
  const { data } = useQuery({
    queryKey: studentProfileQueryKey,
    queryFn: getStudentProfile,
  })

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle={pageTitle}
      userName={data?.fullName ?? 'Student'}
      userRole="Student"
      userInitials={data ? `${data.firstName[0] ?? ''}${data.lastName[0] ?? ''}` : 'ST'}
      unreadCount={data?.unreadCount ?? 0}
      infoCardLabel="STUDENT ID"
      infoCardValue={data?.studentNumber ?? '—'}
      infoCardSubtext={data ? `Year ${data.yearOfStudy}` : undefined}
    >
      {guide ? <div style={{ padding: '20px 16px 0' }}><PageGuide pageKey={`student:${pageTitle}`}>{guide}</PageGuide></div> : null}
      {children}
    </AppShell>
  )
}
