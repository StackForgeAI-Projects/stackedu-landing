import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ChevronLeft, CheckCircle2, AlertCircle, Clock, RotateCcw, XCircle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import { studentStatusColors, gradeColors } from '@/data/academic'
import {
  academicStudentQueryKey,
  getAcademicStudent,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'

export const Route = createFileRoute('/_auth/academic/student')({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) || '' }),
  component: StudentProfilePage,
})

type Tab = 'personal' | 'academic' | 'history'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StudentProfilePage() {
  const { id } = Route.useSearch()
  const [tab, setTab] = useState<Tab>('personal')
  const [showGradCheck, setShowGradCheck] = useState(false)
  const [graduateDialogOpen, setGraduateDialogOpen] = useState(false)

  const { data: s, isPending, error } = useQuery({
    queryKey: academicStudentQueryKey(id),
    queryFn: () => getAcademicStudent(id),
    enabled: Boolean(id),
  })

  const retakes = useMemo(() => {
    if (!s) return []
    const failed: { code: string; name: string; semesterFailed: string }[] = []
    for (const sem of s.semesters) {
      for (const result of sem.results) {
        if (result.grade === 'F' || result.grade.startsWith('F')) {
          failed.push({ code: result.code, name: result.name, semesterFailed: sem.name })
        }
      }
    }
    return failed
  }, [s])

  if (!id) {
    return (
      <AcademicShell pageTitle="Student Profile">
        <div className="page-body">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Missing student id.</p>
        </div>
      </AcademicShell>
    )
  }

  if (isPending || !s) {
    return (
      <AcademicShell pageTitle="Student Profile">
        <div className="page-body">
          <p className="t-body" style={{ color: error ? 'var(--error)' : 'var(--muted-foreground)' }}>
            {error ? apiErrorMessage(error, 'Student could not be loaded.') : 'Loading student…'}
          </p>
        </div>
      </AcademicShell>
    )
  }

  const hasRetakes = retakes.length > 0
  const cgpa = s.cgpa ?? 0

  const gradChecklist = [
    { label: 'All compulsory courses passed', pass: !hasRetakes, detail: hasRetakes ? `${retakes.map((r) => r.code).join(', ')} not passed` : 'All compulsory courses passed' },
    { label: 'Minimum elective credits (18)', pass: true, detail: 'On file' },
    { label: 'CGPA meets minimum (2.0)', pass: cgpa >= 2.0, detail: `CGPA ${cgpa.toFixed(2)}` },
    { label: 'All fees cleared', pass: s.feeBalance <= 0, detail: s.feeBalance > 0 ? `${formatCurrency(s.feeBalance)} outstanding` : 'No outstanding balance' },
  ]
  const isGradEligible = gradChecklist.every((item) => item.pass)

  const sc = studentStatusColors(s.status as Parameters<typeof studentStatusColors>[0])

  const standingColors = {
    'Good Standing': { bg: 'var(--success-bg)', color: 'var(--success)' },
    'Probation': { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    'Suspended': { bg: 'var(--error-bg)', color: 'var(--error)' },
  }[s.standing] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'personal', label: 'Personal Details' },
    { key: 'academic', label: 'Academic Record' },
    { key: 'history', label: 'Enrollment History' },
  ]

  return (
    <AcademicShell pageTitle="Student Profile">
      <div className="page-body animate-fade-up">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/academic/students" className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--success)', textDecoration: 'none' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />Student Registry
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{s.fullName}</h1>
            <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
          </div>
          <span className="t-label px-3 py-1.5 mt-1" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{s.status}</span>
        </div>

        <div className="flex gap-6">
          <div style={{ flex: '0 0 65%', maxWidth: '65%' }}>
            <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
              {TABS.map((t) => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors duration-150 -mb-px"
                  style={{ borderBottom: tab === t.key ? '2px solid var(--foreground)' : '2px solid transparent', color: tab === t.key ? 'var(--foreground)' : 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'personal' && (
              <>
                <SectionCard title="Basic Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'Full Name', value: s.fullName },
                      { label: 'Student ID', value: s.studentNumber },
                      { label: 'Date of Birth', value: formatDate(s.dateOfBirth) },
                      { label: 'Gender', value: s.gender ?? '—' },
                      { label: 'Nationality', value: s.nationality ?? '—' },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="Contact Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'Email', value: s.email },
                      { label: 'Phone', value: s.phone ?? '—' },
                      { label: 'Address', value: s.address ?? '—' },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            )}

            {tab === 'academic' && (
              <div>
                {hasRetakes && (
                  <div className="mb-4" style={{ backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--warning)', padding: 16 }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <RotateCcw style={{ width: 14, height: 14, color: 'var(--warning)', flexShrink: 0 }} />
                      <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>Retake Required</h3>
                    </div>
                    <p className="t-caption mb-3" style={{ color: 'var(--warning)', opacity: 0.85 }}>
                      This student must retake the following courses before they can progress or graduate.
                    </p>
                    <div className="flex flex-col gap-2">
                      {retakes.map((r) => (
                        <div key={`${r.code}-${r.semesterFailed}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg flex-wrap" style={{ backgroundColor: 'rgba(202,138,4,0.12)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--warning)', backgroundColor: 'rgba(202,138,4,0.15)', borderRadius: '10px', padding: '2px 7px', whiteSpace: 'nowrap' }}>{r.code}</span>
                          <span className="text-sm font-medium flex-1" style={{ color: 'var(--foreground)' }}>{r.name}</span>
                          <span className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{r.semesterFailed}</span>
                          <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: '10px' }}>Failed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.semesters.length === 0 ? (
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No academic record yet.</p>
                ) : s.semesters.map((sem, si) => (
                  <div key={si} className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{sem.name}</h2>
                      <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        GPA: {sem.gpa != null ? sem.gpa.toFixed(2) : '—'}
                      </span>
                    </div>
                    <DataTable
                      rows={sem.results}
                      rowKey={(r) => r.code}
                      hideSearch
                      empty="No results in this semester."
                      defaultPageSize={25}
                      columns={[
                        { id: 'code', header: 'Course Code', value: (r) => r.code, cell: (r) => <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{r.code}</span> },
                        { id: 'name', header: 'Course Name', value: (r) => r.name, cell: (r) => <span className="text-sm" style={{ color: 'var(--foreground)' }}>{r.name}</span> },
                        {
                          id: 'grade', header: 'Grade', value: (r) => r.grade,
                          cell: (r) => {
                            const gc = gradeColors(r.grade)
                            return <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{r.grade}</span>
                          },
                        },
                        { id: 'credits', header: 'Credits', value: (r) => r.credits, cell: (r) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{r.credits} cr</span> },
                      ]}
                    />
                  </div>
                ))}

                <div className="flex items-center gap-4 p-5 rounded-xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>CGPA</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{cgpa.toFixed(2)}</p>
                  </div>
                  <span className="t-label px-3 py-1.5" style={{ backgroundColor: standingColors.bg, color: standingColors.color, borderRadius: 'var(--radius-sm)' }}>{s.standing}</span>
                </div>
              </div>
            )}

            {tab === 'history' && (
              <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
                {s.timeline.length === 0 ? (
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No enrollment history recorded.</p>
                ) : (
                  <div className="flex flex-col" style={{ gap: 0 }}>
                    {s.timeline.map((ev, i) => {
                      const Icon = ev.type === 'admission' ? CheckCircle2 : ev.type === 'suspension' ? AlertCircle : Clock
                      const iconColor = ev.type === 'admission' ? 'var(--success)' : ev.type === 'suspension' ? 'var(--error)' : 'var(--info)'
                      return (
                        <div key={i} className="flex gap-4 py-4" style={{ borderBottom: i < s.timeline.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="flex-shrink-0 mt-0.5 flex items-center justify-center rounded-full" style={{ width: 32, height: 32, backgroundColor: 'var(--muted)' }}>
                            <Icon style={{ width: 14, height: 14, color: iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{ev.event}</p>
                            {ev.notes && <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{ev.notes}</p>}
                          </div>
                          <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{ev.date}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4" style={{ flex: '0 0 35%', maxWidth: '35%' }}>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Student Status</h3>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="t-label px-3 py-1.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', fontSize: 12 }}>{s.status}</span>
                {hasRetakes && (
                  <span className="t-label px-3 py-1.5 flex items-center gap-1" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <RotateCcw style={{ width: 10, height: 10 }} />Retake Required
                  </span>
                )}
              </div>
              {[
                { label: 'Enrollment Date', value: formatDate(s.enrollmentDate) },
                { label: 'Programme', value: s.programmeName },
                { label: 'Year of Study', value: `Year ${s.yearOfStudy}` },
                { label: 'Expected Grad.', value: formatDate(s.expectedGraduation) },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Actions</h3>
              <div className="flex flex-col gap-2.5">
                <ActionButton label="Suspend student" color="var(--error)" confirmTitle="Suspend student?" confirmDesc={`This will suspend ${s.fullName}'s access to all platform features.`} />
                <div>
                  {!showGradCheck ? (
                    <button type="button" onClick={() => setShowGradCheck(true)} className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{ border: '1px solid var(--brand)', color: 'var(--brand)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                      Check graduation eligibility
                    </button>
                  ) : (
                    <div>
                      <div className="mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <div className="px-3 py-2" style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>GRADUATION REQUIREMENTS</p>
                        </div>
                        {gradChecklist.map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5 px-3 py-2.5"
                            style={{ borderBottom: i < gradChecklist.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'var(--card)' }}>
                            {item.pass
                              ? <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
                              : <XCircle style={{ width: 14, height: 14, color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.4 }}>{item.label}</p>
                              <p className="t-caption mt-0.5" style={{ color: item.pass ? 'var(--success)' : 'var(--error)' }}>{item.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <AlertDialog open={graduateDialogOpen} onOpenChange={setGraduateDialogOpen}>
                        <button type="button" disabled={!isGradEligible} onClick={() => { if (isGradEligible) setGraduateDialogOpen(true) }}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mb-1.5"
                          style={{ backgroundColor: isGradEligible ? 'var(--brand)' : 'var(--muted)', color: isGradEligible ? 'var(--brand-ink)' : 'var(--muted-foreground)', border: 'none', cursor: isGradEligible ? 'pointer' : 'not-allowed' }}>
                          Graduate student
                        </button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Graduate student?</AlertDialogTitle>
                            <AlertDialogDescription>Confirm graduation for {s.fullName}. This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => setGraduateDialogOpen(false)}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <button type="button" onClick={() => setShowGradCheck(false)} className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                        style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                        Hide checklist
                      </button>
                    </div>
                  )}
                </div>
                <ActionButton label="Transfer programme" color="var(--foreground)" confirmTitle="Transfer programme?" confirmDesc={`You are about to initiate a programme transfer for ${s.fullName}.`} />
                <ActionButton label="Defer enrollment" color="var(--foreground)" confirmTitle="Defer enrollment?" confirmDesc={`Defer ${s.fullName}'s enrollment to a future semester.`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AcademicShell>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
      <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{title}</h2>
      {children}
    </div>
  )
}

function ActionButton({ label, color, confirmTitle, confirmDesc }: { label: string; color: string; confirmTitle: string; confirmDesc: string }) {
  const isDestructive = color === 'var(--error)'
  const borderColor = isDestructive ? 'var(--error)' : 'var(--border)'
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
          style={{ border: `1px solid ${borderColor}`, color, backgroundColor: 'transparent', cursor: 'pointer' }}>
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
