import { useQuery } from '@tanstack/react-query'
import type { SessionUser } from '@stackedu/shared'
import { getSession, sessionQueryKey } from '@/lib/api/auth'

interface CurrentUser {
  user: SessionUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

/** The signed-in user, from the session the API confirms. */
export function useCurrentUser(): CurrentUser {
  const { data, isPending } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  return {
    user: data ?? null,
    isLoading: isPending,
    isAuthenticated: Boolean(data),
  }
}
