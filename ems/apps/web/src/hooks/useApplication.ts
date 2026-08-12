import { useQuery } from '@tanstack/react-query'
import type { Application } from '@stackedu/shared'
import { applicationQueryKey, getApplication } from '@/lib/api/admissions'

interface CurrentApplication {
  application: Application | null
  isLoading: boolean
  refetch: () => Promise<unknown>
}

/** The signed-in applicant's own application. */
export function useApplication(): CurrentApplication {
  const { data, isPending, refetch } = useQuery({
    queryKey: applicationQueryKey,
    queryFn: getApplication,
    retry: false,
  })

  return { application: data ?? null, isLoading: isPending, refetch }
}
