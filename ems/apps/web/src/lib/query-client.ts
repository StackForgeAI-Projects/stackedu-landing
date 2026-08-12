import { QueryClient } from '@tanstack/react-query'

/**
 * Shared by the React tree and by router guards.
 *
 * The guard on _auth runs before any component mounts, so it cannot reach the
 * client through a hook. Exporting the instance lets the guard reuse a session
 * that has already been fetched instead of asking the API on every navigation.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})
