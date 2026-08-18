import type { Application, Gender, SaveApplicationRequest } from '@stackedu/shared'
import type { ApplicationFormValues } from '@/lib/apply/validate-step'

export type { ApplicationFormValues }

export const EMPTY_FORM_VALUES: ApplicationFormValues = {
  fullName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  nationality: 'Rwanda',
  idDocumentType: 'National ID',
  nationalId: '',
  countryOfBirth: 'Rwanda',
  countryOfResidence: 'Rwanda',
  districtOfResidence: '',
  cityOfResidence: '',
  address: '',
  previousInstitution: '',
  institutionCountry: 'Rwanda',
  previousQualification: '',
  examIndexNumber: '',
  aLevelCombination: '',
  completionYear: '',
  grade: '',
  subjects: '',
  awards: '',
  programmeId: '',
  entryYear: '',
  studyMode: 'Full-time',
  hearAbout: '',
  financialAid: false,
  guardianType: '',
  guardianName: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianOccupation: '',
  guardianEmployer: '',
  statement: '',
  hasSpecialNeeds: false,
  specialNeeds: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  declared: false,
}

/** Reads saved answers back out, so a returning applicant sees their own work. */
export function formValuesFromApplication(application: Application): ApplicationFormValues {
  const details = (application.details ?? {}) as Partial<Record<keyof ApplicationFormValues, unknown>>
  const saved = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<ApplicationFormValues>

  return {
    ...EMPTY_FORM_VALUES,
    ...saved,
    fullName: application.fullName,
    phone: application.phone,
    dateOfBirth: application.dateOfBirth ?? '',
    gender: application.gender ?? '',
    nationalId: application.nationalId ?? '',
    previousInstitution: application.previousInstitution ?? '',
    previousQualification: application.previousQualification ?? '',
    programmeId: application.programme?.id ?? '',
  }
}

/** Splits answers between queryable columns and the long-form details document. */
export function toSaveApplicationRequest(
  values: ApplicationFormValues,
  progress?: { currentStep: number; completedSteps: number[] },
): SaveApplicationRequest {
  const {
    fullName,
    phone,
    dateOfBirth,
    gender,
    nationalId,
    previousInstitution,
    previousQualification,
    programmeId,
    ...details
  } = values

  return {
    ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
    ...(phone.trim() ? { phone: phone.trim() } : {}),
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(gender ? { gender: gender as Gender } : {}),
    ...(nationalId ? { nationalId } : {}),
    ...(previousInstitution ? { previousInstitution } : {}),
    ...(previousQualification ? { previousQualification } : {}),
    ...(programmeId ? { programmeId } : {}),
    details: {
      ...details,
      ...(progress
        ? {
            formCurrentStep: progress.currentStep,
            formCompletedSteps: progress.completedSteps,
          }
        : {}),
    },
  }
}
