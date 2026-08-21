import { useQuery } from '@tanstack/react-query'
import type { Application } from '@stackedu/shared'
import { applicationQueryKeyFor, getApplication } from '@/lib/api/admissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface CurrentApplication {
  application: Application | null
  isLoading: boolean
  refetch: () => Promise<unknown>
}

/** The signed-in applicant's own application. */
export function useApplication(): CurrentApplication {
  const { user } = useCurrentUser()
  const { data, isPending, refetch } = useQuery({
    queryKey: applicationQueryKeyFor(user?.id),
    queryFn: getApplication,
    enabled: user?.role === 'Applicant',
    retry: false,
  })

  return { application: data ?? null, isLoading: isPending, refetch }
}
