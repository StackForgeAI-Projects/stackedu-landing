import { formatFieldValidationMessage } from '@stackedu/shared'

/**
 * Per-step rules for the admissions form.
 *
 * Aligned with common Rwanda higher-education entry practice (National ID or
 * passport, Senior 6 / A-Level or equivalent, programme choice, guardian and
 * a signed declaration). Save-as-draft stays loose; Continue does not.
 */

export interface ApplicationFormValues {
  dateOfBirth: string
  gender: string
  nationality: string
  idDocumentType: string
  nationalId: string
  countryOfBirth: string
  countryOfResidence: string
  districtOfResidence: string
  cityOfResidence: string
  address: string
  previousInstitution: string
  institutionCountry: string
  previousQualification: string
  examIndexNumber: string
  aLevelCombination: string
  completionYear: string
  grade: string
  subjects: string
  awards: string
  programmeId: string
  entryYear: string
  studyMode: string
  hearAbout: string
  financialAid: boolean
  guardianType: string
  guardianName: string
  guardianRelationship: string
  guardianPhone: string
  guardianEmail: string
  guardianOccupation: string
  guardianEmployer: string
  statement: string
  hasSpecialNeeds: boolean
  specialNeeds: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelationship: string
  declared: boolean
}

export type FieldErrors = Partial<Record<keyof ApplicationFormValues, string>>

const RWANDA_NATIONAL_ID = /^\d{16}$/
const INTERNATIONAL_PHONE = /^\+[1-9]\d{7,14}$/

function required(value: string, message = 'This field is required'): string | undefined {
  return value.trim() ? undefined : message
}

function ageAtLeast16(dateOfBirth: string): string | undefined {
  if (!dateOfBirth) return 'Enter your date of birth'
  const born = new Date(dateOfBirth)
  if (Number.isNaN(born.getTime())) return 'Enter a valid date of birth'
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const month = today.getMonth() - born.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < born.getDate())) age -= 1
  if (age < 16) return 'You must be at least 16 years old to apply'
  if (age > 80) return 'Check your date of birth'
  return undefined
}

function identityNumber(values: ApplicationFormValues): string | undefined {
  const id = values.nationalId.replace(/\s+/g, '')
  if (!id) {
    return values.idDocumentType === 'Passport'
      ? 'Enter your passport number'
      : 'Enter your National ID number'
  }
  if (
    values.nationality === 'Rwanda' &&
    values.idDocumentType === 'National ID' &&
    !RWANDA_NATIONAL_ID.test(id)
  ) {
    return 'Rwandan National ID must be 16 digits'
  }
  if (id.length < 5) return 'Enter a valid ID or passport number'
  return undefined
}

function phone(value: string, label = 'phone number'): string | undefined {
  if (!value.trim()) return `Enter the ${label}`
  if (!INTERNATIONAL_PHONE.test(value.trim())) {
    return 'Phone number must be in international format, e.g. +250788123456.'
  }
  return undefined
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Returns field errors for the current step. Empty object means the step is ready. */
export function validateApplicationStep(
  step: number,
  values: ApplicationFormValues,
): FieldErrors {
  const errors: FieldErrors = {}

  const fail = (key: keyof ApplicationFormValues, message: string | undefined) => {
    if (message) errors[key] = message
  }

  if (step === 1) {
    fail('dateOfBirth', ageAtLeast16(values.dateOfBirth))
    fail('gender', required(values.gender, 'Select your gender'))
    fail('nationality', required(values.nationality, 'Select your nationality'))
    fail('idDocumentType', required(values.idDocumentType, 'Select ID type'))
    fail('nationalId', identityNumber(values))
    fail('countryOfBirth', required(values.countryOfBirth, 'Select country of birth'))
    fail('countryOfResidence', required(values.countryOfResidence, 'Select country of residence'))
    fail(
      'districtOfResidence',
      required(values.districtOfResidence, 'Enter your district of residence'),
    )
    fail('cityOfResidence', required(values.cityOfResidence, 'Enter your city or sector'))
    fail('address', required(values.address, 'Enter your physical address'))
  }

  if (step === 2) {
    fail(
      'previousInstitution',
      required(values.previousInstitution, 'Enter your secondary school or college'),
    )
    fail(
      'institutionCountry',
      required(values.institutionCountry, 'Select the country of the institution'),
    )
    fail(
      'previousQualification',
      required(values.previousQualification, 'Select your highest qualification'),
    )
    fail(
      'examIndexNumber',
      required(values.examIndexNumber, 'Enter your exam index / candidate number'),
    )
    if (
      values.previousQualification === 'A-Level' ||
      values.previousQualification === 'REB A-Level'
    ) {
      fail(
        'aLevelCombination',
        required(values.aLevelCombination, 'Select your A-Level combination'),
      )
    }
    fail('completionYear', required(values.completionYear, 'Select year of completion'))
    fail(
      'grade',
      required(values.grade, 'Enter your aggregate, average, or principal passes'),
    )
    fail(
      'subjects',
      required(values.subjects, 'List the principal subjects you studied'),
    )
  }

  if (step === 3) {
    fail('programmeId', required(values.programmeId, 'Select a programme'))
    fail('entryYear', required(values.entryYear, 'Select entry year'))
    fail('studyMode', required(values.studyMode, 'Select study mode'))
  }

  if (step === 4) {
    fail('guardianType', required(values.guardianType, 'Select guardian type'))
    fail('guardianName', required(values.guardianName, "Enter the guardian's full name"))
    fail(
      'guardianRelationship',
      required(values.guardianRelationship, 'Enter the relationship'),
    )
    fail('guardianPhone', phone(values.guardianPhone, "guardian's phone number"))
    fail(
      'guardianOccupation',
      required(values.guardianOccupation, "Enter the guardian's occupation"),
    )
    if (values.guardianEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.guardianEmail.trim())) {
        errors.guardianEmail = 'Enter a valid email address'
      }
    }
  }

  if (step === 5) {
    if (wordCount(values.statement) < 50) {
      errors.statement = 'Write at least 50 words about why you are applying'
    }
    if (values.hasSpecialNeeds) {
      fail(
        'specialNeeds',
        required(values.specialNeeds, 'Describe the support you need'),
      )
    }
    fail('emergencyName', required(values.emergencyName, 'Enter an emergency contact name'))
    fail('emergencyPhone', phone(values.emergencyPhone, 'emergency contact phone number'))
    fail(
      'emergencyRelationship',
      required(values.emergencyRelationship, 'Select the relationship'),
    )
    if (!values.declared) {
      errors.declared = 'You must confirm the declaration to continue'
    }
  }

  return errors
}

export function firstErrorMessage(errors: FieldErrors): string {
  for (const [field, message] of Object.entries(errors)) {
    if (message) return formatFieldValidationMessage(field, message)
  }
  return 'Please complete the required fields.'
}
