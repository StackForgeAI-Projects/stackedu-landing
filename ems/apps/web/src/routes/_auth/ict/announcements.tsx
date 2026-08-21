import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import type { AnnouncementAudience, IctAnnouncement, UserRole } from '@stackedu/shared'
import { IctShell } from '@/components/IctShell'
import { AnnouncementBody, IctDialog, TableActionButton } from '@/components/ict/IctPanels'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createIctAnnouncement,
  getIctAnnouncements,
  getIctAudienceOptions,
  ictAnnouncementsQueryKey,
  ictAudienceOptionsQueryKey,
  ictNotificationsQueryKey,
  previewIctAnnouncement,
} from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/portals'
import { notifyError, notifySuccess } from '@/lib/notify'
import { formatDateTime } from '@/lib/utils'

export const Route = createFileRoute('/_auth/ict/announcements')({
  component: AnnouncementsPage,
})

const STAFF_ROLES: UserRole[] = ['AcademicAdmin', 'Lecturer', 'Bursar', 'Librarian', 'ICTManager']

function emptyAudience(): AnnouncementAudience {
  return {
    everyone: true,
    roles: [],
    includeEnrolledStudents: false,
    includeApplicants: false,
    departmentIds: [],
    yearsOfStudy: [],
  }
}

function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const announcements = useQuery({ queryKey: ictAnnouncementsQueryKey, queryFn: getIctAnnouncements })
  const options = useQuery({ queryKey: ictAudienceOptionsQueryKey, queryFn: getIctAudienceOptions })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [audience, setAudience] = useState<AnnouncementAudience>(emptyAudience)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [viewing, setViewing] = useState<IctAnnouncement | null>(null)

  const selectedStaff = audience.roles ?? []
  const studentOn = Boolean(audience.includeEnrolledStudents)
  const applicantsOn = Boolean(audience.includeApplicants)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const preview = await previewIctAnnouncement(audience)
        if (!cancelled) setPreviewCount(preview.recipientCount)
      } catch {
        if (!cancelled) setPreviewCount(null)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [audience])

  const mutation = useMutation({
    mutationFn: createIctAnnouncement,
    onSuccess: async (created) => {
      notifySuccess(
        created.recipientCount
          ? `Announcement published to ${created.recipientCount} ${created.recipientCount === 1 ? 'person' : 'people'}.`
          : 'Announcement published.',
      )
      setTitle('')
      setBody('')
      setPinned(false)
      setAudience(emptyAudience())
      await queryClient.invalidateQueries({ queryKey: ictAnnouncementsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ictNotificationsQueryKey })
    },
    onError: (err) => notifyError(apiErrorMessage(err, 'Could not publish that announcement.')),
  })

  const audienceSummary = useMemo(() => {
    if (audience.everyone) return 'Everyone with a StackEDU login'
    const parts: string[] = []
    if (selectedStaff.length) parts.push(selectedStaff.map((role) => roleLabel(role)).join(', '))
    if (studentOn) {
      const studentParts = ['Enrolled students']
      const deptNames = (audience.departmentIds ?? [])
        .map((id) => options.data?.departments.find((item) => item.id === id)?.name)
        .filter(Boolean)
      if (deptNames.length) studentParts.push(deptNames.join(', '))
      if (audience.yearsOfStudy?.length) studentParts.push(`Year ${audience.yearsOfStudy.join(', ')}`)
      parts.push(studentParts.join(' · '))
    }
    if (applicantsOn) parts.push('Applicants')
    return parts.join(' · ') || 'No one selected yet'
  }, [audience, applicantsOn, options.data, selectedStaff, studentOn])

  function setEveryone(everyone: boolean) {
    setAudience(everyone ? emptyAudience() : {
      everyone: false,
      roles: [],
      includeEnrolledStudents: false,
      includeApplicants: false,
      departmentIds: [],
      yearsOfStudy: [],
    })
  }

  function toggleStaff(role: UserRole, on: boolean) {
    setAudience((prev) => ({
      ...prev,
      everyone: false,
      roles: on ? [...(prev.roles ?? []).filter((item) => item !== role), role] : (prev.roles ?? []).filter((item) => item !== role),
    }))
  }

  return (
    <IctShell
      pageTitle="Announcements"
      guide="Publish a notice to a live audience: everyone, staff roles, enrolled students by department or year, or applicants. Recipients get an in-app notification. This does not send SMS or email."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Announcements</h1>
        <form
          className="mb-6 p-5 flex flex-col gap-5"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
          onSubmit={(event) => {
            event.preventDefault()
            if (!audience.everyone && !selectedStaff.length && !studentOn && !applicantsOn) {
              notifyError('Choose who should receive this announcement.')
              return
            }
            mutation.mutate({ title, body, audience, isPinned: pinned, publish: true })
          }}
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={4} value={body} onChange={(event) => setBody(event.target.value)} required />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Who should receive this?</p>
            <div
              className="inline-flex w-full sm:w-auto p-1 rounded-full mb-2"
              style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
              role="tablist"
              aria-label="Announcement audience"
            >
              <button
                type="button"
                role="tab"
                aria-selected={audience.everyone}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: audience.everyone ? 'var(--card)' : 'transparent',
                  color: 'var(--foreground)',
                  boxShadow: audience.everyone ? 'var(--shadow-sm)' : 'none',
                }}
                onClick={() => setEveryone(true)}
              >
                Everyone
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!audience.everyone}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: !audience.everyone ? 'var(--card)' : 'transparent',
                  color: 'var(--foreground)',
                  boxShadow: !audience.everyone ? 'var(--shadow-sm)' : 'none',
                }}
                onClick={() => setEveryone(false)}
              >
                Selected groups
              </button>
            </div>
            <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {audience.everyone
                ? options.data
                  ? `Sends to all ${options.data.totalUsers} active logins.`
                  : 'Sends to every active login.'
                : 'Choose staff roles, enrolled students, or applicants.'}
            </p>

            {audience.everyone ? null : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="p-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                  <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>Staff roles</p>
                  <div className="flex flex-col gap-2">
                    {STAFF_ROLES.map((role) => {
                      const count = options.data?.roles.find((item) => item.key === role)?.userCount ?? 0
                      return (
                        <label key={role} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedStaff.includes(role)}
                            onCheckedChange={(checked) => toggleStaff(role, Boolean(checked))}
                          />
                          <span className="flex-1">{roleLabel(role)}</span>
                          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{count}</span>
                        </label>
                      )
                    })}
                  </div>
                </section>

                <section className="p-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                  <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>Students and applicants</p>
                  <label className="flex items-center gap-2 text-sm mb-2">
                    <Checkbox
                      checked={studentOn}
                      onCheckedChange={(checked) => setAudience((prev) => ({
                        ...prev,
                        everyone: false,
                        includeEnrolledStudents: Boolean(checked),
                        departmentIds: checked ? prev.departmentIds : [],
                        yearsOfStudy: checked ? prev.yearsOfStudy : [],
                      }))}
                    />
                    <span className="flex-1">Enrolled students</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{options.data?.enrolledStudentCount ?? 0}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm mb-4">
                    <Checkbox
                      checked={applicantsOn}
                      onCheckedChange={(checked) => setAudience((prev) => ({
                        ...prev,
                        everyone: false,
                        includeApplicants: Boolean(checked),
                      }))}
                    />
                    <span className="flex-1">Applicants</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{options.data?.applicantCount ?? 0}</span>
                  </label>

                  {studentOn ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label className="mb-1.5 block">Departments</Label>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                          {(options.data?.departments ?? []).map((department) => {
                            const on = (audience.departmentIds ?? []).includes(department.id)
                            return (
                              <label key={department.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={on}
                                  onCheckedChange={(checked) => setAudience((prev) => ({
                                    ...prev,
                                    departmentIds: checked
                                      ? [...(prev.departmentIds ?? []), department.id]
                                      : (prev.departmentIds ?? []).filter((id) => id !== department.id),
                                  }))}
                                />
                                <span className="flex-1">{department.name}</span>
                                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{department.studentCount}</span>
                              </label>
                            )
                          })}
                        </div>
                        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>Leave empty to include every department.</p>
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Year of study</Label>
                        <div className="flex flex-wrap gap-2">
                          {(options.data?.years.length ? options.data.years : [1, 2, 3, 4].map((year) => ({ year, studentCount: 0 }))).map((item) => {
                            const on = (audience.yearsOfStudy ?? []).includes(item.year)
                            return (
                              <button
                                key={item.year}
                                type="button"
                                className="px-3 py-1.5 rounded-lg text-sm"
                                style={{
                                  border: '1px solid var(--border)',
                                  backgroundColor: on ? 'var(--brand)' : 'var(--background)',
                                  color: on ? 'var(--brand-ink)' : 'var(--foreground)',
                                }}
                                onClick={() => setAudience((prev) => ({
                                  ...prev,
                                  yearsOfStudy: on
                                    ? (prev.yearsOfStudy ?? []).filter((year) => year !== item.year)
                                    : [...(prev.yearsOfStudy ?? []), item.year],
                                }))}
                              >
                                Year {item.year}
                              </button>
                            )
                          })}
                        </div>
                        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>Leave empty to include every year.</p>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Switch id="pin-dashboards" checked={pinned} onCheckedChange={setPinned} className="mt-0.5" />
              <div>
                <label htmlFor="pin-dashboards" className="text-sm font-medium">Pin on student dashboards</label>
                <p className="t-caption flex items-start gap-1.5 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Keeps this notice at the top of student dashboards until you publish another pinned one.
                </p>
              </div>
            </div>
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              {audienceSummary}
              {previewCount == null ? '' : ` · ${previewCount} ${previewCount === 1 ? 'recipient' : 'recipients'}`}
            </p>
          </div>

          <Button type="submit" disabled={mutation.isPending || !title.trim() || !body.trim()}>
            {mutation.isPending ? 'Publishing…' : 'Publish'}
          </Button>
        </form>

        {announcements.isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading announcements…</p>
        ) : announcements.error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(announcements.error, 'Could not load announcements.')}</p>
        ) : (
          <DataTable
            rows={announcements.data ?? []}
            rowKey={(row) => row.id}
            searchPlaceholder="Search announcements…"
            searchFilter={(row, query) => `${row.title} ${row.body} ${row.audienceLabel}`.toLowerCase().includes(query)}
            empty="No announcements yet."
            columns={[
              { id: 'title', header: 'Title', value: (row) => row.title, cell: (row) => <span className="font-medium">{row.title}</span>, sortable: true },
              { id: 'audience', header: 'Audience', value: (row) => row.audienceLabel, cell: (row) => row.audienceLabel },
              {
                id: 'when',
                header: 'Published',
                value: (row) => row.publishedAt ?? '',
                sortValue: (row) => row.publishedAt ?? '',
                sortable: true,
                cell: (row) => row.publishedAt ? formatDateTime(row.publishedAt) : 'Draft',
              },
              { id: 'body', header: 'Message', value: (row) => row.body, cell: (row) => <span className="line-clamp-2">{row.body}</span> },
              {
                id: 'open',
                header: '',
                cell: (row) => <TableActionButton onClick={() => setViewing(row)}>View</TableActionButton>,
                className: 'text-right',
              },
            ]}
          />
        )}
      </div>

      <IctDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => { if (!open) setViewing(null) }}
        title={viewing?.title ?? 'Announcement'}
      >
        {viewing ? <AnnouncementBody item={viewing} /> : null}
      </IctDialog>
    </IctShell>
  )
}
