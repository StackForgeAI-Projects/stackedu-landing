import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface InstitutionBranding {
  name: string
  shortName: string
  slug: string
}

const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_INSTITUTION_SLUG ?? 'sfu'
const FALLBACK_NAME = 'StackForgeAI University'

export const institutionBrandingQueryKey = ['public', 'institution', DEFAULT_SLUG] as const

export async function fetchInstitutionBranding(slug = DEFAULT_SLUG): Promise<InstitutionBranding> {
  return api.get<InstitutionBranding>(`/public/institution/${slug}`)
}

export function useInstitutionBranding() {
  const query = useQuery({
    queryKey: institutionBrandingQueryKey,
    queryFn: () => fetchInstitutionBranding(),
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    institutionName: query.data?.name ?? FALLBACK_NAME,
    institutionShortName: query.data?.shortName ?? 'SFU',
  }
}
