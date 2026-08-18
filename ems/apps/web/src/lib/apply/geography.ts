import catalog from './geography/catalog.json'

export const APPLY_COUNTRIES = [
  'Rwanda',
  'Burundi',
  'Democratic Republic of Congo',
  'Kenya',
  'Tanzania',
  'Uganda',
  'Ethiopia',
  'Nigeria',
  'South Africa',
  'Other',
] as const

export type ApplyCountry = (typeof APPLY_COUNTRIES)[number]

export interface RegionFieldLabels {
  division: string
  subdivision: string
  divisionPlaceholder: string
  subdivisionPlaceholder: string
}

interface CountryGeography {
  divisions: string[]
  subdivisions: Record<string, string[]>
}

const DEFAULT_LABELS: RegionFieldLabels = {
  division: 'State / Province / Region',
  subdivision: 'City / Town',
  divisionPlaceholder: 'Select or type your region',
  subdivisionPlaceholder: 'Select or type your city or town',
}

const LABELS_BY_COUNTRY: Partial<Record<ApplyCountry, RegionFieldLabels>> = {
  Rwanda: {
    division: 'District',
    subdivision: 'Sector',
    divisionPlaceholder: 'Select or type your district',
    subdivisionPlaceholder: 'Select or type your sector',
  },
  Kenya: {
    division: 'County',
    subdivision: 'Sub-county / Ward',
    divisionPlaceholder: 'Select or type your county',
    subdivisionPlaceholder: 'Select or type your sub-county or ward',
  },
  Tanzania: {
    division: 'Region',
    subdivision: 'District',
    divisionPlaceholder: 'Select or type your region',
    subdivisionPlaceholder: 'Select or type your district',
  },
  Uganda: {
    division: 'District',
    subdivision: 'Sub-county / Division',
    divisionPlaceholder: 'Select or type your district',
    subdivisionPlaceholder: 'Select or type your sub-county or division',
  },
  Burundi: {
    division: 'Province',
    subdivision: 'Commune',
    divisionPlaceholder: 'Select or type your province',
    subdivisionPlaceholder: 'Select or type your commune',
  },
  'Democratic Republic of Congo': {
    division: 'Province',
    subdivision: 'Territory / Commune',
    divisionPlaceholder: 'Select or type your province',
    subdivisionPlaceholder: 'Select or type your territory or commune',
  },
  Nigeria: {
    division: 'State',
    subdivision: 'LGA / City',
    divisionPlaceholder: 'Select or type your state',
    subdivisionPlaceholder: 'Select or type your LGA or city',
  },
  Ethiopia: {
    division: 'Region',
    subdivision: 'Zone / City',
    divisionPlaceholder: 'Select or type your region',
    subdivisionPlaceholder: 'Select or type your zone or city',
  },
  'South Africa': {
    division: 'Province',
    subdivision: 'City / Municipality',
    divisionPlaceholder: 'Select or type your province',
    subdivisionPlaceholder: 'Select or type your city or municipality',
  },
}

const GEOGRAPHY_BY_COUNTRY = catalog as Partial<Record<ApplyCountry, CountryGeography>>

function lookupSubdivisions(map: Record<string, string[]>, division: string): string[] {
  const exact = map[division]
  if (exact) return exact

  const lowerKey = division.trim().toLowerCase()
  const matched = Object.entries(map).find(([name]) => name.toLowerCase() === lowerKey)
  return matched ? matched[1] : []
}

export function getRegionFieldLabels(country: string): RegionFieldLabels {
  return LABELS_BY_COUNTRY[country as ApplyCountry] ?? DEFAULT_LABELS
}

export function getCountryDivisions(country: string): string[] {
  const entry = GEOGRAPHY_BY_COUNTRY[country as ApplyCountry]
  return entry?.divisions ? [...entry.divisions] : []
}

export function getCountrySubdivisions(country: string, division: string): string[] {
  const key = division.trim()
  if (!key) return []

  const entry = GEOGRAPHY_BY_COUNTRY[country as ApplyCountry]
  if (!entry?.subdivisions) return []

  return [...lookupSubdivisions(entry.subdivisions, key)]
}

export function residenceFieldLabels(country: string): {
  divisionLabel: string
  subdivisionLabel: string
} {
  const labels = getRegionFieldLabels(country)
  return {
    divisionLabel: `${labels.division} of residence`,
    subdivisionLabel: labels.subdivision,
  }
}
