import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import type { Application, Gender, SaveApplicationRequest } from '@stackedu/shared'
import { ApplyLayout, type ApplyStep } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useApplication } from '@/hooks/useApplication'
import {
  applicationQueryKey, getProgrammes, programmesQueryKey, saveApplication,
} from '@/lib/api/admissions'
import { apiErrorMessage } from '@/lib/api/client'
import {
  firstErrorMessage,
  validateApplicationStep,
  type FieldErrors,
} from '@/lib/apply/validate-step'
import { notifyError, notifySuccess } from '@/lib/notify'
import { requireVerifiedApplicant } from '@/lib/auth/guards'
import { queryClient } from '@/lib/query-client'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/form')({
  beforeLoad: requireVerifiedApplicant,
  component: ApplyFormPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const FORM_STEPS: ApplyStep[] = [
  { id: 1, label: 'Personal Details'    },
  { id: 2, label: 'Academic History'    },
  { id: 3, label: 'Programme Selection' },
  { id: 4, label: 'Parent / Guardian'   },
  { id: 5, label: 'Additional Info'     },
  { id: 6, label: 'Documents'           },
  { id: 7, label: 'Application Fee'     },
]

const PROGRESS_MAP: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 }

/**
 * Everything the five form steps collect.
 *
 * Held as one flat object so a step can be moved or split without rewriting how
 * the answers are stored, and so saving is a single call rather than one per
 * step.
 */
interface FormValues {
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

const EMPTY_VALUES: FormValues = {
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
function valuesFrom(application: Application): FormValues {
  const details = (application.details ?? {}) as Partial<Record<keyof FormValues, unknown>>
  const saved = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<FormValues>

  return {
    ...EMPTY_VALUES,
    ...saved,
    dateOfBirth: application.dateOfBirth ?? '',
    gender: application.gender ?? '',
    nationalId: application.nationalId ?? '',
    previousInstitution: application.previousInstitution ?? '',
    previousQualification: application.previousQualification ?? '',
    programmeId: application.programme?.id ?? '',
  }
}

/**
 * Splits the answers between the columns the admissions office queries on and
 * the document that holds the long-form rest.
 */
function toSaveRequest(values: FormValues): SaveApplicationRequest {
  const {
    dateOfBirth, gender, nationalId, previousInstitution, previousQualification,
    programmeId, ...details
  } = values

  return {
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(gender ? { gender: gender as Gender } : {}),
    ...(nationalId ? { nationalId } : {}),
    ...(previousInstitution ? { previousInstitution } : {}),
    ...(previousQualification ? { previousQualification } : {}),
    ...(programmeId ? { programmeId } : {}),
    details,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function ApplyFormPage() {
  const navigate = useNavigate()
  const { application, isLoading } = useApplication()

  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  // Fill the form from the saved application once it arrives, and only once, so
  // typing is never overwritten by a refetch.
  useEffect(() => {
    if (!application || loadedFor === application.id) return
    setValues(valuesFrom(application))
    setLoadedFor(application.id)
  }, [application, loadedFor])

  const { data: programmes = [] } = useQuery({
    queryKey: programmesQueryKey,
    queryFn: getProgrammes,
  })

  const save = useMutation({
    mutationFn: () => saveApplication(toSaveRequest(values)),
    onSuccess: (updated) => {
      queryClient.setQueryData(applicationQueryKey, updated)
    },
    onError: (error: unknown) => {
      notifyError(
        apiErrorMessage(error, 'We could not save your answers. Please try again.'),
      )
    },
  })

  const set = (patch: Partial<FormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    // Clear errors for fields the applicant is fixing.
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch) as Array<keyof FormValues>) delete next[key]
      return next
    })
  }

  const goNext = async () => {
    const stepErrors = validateApplicationStep(currentStep, values)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      notifyError(firstErrorMessage(stepErrors))
      return
    }

    setErrors({})
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]))

    // Each step is saved as it is left, so a dropped connection costs one step
    // of typing rather than the whole form.
    await save.mutateAsync().catch(() => undefined)

    if (currentStep < 5) {
      setCurrentStep((step) => step + 1)
      return
    }
    await navigate({ to: '/apply/documents' })
  }

  const goBack = () => {
    setErrors({})
    if (currentStep > 1) setCurrentStep((step) => step - 1)
  }

  const saveProgress = async () => {
    const updated = await save.mutateAsync().catch(() => null)
    if (updated) notifySuccess('Your progress has been saved.')
  }

  const stepProps = {
    values,
    errors,
    set,
    onNext: () => void goNext(),
    onSave: () => void saveProgress(),
    saving: save.isPending,
  }

  return (
    <ApplyLayout
      steps={FORM_STEPS}
      currentStep={currentStep}
      completedSteps={completedSteps}
      progressPercent={PROGRESS_MAP[currentStep]}
      showBanner
    >
      {isLoading ? (
        <StepCard>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Loading your application…
          </p>
        </StepCard>
      ) : (
        <>
          {currentStep === 1 && <Step1 {...stepProps} application={application} />}
          {currentStep === 2 && <Step2 {...stepProps} onBack={goBack} />}
          {currentStep === 3 && <Step3 {...stepProps} onBack={goBack} programmes={programmes} />}
          {currentStep === 4 && <Step4 {...stepProps} onBack={goBack} />}
          {currentStep === 5 && <Step5 {...stepProps} onBack={goBack} />}
        </>
      )}
    </ApplyLayout>
  )
}

// ── Shared layout helpers ─────────────────────────────────────────────────────

interface StepProps {
  values: FormValues
  errors: FieldErrors
  set: (patch: Partial<FormValues>) => void
  onNext: () => void
  onSave: () => void
  saving: boolean
  onBack?: () => void
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius:    'var(--radius-xl)',
        boxShadow:       'var(--shadow-sm)',
        border:          '1px solid var(--border)',
        padding:         '2rem',
      }}
    >
      {children}
    </div>
  )
}

function SectionDivider({ title, alt }: { title: string; alt?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: alt ? 'var(--background)' : 'var(--card)',
        margin:          '1.5rem -2rem',
        padding:         '0.75rem 2rem',
        borderTop:       '1px solid var(--border)',
        borderBottom:    '1px solid var(--border)',
      }}
    >
      <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>{title}</p>
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4">
      {children}
    </div>
  )
}

function Field({
  label,
  children,
  full,
  required,
  error,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
  required?: boolean
  error?: string
}) {
  return (
    <div
      className="flex flex-col gap-1.5"
      style={full ? { gridColumn: '1 / -1' } : {}}
    >
      <Label>
        {label}
        {required ? (
          <span style={{ color: 'var(--error)' }} aria-hidden="true"> *</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs" style={{ color: 'var(--error)' }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** A read-only field: set when the account was created, changed by request. */
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <Input value={value} readOnly style={{ backgroundColor: 'var(--muted)', cursor: 'default' }} />
    </Field>
  )
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function NavRow({
  onBack,
  onNext,
  onSave,
  saving,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  onBack?:      () => void
  onNext:       () => void
  onSave:       () => void
  saving:       boolean
  nextLabel?:   string
  nextDisabled?: boolean
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>← Back</Button>
        ) : (
          <div />
        )}
        <Button
          onClick={onNext}
          disabled={nextDisabled || saving}
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
        >
          {saving ? 'Saving…' : nextLabel}
        </Button>
      </div>
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#0D7A28', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Save progress
        </button>
      </div>
    </div>
  )
}

// ── Country list (abbreviated for UI purposes) ────────────────────────────────

const COUNTRIES = [
  'Rwanda', 'Burundi', 'Democratic Republic of Congo', 'Kenya',
  'Tanzania', 'Uganda', 'Ethiopia', 'Nigeria', 'South Africa', 'Other',
]

const RWANDA_DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe',
  'Ngoma', 'Nyagatare', 'Rwamagana', 'Burera', 'Gakenke', 'Gicumbi', 'Musanze',
  'Rulindo', 'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza',
  'Nyaruguru', 'Ruhango', 'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke',
  'Rubavu', 'Rusizi', 'Rutsiro', 'Other / Outside Rwanda',
]

const A_LEVEL_COMBINATIONS = [
  'PCM (Physics, Chemistry, Mathematics)',
  'PCB (Physics, Chemistry, Biology)',
  'MCB (Mathematics, Chemistry, Biology)',
  'MPG (Mathematics, Physics, Geography)',
  'MEG (Mathematics, Economics, Geography)',
  'HEG (History, Economics, Geography)',
  'HEL (History, Economics, Literature)',
  'LFK (Literature, French, Kinyarwanda)',
  'Other combination',
]

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Personal Details
// ─────────────────────────────────────────────────────────────────────────────

function Step1({
  values, errors, set, onNext, onSave, saving, application,
}: StepProps & { application: Application | null }) {
  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Personal Details
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Enter your identity and contact details as on your National ID or passport.
      </p>

      <SectionDivider title="BASIC INFORMATION" />
      <FieldGrid>
        <LockedField label="Full name" value={application?.fullName ?? ''} />
        <Field label="Date of birth" required error={errors.dateOfBirth}>
          <Input
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => set({ dateOfBirth: e.target.value })}
          />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <Select value={values.gender} onValueChange={(gender) => set({ gender })}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Other">Other / Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Nationality" required error={errors.nationality}>
          <CountrySelect
            value={values.nationality}
            onChange={(nationality) => set({ nationality })}
          />
        </Field>
        <Field label="ID document type" required error={errors.idDocumentType}>
          <Select
            value={values.idDocumentType}
            onValueChange={(idDocumentType) => set({ idDocumentType })}
          >
            <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="National ID">National ID</SelectItem>
              <SelectItem value="Passport">Passport</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={values.idDocumentType === 'Passport' ? 'Passport number' : 'National ID number'}
          required
          error={errors.nationalId}
        >
          <Input
            placeholder={
              values.idDocumentType === 'Passport' ? 'Passport number' : '16-digit National ID'
            }
            value={values.nationalId}
            onChange={(e) => set({ nationalId: e.target.value })}
            inputMode={values.idDocumentType === 'National ID' ? 'numeric' : 'text'}
          />
        </Field>
        <Field label="Country of birth" required error={errors.countryOfBirth}>
          <CountrySelect
            value={values.countryOfBirth}
            onChange={(countryOfBirth) => set({ countryOfBirth })}
          />
        </Field>
      </FieldGrid>

      <SectionDivider title="CONTACT & RESIDENCE" alt />
      <FieldGrid>
        <LockedField label="Phone number" value={application?.phone ?? ''} />
        <LockedField label="Email address" value={application?.email ?? ''} />
        <Field label="Country of residence" required error={errors.countryOfResidence}>
          <CountrySelect
            value={values.countryOfResidence}
            onChange={(countryOfResidence) => set({ countryOfResidence })}
          />
        </Field>
        <Field label="District of residence" required error={errors.districtOfResidence}>
          <Select
            value={values.districtOfResidence}
            onValueChange={(districtOfResidence) => set({ districtOfResidence })}
          >
            <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
            <SelectContent>
              {RWANDA_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City / Sector" required error={errors.cityOfResidence}>
          <Input
            placeholder="e.g. Remera, Huye"
            value={values.cityOfResidence}
            onChange={(e) => set({ cityOfResidence: e.target.value })}
          />
        </Field>
        <Field label="Physical address" required full error={errors.address}>
          <Textarea
            placeholder="Village / cell, street or landmark"
            rows={3}
            value={values.address}
            onChange={(e) => set({ address: e.target.value })}
          />
        </Field>
      </FieldGrid>

      <NavRow onNext={onNext} onSave={onSave} saving={saving} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Academic History
// ─────────────────────────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i))
const QUALIFICATIONS = [
  'A-Level',
  'REB A-Level',
  'TVET Certificate / Diploma',
  'Diploma',
  "Bachelor's",
  'Other / Foreign equivalent',
]

function Step2({ values, errors, set, onNext, onBack, onSave, saving }: StepProps) {
  const needsCombination =
    values.previousQualification === 'A-Level' ||
    values.previousQualification === 'REB A-Level'

  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Academic History
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Use the details from your Senior 6 / A-Level certificate or equivalent.
      </p>

      <SectionDivider title="SECONDARY / PRIOR EDUCATION" />
      <FieldGrid>
        <Field label="School / institution name" required error={errors.previousInstitution}>
          <Input
            placeholder="e.g. Lycée de Kigali"
            value={values.previousInstitution}
            onChange={(e) => set({ previousInstitution: e.target.value })}
          />
        </Field>
        <Field label="Country of institution" required error={errors.institutionCountry}>
          <CountrySelect
            value={values.institutionCountry}
            onChange={(institutionCountry) => set({ institutionCountry })}
          />
        </Field>
        <Field label="Highest qualification" required error={errors.previousQualification}>
          <Select
            value={values.previousQualification}
            onValueChange={(previousQualification) => set({ previousQualification })}
          >
            <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
            <SelectContent>
              {QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Exam index / candidate number" required error={errors.examIndexNumber}>
          <Input
            placeholder="e.g. NESA / REB index number"
            value={values.examIndexNumber}
            onChange={(e) => set({ examIndexNumber: e.target.value })}
          />
        </Field>
        {needsCombination && (
          <Field label="A-Level combination" required error={errors.aLevelCombination} full>
            <Select
              value={values.aLevelCombination}
              onValueChange={(aLevelCombination) => set({ aLevelCombination })}
            >
              <SelectTrigger><SelectValue placeholder="Select combination" /></SelectTrigger>
              <SelectContent>
                {A_LEVEL_COMBINATIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label="Year of completion" required error={errors.completionYear}>
          <Select
            value={values.completionYear}
            onValueChange={(completionYear) => set({ completionYear })}
          >
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Aggregate / average / principal passes" required error={errors.grade}>
          <Input
            placeholder="e.g. 58 aggregate, 2 principal passes, 65%"
            value={values.grade}
            onChange={(e) => set({ grade: e.target.value })}
          />
        </Field>
        <Field label="Principal subjects studied" required full error={errors.subjects}>
          <Textarea
            placeholder="e.g. Mathematics, Physics, Chemistry"
            rows={3}
            value={values.subjects}
            onChange={(e) => set({ subjects: e.target.value })}
          />
        </Field>
      </FieldGrid>

      <SectionDivider title="ACHIEVEMENTS (OPTIONAL)" alt />
      <div className="mt-4">
        <Field label="Academic awards or distinctions">
          <Textarea
            placeholder="Awards, scholarships, or honours (optional)"
            rows={3}
            value={values.awards}
            onChange={(e) => set({ awards: e.target.value })}
          />
        </Field>
      </div>

      <NavRow onBack={onBack} onNext={onNext} onSave={onSave} saving={saving} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Programme Selection
// ─────────────────────────────────────────────────────────────────────────────

const ENTRY_YEARS = (() => {
  const year = new Date().getFullYear()
  return [`${year}/${year + 1}`, `${year + 1}/${year + 2}`]
})()
const STUDY_MODES = ['Full-time', 'Part-time']
const HEAR_ABOUT  = ['University website', 'Social media', 'Friend or family', 'Education fair', 'Other']

function Step3({
  values, errors, set, onNext, onBack, onSave, saving, programmes,
}: StepProps & { programmes: Array<{ id: string; name: string; level: string }> }) {
  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Programme Selection
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Confirm the programme and intake you are applying for.
      </p>

      <SectionDivider title="PROGRAMME DETAILS" />
      <FieldGrid>
        <Field label="Programme of interest" required error={errors.programmeId}>
          <Select value={values.programmeId} onValueChange={(programmeId) => set({ programmeId })}>
            <SelectTrigger><SelectValue placeholder="Select a programme" /></SelectTrigger>
            <SelectContent>
              {programmes.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} · {p.level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Entry year / intake" required error={errors.entryYear}>
          <Select value={values.entryYear} onValueChange={(entryYear) => set({ entryYear })}>
            <SelectTrigger><SelectValue placeholder="Select entry year" /></SelectTrigger>
            <SelectContent>
              {ENTRY_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Study mode" required error={errors.studyMode}>
          <Select value={values.studyMode} onValueChange={(studyMode) => set({ studyMode })}>
            <SelectTrigger><SelectValue placeholder="Select study mode" /></SelectTrigger>
            <SelectContent>
              {STUDY_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGrid>

      <SectionDivider title="ADDITIONAL" alt />
      <div className="mt-4 flex flex-col gap-5">
        <Field label="How did you hear about us?">
          <Select value={values.hearAbout} onValueChange={(hearAbout) => set({ hearAbout })}>
            <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>
              {HEAR_ABOUT.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center justify-between gap-4 p-4 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Financial aid interest
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Indicate if you would like to be considered for financial aid
            </p>
          </div>
          <Switch
            checked={values.financialAid}
            onCheckedChange={(financialAid) => set({ financialAid })}
          />
        </div>

        {values.financialAid && (
          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{
              backgroundColor: 'var(--info-bg)',
              border:          '1px solid rgba(37,99,235,0.25)',
            }}
          >
            <Info size={15} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--info)', lineHeight: 1.5 }}>
              Financial aid applications are reviewed after admission. Indicating interest does not affect your admission decision.
            </p>
          </div>
        )}
      </div>

      <NavRow onBack={onBack} onNext={onNext} onSave={onSave} saving={saving} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Parent / Guardian
// ─────────────────────────────────────────────────────────────────────────────

const GUARDIAN_TYPES = ['Father', 'Mother', 'Legal Guardian']

function Step4({ values, errors, set, onNext, onBack, onSave, saving }: StepProps) {
  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Parent / Guardian
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Parent or legal guardian details are required for undergraduate applicants.
      </p>

      <SectionDivider title="GUARDIAN INFORMATION" />
      <FieldGrid>
        <Field label="Guardian type" required error={errors.guardianType}>
          <Select
            value={values.guardianType}
            onValueChange={(guardianType) => set({ guardianType })}
          >
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {GUARDIAN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Full name" required error={errors.guardianName}>
          <Input
            placeholder="Guardian's full name"
            value={values.guardianName}
            onChange={(e) => set({ guardianName: e.target.value })}
          />
        </Field>
        <Field label="Relationship" required error={errors.guardianRelationship}>
          <Input
            placeholder="e.g. Father, Mother, Aunt"
            value={values.guardianRelationship}
            onChange={(e) => set({ guardianRelationship: e.target.value })}
          />
        </Field>
        <Field label="Phone number" required error={errors.guardianPhone}>
          <Input
            type="tel"
            placeholder="+250788123456"
            value={values.guardianPhone}
            onChange={(e) => set({ guardianPhone: e.target.value })}
          />
        </Field>
        <Field label="Email address (optional)" error={errors.guardianEmail}>
          <Input
            type="email"
            placeholder="guardian@email.com"
            value={values.guardianEmail}
            onChange={(e) => set({ guardianEmail: e.target.value })}
          />
        </Field>
        <Field label="Occupation" required error={errors.guardianOccupation}>
          <Input
            placeholder="e.g. Teacher, Farmer, Business Owner"
            value={values.guardianOccupation}
            onChange={(e) => set({ guardianOccupation: e.target.value })}
          />
        </Field>
        <Field label="Employer (optional)">
          <Input
            placeholder="e.g. Ministry of Education"
            value={values.guardianEmployer}
            onChange={(e) => set({ guardianEmployer: e.target.value })}
          />
        </Field>
      </FieldGrid>

      <NavRow onBack={onBack} onNext={onNext} onSave={onSave} saving={saving} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Additional Info
// ─────────────────────────────────────────────────────────────────────────────

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse', 'Friend', 'Colleague', 'Other']

function Step5({ values, errors, set, onNext, onBack, onSave, saving }: StepProps) {
  const wordCount = values.statement.trim().split(/\s+/).filter(Boolean).length
  const wordsMet = wordCount >= 50

  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Additional Information
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Motivation, emergency contact, and your declaration of truth.
      </p>

      <SectionDivider title="PERSONAL STATEMENT" />
      <div className="mt-4">
        <Field label="Why are you applying?" required error={errors.statement} full>
          <div className="relative">
            <Textarea
              value={values.statement}
              onChange={(e) => set({ statement: e.target.value })}
              rows={8}
              placeholder="Explain your motivation and why this programme fits your goals..."
              style={{ minHeight: 180, paddingBottom: 28 }}
            />
            <span
              className="absolute bottom-2 right-3 text-xs tabular-nums"
              style={{ color: wordsMet ? 'var(--success)' : 'var(--muted-foreground)' }}
            >
              {wordCount} / 50 words minimum
            </span>
          </div>
        </Field>
      </div>

      <SectionDivider title="SPECIAL NEEDS" alt />
      <div className="mt-4 flex flex-col gap-4">
        <div
          className="flex items-center justify-between gap-4 p-4 rounded-lg"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Do you have any disabilities or special needs requiring accommodation?
            </p>
          </div>
          <Switch
            checked={values.hasSpecialNeeds}
            onCheckedChange={(hasSpecialNeeds) => set({ hasSpecialNeeds })}
          />
        </div>
        {values.hasSpecialNeeds && (
          <Field label="Describe your requirements" required error={errors.specialNeeds} full>
            <Textarea
              value={values.specialNeeds}
              onChange={(e) => set({ specialNeeds: e.target.value })}
              rows={3}
              placeholder="Describe any accommodations you may need..."
            />
          </Field>
        )}
      </div>

      <SectionDivider title="EMERGENCY CONTACT" />
      <FieldGrid>
        <Field label="Full name" required error={errors.emergencyName}>
          <Input
            placeholder="Emergency contact name"
            value={values.emergencyName}
            onChange={(e) => set({ emergencyName: e.target.value })}
          />
        </Field>
        <Field label="Phone number" required error={errors.emergencyPhone}>
          <Input
            type="tel"
            placeholder="+250788123456"
            value={values.emergencyPhone}
            onChange={(e) => set({ emergencyPhone: e.target.value })}
          />
        </Field>
        <Field label="Relationship" required error={errors.emergencyRelationship}>
          <Select
            value={values.emergencyRelationship}
            onValueChange={(emergencyRelationship) => set({ emergencyRelationship })}
          >
            <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGrid>

      <SectionDivider title="DECLARATION" alt />
      <div
        className="mt-4 flex items-start gap-3 p-4 rounded-lg"
        style={{
          border: `1px solid ${errors.declared ? 'var(--error)' : 'var(--border)'}`,
          backgroundColor: 'var(--muted)',
        }}
      >
        <Checkbox
          id="declaration"
          checked={values.declared}
          onCheckedChange={(v) => set({ declared: v as boolean })}
          className="mt-0.5"
        />
        <Label htmlFor="declaration" className="cursor-pointer font-normal text-sm leading-relaxed">
          I confirm that all information provided is accurate and complete, and matches my National ID
          or passport and academic certificates. I understand that false information may lead to
          disqualification.
        </Label>
      </div>
      {errors.declared ? (
        <p className="text-xs mt-2" style={{ color: 'var(--error)' }} role="alert">
          {errors.declared}
        </p>
      ) : null}

      <NavRow
        onBack={onBack}
        onNext={onNext}
        onSave={onSave}
        saving={saving}
        nextLabel="Continue to documents"
      />
    </StepCard>
  )
}
