import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, CheckCircle2, Eye, Lock, Pencil, Trash2 } from 'lucide-react'
import type { AttendanceStatus, LecturerAttendanceSession } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  deleteLecturerAttendanceSession,
  getLecturerAttendanceSession,
  getLecturerCourse,
  lecturerAttendanceQueryKey,
  lecturerAttendanceSessionQueryKey,
  lecturerCourseQueryKey,
  lecturerCoursesQueryKey,
  lecturerDashboardQueryKey,
  listLecturerAttendance,
  listLecturerCourses,
  saveLecturerAttendance,
} from '@/lib/api/lecturer'
import { formatDateLong, formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/attendance')({
  component: AttendancePage,
})

type AttStatus = Extract<AttendanceStatus, 'Present' | 'Absent' | 'Late'>

type ActiveSession = {
  id?: string
  sessionDate: string
  topic: string
}

function AttendancePage() {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [offeringId, setOfferingId] = useState('')
  const [sessionActive, setSessionActive] = useState(false)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [statuses, setStatuses] = useState<Record<string, AttStatus>>({})
  const [viewSessionId, setViewSessionId] = useState<string | null>(null)
  const [deleteSession, setDeleteSession] = useState<LecturerAttendanceSession | null>(null)
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  useEffect(() => {
    if (!offeringId && courses[0]) setOfferingId(courses[0].offeringId)
  }, [courses, offeringId])

  const { data: course } = useQuery({
    queryKey: lecturerCourseQueryKey(offeringId),
    queryFn: () => getLecturerCourse(offeringId),
    enabled: Boolean(offeringId),
  })
  const { data: sessions = [], isPending, error } = useQuery({
    queryKey: lecturerAttendanceQueryKey(offeringId),
    queryFn: () => listLecturerAttendance(offeringId),
    enabled: Boolean(offeringId),
  })

  const students = course?.students ?? []
  const today = new Date().toISOString().slice(0, 10)
  const nextSessionNum = sessions.length + 1
  const getStatus = (id: string): AttStatus => statuses[id] ?? 'Present'
  const counts = students.reduce(
    (acc, s) => {
      const st = getStatus(s.studentId)
      if (st === 'Present') acc.present += 1
      else if (st === 'Absent') acc.absent += 1
      else acc.late += 1
      return acc
    },
    { present: 0, absent: 0, late: 0 },
  )

  const resetSession = () => {
    setSessionActive(false)
    setActiveSession(null)
    setStatuses({})
  }

  const startSession = () => {
    const initial: Record<string, AttStatus> = {}
    students.forEach((s) => { initial[s.studentId] = 'Present' })
    setStatuses(initial)
    setActiveSession({ sessionDate: today, topic: `Session ${nextSessionNum}` })
    setSessionActive(true)
  }

  const openSessionForEdit = async (session: LecturerAttendanceSession) => {
    if (!session.editable) {
      toast.error('This session can no longer be edited.')
      return
    }
    setLoadingEditId(session.id)
    try {
      if (session.offeringId !== offeringId) {
        setOfferingId(session.offeringId)
        await queryClient.fetchQuery({
          queryKey: lecturerCourseQueryKey(session.offeringId),
          queryFn: () => getLecturerCourse(session.offeringId),
        })
      }
      const detail = await getLecturerAttendanceSession(session.id)
      const initial: Record<string, AttStatus> = {}
      for (const record of detail.records) {
        if (record.status === 'Present' || record.status === 'Absent' || record.status === 'Late') {
          initial[record.studentId] = record.status
        }
      }
      setStatuses(initial)
      setActiveSession({
        id: session.id,
        sessionDate: session.sessionDate,
        topic: session.topic ?? `Session ${session.sessionNumber}`,
      })
      setSessionActive(true)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open this session for editing.'))
    } finally {
      setLoadingEditId(null)
    }
  }

  const buildRecords = () =>
    students.map((s) => ({ studentId: s.studentId, status: getStatus(s.studentId) }))

  const invalidateAttendance = async () => {
    await queryClient.invalidateQueries({ queryKey: lecturerAttendanceQueryKey(offeringId) })
    await queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
  }

  const save = useMutation({
    mutationFn: (close: boolean) => {
      if (!activeSession) throw new Error('No active session')
      return saveLecturerAttendance({
        sessionId: activeSession.id,
        offeringId,
        sessionDate: activeSession.sessionDate,
        topic: activeSession.topic,
        close,
        records: buildRecords(),
      })
    },
    onSuccess: async (_data, close) => {
      toast.success(close ? `Attendance recorded for ${course?.code ?? 'this course'}` : 'Draft saved')
      if (close) resetSession()
      await invalidateAttendance()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save attendance.')),
  })

  const submitDraft = useMutation({
    mutationFn: async (session: LecturerAttendanceSession) => {
      const detail = await getLecturerAttendanceSession(session.id)
      return saveLecturerAttendance({
        sessionId: session.id,
        offeringId: session.offeringId,
        sessionDate: session.sessionDate,
        topic: session.topic ?? undefined,
        close: true,
        records: detail.records.map((record) => ({
          studentId: record.studentId,
          status: record.status,
        })),
      })
    },
    onSuccess: async () => {
      toast.success('Attendance submitted')
      resetSession()
      await invalidateAttendance()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not submit attendance.')),
  })

  const remove = useMutation({
    mutationFn: (sessionId: string) => deleteLecturerAttendanceSession(sessionId),
    onSuccess: async (_sessions, sessionId) => {
      toast.success('Attendance session deleted')
      setDeleteSession(null)
      if (activeSession?.id === sessionId) resetSession()
      await invalidateAttendance()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete this session.')),
  })

  const editingExisting = Boolean(activeSession?.id)
  const sessionLabel = activeSession?.topic ?? `Session ${nextSessionNum}`
  const sessionDateLabel = activeSession?.sessionDate ?? today

  return (
    <LecturerShell pageTitle="Attendance" guide="Choose a course, start or resume a session, mark each student Present, Absent or Late, then submit. Drafts stay editable; submitted records can be edited within the window set by ICT. Use the table to search, filter rows, edit, submit drafts, or delete.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Attendance</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Record and track student attendance per session.</p>
          </div>
          {courses.length > 0 && (
            <Select value={offeringId} onValueChange={(id) => { setOfferingId(id); resetSession() }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {error ? (
          <p className="t-body mb-6" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load attendance.')}</p>
        ) : null}

        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '20px 24px' }}
        >
          <div>
            <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>
              {sessionActive ? (editingExisting ? 'EDITING SESSION' : 'CURRENT SESSION') : 'CURRENT SESSION'}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{course ? `${course.code} — ${course.name}` : 'Select a course'}</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {sessionLabel} · {formatDateLong(sessionDateLabel)}
            </p>
          </div>
          {!sessionActive && (
            <Button onClick={startSession} disabled={!course || students.length === 0} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              Start session
            </Button>
          )}
          {sessionActive && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present: {counts.present}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Absent: {counts.absent}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>Late: {counts.late}</span>
            </div>
          )}
        </div>

        {sessionActive && (
          <div className="mb-6">
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="hidden sm:grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 220px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>STUDENT ID</span>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>NAME</span>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>STATUS</span>
              </div>
              {students.map((s, i) => {
                const status = getStatus(s.studentId)
                return (
                  <div key={s.studentId} className="flex flex-col sm:grid sm:items-center px-5 gap-2" style={{ gridTemplateColumns: '140px 1fr 220px', paddingTop: 13, paddingBottom: 13, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {(['Present', 'Absent', 'Late'] as AttStatus[]).map((opt) => {
                        const active = status === opt
                        const colors = { Present: 'var(--success)', Absent: 'var(--error)', Late: 'var(--warning)' }
                        const bgs = { Present: 'var(--success-bg)', Absent: 'var(--error-bg)', Late: 'var(--warning-bg)' }
                        return (
                          <button
                            key={opt}
                            onClick={() => setStatuses((prev) => ({ ...prev, [s.studentId]: opt }))}
                            className="px-2.5 py-1 text-xs font-semibold"
                            style={{
                              borderRadius: 'var(--radius-sm)',
                              border: active ? `1.5px solid ${colors[opt]}` : '1.5px solid var(--border)',
                              backgroundColor: active ? bgs[opt] : 'transparent',
                              color: active ? colors[opt] : 'var(--muted-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button onClick={() => save.mutate(true)} disabled={save.isPending || submitDraft.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                <CheckCircle2 style={{ width: 15, height: 15, marginRight: 6 }} />
                Submit attendance
              </Button>
              <Button variant="outline" disabled={save.isPending || submitDraft.isPending} onClick={() => save.mutate(false)}>
                Save draft
              </Button>
              <Button variant="ghost" disabled={save.isPending || submitDraft.isPending} onClick={resetSession}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!sessionActive && (
          <div className="flex flex-col items-center justify-center py-12 text-center mb-6">
            <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <ClipboardList style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
            </div>
            <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No active session</p>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
              Click Start session for a new roll call, or use Edit on a draft or editable record in history.
            </p>
          </div>
        )}

        <div>
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Attendance History</h2>
          <HistoryTable
            sessions={sessions}
            loading={isPending}
            loadingEditId={loadingEditId}
            onView={setViewSessionId}
            onEdit={openSessionForEdit}
            onDelete={setDeleteSession}
            onSubmitDraft={(session) => submitDraft.mutate(session)}
            submittingDraftId={submitDraft.isPending ? submitDraft.variables?.id ?? null : null}
          />
        </div>
      </div>

      <Sheet open={viewSessionId !== null} onOpenChange={(open) => { if (!open) setViewSessionId(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {viewSessionId && (
            <SessionDetailSheet
              sessionId={viewSessionId}
              onClose={() => setViewSessionId(null)}
              onEdit={(session) => {
                setViewSessionId(null)
                void openSessionForEdit(session)
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={Boolean(deleteSession)}
        onOpenChange={(open) => { if (!open) setDeleteSession(null) }}
        title="Delete attendance session?"
        tone="destructive"
        headline="This cannot be undone"
        summary={deleteSession
          ? `${deleteSession.topic ?? 'Session'} on ${formatDateShort(deleteSession.sessionDate)} will be permanently removed.`
          : ''}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => { if (deleteSession) void remove.mutate(deleteSession.id) }}
        loading={remove.isPending}
      />
    </LecturerShell>
  )
}

function statusBadge(status: LecturerAttendanceSession['status']) {
  const isDraft = status === 'Draft'
  return (
    <span
      className="t-label px-2 py-0.5 inline-block whitespace-nowrap"
      style={{
        backgroundColor: isDraft ? 'var(--warning-bg)' : 'var(--success-bg)',
        color: isDraft ? 'var(--warning)' : 'var(--success)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {status}
    </span>
  )
}

const ACTION_ICON = { width: 15, height: 15 } as const
const LOCKED_TOOLTIP = 'This record is no longer editable'

function ActionTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactElement
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function SessionActionButton({
  label,
  onClick,
  disabled,
  tone = 'default',
  children,
}: {
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  tone?: 'default' | 'success' | 'brand' | 'danger'
  children: React.ReactNode
}) {
  const colors = {
    default: 'var(--foreground)',
    success: 'var(--success)',
    brand: 'var(--brand)',
    danger: 'var(--error)',
  }

  return (
    <ActionTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-45"
        style={{
          color: colors[tone],
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={onClick}
      >
        {children}
      </button>
    </ActionTooltip>
  )
}

function SessionLockedIndicator() {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (!pinned) return
    const dismiss = () => {
      setPinned(false)
      setOpen(false)
    }
    window.addEventListener('click', dismiss)
    return () => window.removeEventListener('click', dismiss)
  }, [pinned])

  return (
    <Tooltip
      open={open}
      delayDuration={0}
      onOpenChange={(next) => {
        if (!pinned) setOpen(next)
      }}
    >
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={LOCKED_TOOLTIP}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--muted)]"
          style={{
            color: 'var(--muted-foreground)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={(event) => {
            event.stopPropagation()
            if (pinned) {
              setPinned(false)
              setOpen(false)
              return
            }
            setPinned(true)
            setOpen(true)
          }}
        >
          <Lock style={ACTION_ICON} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{LOCKED_TOOLTIP}</TooltipContent>
    </Tooltip>
  )
}

function SessionRowActions({
  row,
  loadingEditId,
  submittingDraftId,
  onView,
  onEdit,
  onDelete,
  onSubmitDraft,
}: {
  row: LecturerAttendanceSession
  loadingEditId: string | null
  submittingDraftId: string | null
  onView: (id: string) => void
  onEdit: (session: LecturerAttendanceSession) => void
  onDelete: (session: LecturerAttendanceSession) => void
  onSubmitDraft: (session: LecturerAttendanceSession) => void
}) {
  return (
    <div
      className="flex flex-nowrap items-center justify-end gap-0.5"
      onClick={(event) => event.stopPropagation()}
    >
      <SessionActionButton label="View session" tone="success" onClick={() => onView(row.id)}>
        <Eye style={ACTION_ICON} />
      </SessionActionButton>
      {row.editable ? (
        <>
          <SessionActionButton
            label={loadingEditId === row.id ? 'Opening session…' : 'Edit session'}
            disabled={loadingEditId === row.id}
            onClick={() => { void onEdit(row) }}
          >
            <Pencil style={ACTION_ICON} />
          </SessionActionButton>
          {row.status === 'Draft' ? (
            <SessionActionButton
              label={submittingDraftId === row.id ? 'Submitting…' : 'Submit attendance'}
              tone="brand"
              disabled={submittingDraftId === row.id}
              onClick={() => onSubmitDraft(row)}
            >
              <CheckCircle2 style={ACTION_ICON} />
            </SessionActionButton>
          ) : null}
          <SessionActionButton label="Delete session" tone="danger" onClick={() => onDelete(row)}>
            <Trash2 style={ACTION_ICON} />
          </SessionActionButton>
        </>
      ) : (
        <SessionLockedIndicator />
      )}
    </div>
  )
}

function HistoryTable({
  sessions,
  loading,
  loadingEditId,
  onView,
  onEdit,
  onDelete,
  onSubmitDraft,
  submittingDraftId,
}: {
  sessions: LecturerAttendanceSession[]
  loading: boolean
  loadingEditId: string | null
  onView: (id: string) => void
  onEdit: (session: LecturerAttendanceSession) => void
  onDelete: (session: LecturerAttendanceSession) => void
  onSubmitDraft: (session: LecturerAttendanceSession) => void
  submittingDraftId: string | null
}) {
  const columns = useMemo<DataTableColumn<LecturerAttendanceSession>[]>(() => [
    {
      id: 'date',
      header: 'DATE',
      sortable: true,
      sortValue: (row) => row.sessionDate,
      value: (row) => formatDateShort(row.sessionDate),
      cell: (row) => (
        <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
          {formatDateShort(row.sessionDate)}
        </span>
      ),
    },
    {
      id: 'topic',
      header: 'TOPIC',
      sortable: true,
      value: (row) => row.topic ?? 'Class session',
      cell: (row) => (
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{row.topic ?? 'Class session'}</span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      sortable: true,
      sortValue: (row) => row.status,
      value: (row) => row.status,
      cell: (row) => statusBadge(row.status),
    },
    {
      id: 'present',
      header: 'PRESENT',
      sortable: true,
      sortValue: (row) => (row.total ? (row.present + row.late) / row.total : 0),
      value: (row) => `${row.present + row.late} / ${row.total}`,
      cell: (row) => (
        <span className="text-sm whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
          {row.present + row.late} / {row.total}
        </span>
      ),
    },
    {
      id: 'rate',
      header: 'RATE',
      sortable: true,
      sortValue: (row) => (row.total ? Math.round(((row.present + row.late) / row.total) * 100) : 0),
      cell: (row) => {
        const pct = row.total ? Math.round(((row.present + row.late) / row.total) * 100) : 0
        return (
          <span
            className="t-label px-2 py-0.5 inline-block whitespace-nowrap"
            style={{
              backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: pct >= 80 ? 'var(--success)' : 'var(--warning)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {pct}%
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      headerClassName: 'w-[9.5rem]',
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <SessionRowActions
          row={row}
          loadingEditId={loadingEditId}
          submittingDraftId={submittingDraftId}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubmitDraft={onSubmitDraft}
        />
      ),
    },
  ], [loadingEditId, onDelete, onEdit, onSubmitDraft, onView, submittingDraftId])

  if (loading) {
    return (
      <div
        className="py-10 text-center"
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Loading sessions…</p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <DataTable
        columns={columns}
        rows={sessions}
        rowKey={(row) => row.id}
        searchPlaceholder="Search by topic, date or status…"
        searchFilter={(row, query) => {
          const haystack = `${formatDateShort(row.sessionDate)} ${row.topic ?? ''} ${row.status}`.toLowerCase()
          return haystack.includes(query)
        }}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        empty="No sessions recorded yet."
        onRowClick={(row) => onView(row.id)}
      />
    </TooltipProvider>
  )
}

function SessionDetailSheet({
  sessionId,
  onClose,
  onEdit,
}: {
  sessionId: string
  onClose: () => void
  onEdit: (session: LecturerAttendanceSession) => void
}) {
  const { data, isPending, error } = useQuery({
    queryKey: lecturerAttendanceSessionQueryKey(sessionId),
    queryFn: () => getLecturerAttendanceSession(sessionId),
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>ATTENDANCE SESSION</p>
        <div className="flex flex-wrap items-center gap-2">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>{data?.topic ?? 'Session'}</h3>
          {data ? statusBadge(data.status) : null}
        </div>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {data ? `${data.courseCode} · Session ${data.sessionNumber} · ${formatDateShort(data.sessionDate)}` : '…'}
        </p>
      </div>
      <div style={{ padding: '20px 24px', flex: 1 }}>
        {isPending ? <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body-sm" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load this session.')}</p> : null}
        {data ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present: {data.present}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>Late: {data.late}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Absent: {data.absent}</span>
            </div>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {data.records.map((s, i) => (
                <div key={s.studentId} className="flex items-center gap-4 px-4" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < data.records.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)', width: 120, flexShrink: 0 }}>{s.studentNumber}</span>
                  <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                  <span className="t-label px-2 py-0.5" style={{ backgroundColor: s.status === 'Present' ? 'var(--success-bg)' : s.status === 'Late' ? 'var(--warning-bg)' : 'var(--error-bg)', color: s.status === 'Present' ? 'var(--success)' : s.status === 'Late' ? 'var(--warning)' : 'var(--error)', borderRadius: 'var(--radius-sm)' }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 px-6 pb-7 flex-shrink-0">
        {data?.editable ? (
          <Button
            className="w-full"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            onClick={() => onEdit(data)}
          >
            Edit session
          </Button>
        ) : null}
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
