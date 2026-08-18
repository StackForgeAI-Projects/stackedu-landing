import type { Application } from '@stackedu/shared'
import { REQUIRED_APPLICATION_DOCUMENT_TYPES } from '@stackedu/shared'
import {
  type ApplicationFormValues,
  formValuesFromApplication,
} from '@/lib/apply/form-values'
import { validateApplicationStep } from '@/lib/apply/validate-step'

/** Header progress for each of the seven application steps. */
export const APPLY_PROGRESS_BY_STEP: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
  6: 100,
  7: 100,
}

export const FORM_PROGRESS_KEYS = {
  currentStep: 'formCurrentStep',
  completedSteps: 'formCompletedSteps',
} as const

export interface ApplyProgressState {
  currentStep: number
  completedSteps: number[]
  progressPercent: number
}

function stepIsComplete(step: number, values: ApplicationFormValues): boolean {
  return Object.keys(validateApplicationStep(step, values)).length === 0
}

function inferFormProgress(values: ApplicationFormValues): Pick<ApplyProgressState, 'currentStep' | 'completedSteps'> {
  const completedSteps: number[] = []
  let currentStep = 1

  for (let step = 1; step <= 5; step += 1) {
    if (stepIsComplete(step, values)) {
      completedSteps.push(step)
      continue
    }
    currentStep = step
    return { currentStep, completedSteps }
  }

  return { currentStep: 5, completedSteps: [1, 2, 3, 4, 5] }
}

function readStoredProgress(details: Record<string, unknown>): Pick<ApplyProgressState, 'currentStep' | 'completedSteps'> | null {
  const currentStep = details[FORM_PROGRESS_KEYS.currentStep]
  const completedSteps = details[FORM_PROGRESS_KEYS.completedSteps]

  if (typeof currentStep !== 'number' || !Array.isArray(completedSteps)) return null

  return {
    currentStep: Math.min(Math.max(Math.trunc(currentStep), 1), 7),
    completedSteps: completedSteps.filter(
      (step): step is number => typeof step === 'number' && step >= 1 && step <= 7,
    ),
  }
}

function hasRequiredDocuments(application: Application): boolean {
  return REQUIRED_APPLICATION_DOCUMENT_TYPES.every((type) =>
    application.documents.some((doc) => doc.documentType === type),
  )
}

/** Where the applicant is in the seven-step flow — used by the form and track header. */
export function resolveApplicationProgress(application: Application | null): ApplyProgressState {
  if (!application) {
    return { currentStep: 1, completedSteps: [], progressPercent: 0 }
  }

  const details = (application.details ?? {}) as Record<string, unknown>
  const values = formValuesFromApplication(application)
  const inferred = inferFormProgress(values)
  const stored = readStoredProgress(details)

  let currentStep = stored?.currentStep ?? inferred.currentStep
  let completedSteps = stored?.completedSteps ?? inferred.completedSteps

  if (stored) {
    currentStep = Math.max(currentStep, inferred.currentStep)
    completedSteps = [...new Set([...completedSteps, ...inferred.completedSteps])]
  }

  const formComplete = [1, 2, 3, 4, 5].every((step) => stepIsComplete(step, values))
  if (formComplete) {
    completedSteps = [...new Set([...completedSteps, 1, 2, 3, 4, 5])]
    if (!hasRequiredDocuments(application)) {
      currentStep = Math.max(currentStep, 6)
    } else if (application.payment?.status !== 'Completed') {
      currentStep = Math.max(currentStep, 7)
      completedSteps = [...new Set([...completedSteps, 6])]
    } else {
      currentStep = 7
      completedSteps = [...new Set([...completedSteps, 6, 7])]
    }
  }

  return {
    currentStep,
    completedSteps,
    progressPercent: APPLY_PROGRESS_BY_STEP[currentStep] ?? 0,
  }
}

export function progressDetailsPatch(
  currentStep: number,
  completedSteps: number[],
): Record<string, unknown> {
  return {
    [FORM_PROGRESS_KEYS.currentStep]: currentStep,
    [FORM_PROGRESS_KEYS.completedSteps]: completedSteps,
  }
}

export type ApplyResumeRoute = '/apply/form' | '/apply/documents' | '/apply/payment'

/** Route where the applicant should pick up the seven-step flow. */
export function applyResumeRoute(currentStep: number): ApplyResumeRoute {
  if (currentStep >= 7) return '/apply/payment'
  if (currentStep >= 6) return '/apply/documents'
  return '/apply/form'
}

/** Clamp a stored step to the five form pages. */
export function formStepFromProgress(currentStep: number): number {
  return Math.min(Math.max(Math.trunc(currentStep), 1), 5)
}

export interface TrackTimelineStage {
  key: 'started' | 'payment' | 'sent' | 'reviewed' | 'decision'
  label: string
  done: boolean
  subtitle: string
}

function formatTrackDate(value: string | null | undefined): string | null {
  if (!value) return null

  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function paymentTrackSubtitle(application: Application): string {
  const payment = application.payment

  if (payment?.status === 'Completed') {
    return formatTrackDate(payment.paidAt) ?? 'Paid'
  }
  if (payment?.status === 'Pending') return 'Pending confirmation'
  if (payment?.status === 'Failed') return 'Payment failed'
  if (payment?.status === 'Voided') return 'Payment voided'
  return 'Not yet'
}

/** Track dashboard timeline — payment must complete before "Application sent". */
export function buildTrackTimelineStages(application: Application): TrackTimelineStage[] {
  const paymentCompleted = application.payment?.status === 'Completed'
  const submitted = application.submittedAt !== null
  const decided = application.status === 'Accepted' || application.status === 'Rejected'

  return [
    {
      key: 'started',
      label: 'Application started',
      done: true,
      subtitle: formatTrackDate(application.createdAt) ?? 'Started',
    },
    {
      key: 'payment',
      label: 'Application fee payment',
      done: paymentCompleted,
      subtitle: paymentTrackSubtitle(application),
    },
    {
      key: 'sent',
      label: 'Application sent',
      done: submitted,
      subtitle: submitted
        ? (formatTrackDate(application.submittedAt) ?? 'Sent')
        : 'Not yet',
    },
    {
      key: 'reviewed',
      label: 'Reviewed',
      done: application.reviewedAt !== null,
      subtitle: application.reviewedAt
        ? (formatTrackDate(application.reviewedAt) ?? 'Reviewed')
        : 'Not yet',
    },
    {
      key: 'decision',
      label: 'Decision',
      done: decided,
      subtitle: decided
        ? (formatTrackDate(application.reviewedAt)
          ?? (application.status === 'Rejected' ? 'Not successful' : 'Offered'))
        : 'Not yet',
    },
  ]
}

export function trackTimelineSubtitle(stage: TrackTimelineStage, active: boolean): string {
  if (stage.done || !active) return stage.subtitle
  if (stage.key === 'payment' && stage.subtitle === 'Not yet') return 'Waiting'
  if (stage.key === 'sent') return 'Waiting'
  return stage.subtitle === 'Not yet' ? 'Waiting' : stage.subtitle
}
