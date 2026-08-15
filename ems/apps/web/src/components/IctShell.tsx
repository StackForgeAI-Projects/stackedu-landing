import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { PageGuide } from '@/components/PageGuide'
import { ICT_NAV } from '@/data/ict'
import { getIctProfile, ictProfileQueryKey } from '@/lib/api/ict'

interface IctShellProps {
  pageTitle: string
  guide?: string
  children: React.ReactNode
}

export function IctShell({ pageTitle, guide, children }: IctShellProps) {
  const { data } = useQuery({
    queryKey: ictProfileQueryKey,
    queryFn: getIctProfile,
  })

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle={pageTitle}
      userName={data?.fullName ?? 'ICT Manager'}
      userRole="ICT Manager"
      userInitials={data ? data.firstName.slice(0, 2).toUpperCase() : 'ICT'}
      unreadCount={data?.unreadCount ?? 0}
      infoCardLabel="INSTITUTION"
      infoCardValue={data?.institutionShortName ?? '—'}
      infoCardSubtext={data?.institutionName}
    >
      {guide ? <div style={{ padding: '20px 16px 0' }}><PageGuide pageKey={`ict:${pageTitle}`}>{guide}</PageGuide></div> : null}
      {children}
    </AppShell>
  )
}
