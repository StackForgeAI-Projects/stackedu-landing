import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Users, ChevronRight, Search, Plus, ExternalLink, Download, Pencil, Trash2, Upload } from 'lucide-react'
import type { LecturerCourseDetail, LecturerCourseMaterial, LecturerCourseRow } from '@stackedu/shared'
import {
  COURSE_MATERIAL_ACCEPT,
  COURSE_MATERIAL_MAX_BYTES,
  formatMaterialFileSize,
  materialSourceLabel,
} from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { CourseCodePill } from '@/components/CourseCodePill'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { DataTable } from '@/components/DataTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateShort } from '@/lib/utils'
import { toast } from 'sonner'
import {
  createLecturerMaterial,
  deleteLecturerMaterial,
  getLecturerCourse,
  getLecturerMaterialDownloadUrl,
  lecturerCourseQueryKey,
  listLecturerCourses,
  lecturerCoursesQueryKey,
  updateLecturerMaterial,
  uploadLecturerMaterialFile,
} from '@/lib/api/lecturer'
import { gradeColor } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/courses')({
  component: MyCoursesPage,
})

function MyCoursesPage() {
  const { data: courses = [], isPending, error } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [selectedId, setSelectedId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId && courses[0]) setSelectedId(courses[0].offeringId)
  }, [courses, selectedId])

  const selected = courses.find((c) => c.offeringId === selectedId) ?? null
  const { data: detail } = useQuery({
    queryKey: lecturerCourseQueryKey(selectedId),
    queryFn: () => getLecturerCourse(selectedId),
    enabled: Boolean(selectedId),
  })
  const activeStudent = detail?.students.find((s) => s.studentId === activeStudentId) ?? null

  return (
    <LecturerShell pageTitle="My Courses" guide="Courses assigned to you this semester, with the enrolled roster, materials and assessments.">
      {isPending ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading courses…</p>
      ) : error ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load courses.')}</p>
      ) : courses.length === 0 ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>No courses assigned this semester.</p>
      ) : (
        <div className="page-master animate-fade-up">
          <div className="page-master-list">
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', paddingLeft: 4 }}>My Courses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courses.map((course) => (
                <CourseListCard
                  key={course.offeringId}
                  course={course}
                  active={selectedId === course.offeringId}
                  onClick={() => { setSelectedId(course.offeringId); setActiveStudentId(null); setStudentSearch('') }}
                />
              ))}
            </div>
          </div>
          <div className="page-master-detail">
            {selected && (
              <CourseDetail
                course={selected}
                detail={detail}
                studentSearch={studentSearch}
                onStudentSearchChange={setStudentSearch}
                onStudentClick={setActiveStudentId}
              />
            )}
          </div>
        </div>
      )}

      <Sheet open={activeStudent !== null} onOpenChange={(open) => { if (!open) setActiveStudentId(null) }}>
        <SheetContent side="right" className="p-0 overflow-hidden flex flex-col sheet-md">
          {activeStudent && selected && (
            <StudentSheet student={activeStudent} course={selected} onClose={() => setActiveStudentId(null)} />
          )}
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function CourseListCard({ course, active, onClick }: { course: LecturerCourseRow; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: active ? 'rgba(15, 189, 59,0.06)' : hovered ? 'var(--muted)' : 'var(--card)',
        border: active ? '1px solid rgba(15, 189, 59,0.2)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '14px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: hovered && !active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <CourseCodePill code={course.code} color={course.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: active ? 'var(--brand)' : 'var(--foreground)' }}>{course.name}</p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{course.enrolledCount} students · {course.credits} credits</p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Next: {course.nextClassShort}</p>
      </div>
      <ChevronRight style={{ width: 15, height: 15, color: active ? 'var(--brand)' : 'var(--muted-foreground)', flexShrink: 0 }} />
    </div>
  )
}

function CourseDetail({
  course,
  detail,
  studentSearch,
  onStudentSearchChange,
  onStudentClick,
}: {
  course: LecturerCourseRow
  detail: LecturerCourseDetail | undefined
  studentSearch: string
  onStudentSearchChange: (q: string) => void
  onStudentClick: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const [materialOpen, setMaterialOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<LecturerCourseMaterial | null>(null)
  const students = detail?.students ?? []
  const filtered = students.filter((s) =>
    !studentSearch
    || s.name.toLowerCase().includes(studentSearch.toLowerCase())
    || s.studentNumber.toLowerCase().includes(studentSearch.toLowerCase()),
  )
  const avg = students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) / students.length)
    : 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CourseCodePill code={course.code} color={course.color} size="md" />
          <div>
            <h1 className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{course.name}</h1>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{course.semesterName} · {course.credits} credits</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {course.schedule.map((slot, i) => (
            <span key={i} className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              {slot.day} · {slot.time} · {slot.room}
            </span>
          ))}
          <span className="meta-stat t-caption" style={{ color: 'var(--muted-foreground)' }}>
            <Users className="meta-stat__icon" aria-hidden />
            <span>{course.enrolledCount} students</span>
          </span>
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-5">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="mb-4 flex items-center gap-2" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', height: 38 }}>
            <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input type="text" placeholder="Search students…" value={studentSearch} onChange={(e) => onStudentSearchChange(e.target.value)} className="flex-1 bg-transparent outline-none" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }} />
          </div>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <p className="t-body-sm px-5 py-8" style={{ color: 'var(--muted-foreground)' }}>No enrolled students yet.</p>
            ) : filtered.map((s, i) => {
              const gc = gradeColor(s.lastGrade ?? '—')
              return (
                <button
                  key={s.studentId}
                  type="button"
                  className="w-full text-left flex flex-col sm:grid sm:items-center px-5 gap-1"
                  style={{ gridTemplateColumns: '140px 1fr 110px 70px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: 'transparent', cursor: 'pointer' }}
                  onClick={() => onStudentClick(s.studentId)}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.attendanceRate != null ? `${s.attendanceRate}%` : '—'}</span>
                  <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{s.lastGrade ?? '—'}</span>
                  <span className="t-caption" style={{ color: 'var(--success)' }}>View →</span>
                </button>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
              Manage reading materials for this course. Assignments are created from the Assignments page.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => { setEditingMaterial(null); setMaterialOpen(true) }}
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}
              >
                <Plus style={{ width: 14, height: 14 }} /> Add material
              </Button>
              <Link to="/lecturer/assignments">
                <Button type="button" variant="outline" className="gap-1.5">
                  Create assignment <ExternalLink style={{ width: 13, height: 13 }} />
                </Button>
              </Link>
            </div>
          </div>

          <DataTable
            rows={detail?.materials ?? []}
            rowKey={(row) => row.id}
            searchPlaceholder="Search materials by title, module or description…"
            searchFilter={(row, query) =>
              row.title.toLowerCase().includes(query)
              || (row.moduleName ?? '').toLowerCase().includes(query)
              || (row.description ?? '').toLowerCase().includes(query)
            }
            filters={[
              {
                id: 'module',
                label: 'Module',
                getValue: (row) => row.moduleName?.trim() || 'General',
                allLabel: 'All modules',
              },
              {
                id: 'status',
                label: 'Status',
                options: [
                  { label: 'Published', value: 'Published' },
                  { label: 'Draft', value: 'Draft' },
                ],
                getValue: (row) => (row.isPublished ? 'Published' : 'Draft'),
              },
              {
                id: 'type',
                label: 'Type',
                options: [
                  { label: 'File', value: 'File' },
                  { label: 'Link', value: 'Link' },
                  { label: 'Notes', value: 'Notes' },
                ],
                getValue: (row) => materialSourceLabel(row),
              },
            ]}
            empty="No course materials yet. Add your first reading note or upload a file."
            defaultPageSize={10}
            columns={[
              {
                id: 'title',
                header: 'Title',
                value: (row) => row.title,
                cell: (row) => (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.title}</p>
                    {row.description ? (
                      <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.description}</p>
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'module',
                header: 'Module',
                value: (row) => row.moduleName ?? 'General',
                cell: (row) => <span className="t-caption">{row.moduleName ?? 'General'}</span>,
              },
              {
                id: 'type',
                header: 'Type',
                value: (row) => materialSourceLabel(row),
                cell: (row) => <span className="t-label">{materialSourceLabel(row)}</span>,
              },
              {
                id: 'file',
                header: 'File',
                value: (row) => row.fileName ?? '',
                cell: (row) => (
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                    {row.fileName ? `${row.fileName} · ${formatMaterialFileSize(row.fileSizeBytes)}` : '—'}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                value: (row) => (row.isPublished ? 'Published' : 'Draft'),
                cell: (row) => (
                  <span
                    className="t-label px-2 py-0.5"
                    style={{
                      backgroundColor: row.isPublished ? 'var(--success-bg)' : 'var(--muted)',
                      color: row.isPublished ? 'var(--success)' : 'var(--muted-foreground)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {row.isPublished ? 'Published' : 'Draft'}
                  </span>
                ),
              },
              {
                id: 'added',
                header: 'Added',
                value: (row) => row.createdAt,
                cell: (row) => <span className="t-caption">{formatDateShort(row.createdAt)}</span>,
              },
              {
                id: 'actions',
                header: '',
                className: 'text-right',
                cell: (row) => (
                  <MaterialRowActions
                    material={row}
                    onEdit={() => { setEditingMaterial(row); setMaterialOpen(true) }}
                    onChanged={async () => {
                      await queryClient.invalidateQueries({ queryKey: lecturerCourseQueryKey(course.offeringId) })
                    }}
                  />
                ),
              },
            ]}
          />

          {(detail?.assessments ?? []).length > 0 ? (
            <div className="mt-8">
              <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Published assignments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(detail?.assessments ?? []).map((a) => (
                  <div key={a.id} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '14px 16px' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{a.title}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{a.type} · {a.weight}% · {a.totalMarks} marks</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
              <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>AVERAGE ATTENDANCE</p>
              <p className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{avg}%</p>
            </div>
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
              <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>ENROLLED</p>
              <p className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{students.length}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={materialOpen} onOpenChange={(open) => { setMaterialOpen(open); if (!open) setEditingMaterial(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          <MaterialForm
            offeringId={course.offeringId}
            material={editingMaterial}
            onClose={() => { setMaterialOpen(false); setEditingMaterial(null) }}
            onSuccess={async () => {
              await queryClient.invalidateQueries({ queryKey: lecturerCourseQueryKey(course.offeringId) })
              setMaterialOpen(false)
              setEditingMaterial(null)
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TableIconButton({
  label,
  onClick,
  icon: Icon,
  danger,
}: {
  label: string
  onClick?: () => void
  icon: typeof Pencil
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
      style={{
        border: '1px solid var(--border)',
        color: danger ? 'var(--error)' : 'var(--muted-foreground)',
        cursor: 'pointer',
        background: 'transparent',
      }}
    >
      <Icon style={{ width: 12, height: 12 }} />
    </button>
  )
}

function MaterialRowActions({
  material,
  onEdit,
  onChanged,
}: {
  material: LecturerCourseMaterial
  onEdit: () => void
  onChanged: () => Promise<void>
}) {
  const deleteMutation = useMutation({
    mutationFn: () => deleteLecturerMaterial(material.id),
    onSuccess: async () => {
      toast.success(`"${material.title}" removed.`)
      await onChanged()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that material.')),
  })

  const download = async () => {
    try {
      const target = await getLecturerMaterialDownloadUrl(material.id)
      window.open(target.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open that file.'))
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 flex-nowrap">
      {material.fileKey ? (
        <TableIconButton label="Open file" icon={Download} onClick={download} />
      ) : null}
      <TableIconButton label="Edit" icon={Pencil} onClick={onEdit} />
      <ConfirmAlertDialog
        trigger={<TableIconButton label="Delete" icon={Trash2} danger />}
        title="Delete this material?"
        tone="destructive"
        headlineLabel="Action"
        headline="Delete course material"
        summary={`"${material.title}" will be removed from the course content list.`}
        notices={[
          { icon: 'trash', label: 'Students will no longer see this material in the portal.' },
          { icon: 'file', label: material.fileKey ? 'Any uploaded file will also be removed from storage.' : 'This action cannot be undone.' },
        ]}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}

function MaterialForm({
  offeringId,
  material,
  onClose,
  onSuccess,
}: {
  offeringId: string
  material: LecturerCourseMaterial | null
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const isEdit = material !== null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(material?.title ?? '')
  const [moduleName, setModuleName] = useState(material?.moduleName ?? '')
  const [description, setDescription] = useState(material?.description ?? '')
  const [externalUrl, setExternalUrl] = useState(material?.externalUrl ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(material?.title ?? '')
    setModuleName(material?.moduleName ?? '')
    setDescription(material?.description ?? '')
    setExternalUrl(material?.externalUrl ?? '')
    setSelectedFile(null)
    setRemoveFile(false)
  }, [material])

  const currentFileLabel = selectedFile?.name ?? (removeFile ? null : material?.fileName ?? null)

  const saveMaterial = async () => {
    if (title.trim().length < 2) return
    if (selectedFile && selectedFile.size > COURSE_MATERIAL_MAX_BYTES) {
      toast.error('The file must be 10 MB or smaller.')
      return
    }

    setSaving(true)
    try {
      let filePayload: { fileKey: string; mimeType: string; fileSizeBytes: number } | undefined
      if (selectedFile) {
        filePayload = await uploadLecturerMaterialFile({ offeringId, file: selectedFile })
      }

      if (isEdit && material) {
        await updateLecturerMaterial(material.id, {
          title: title.trim(),
          moduleName: moduleName.trim() || undefined,
          description: description.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
          ...(filePayload
            ? {
                fileKey: filePayload.fileKey,
                fileName: selectedFile!.name,
                mimeType: filePayload.mimeType,
                fileSizeBytes: filePayload.fileSizeBytes,
              }
            : {}),
          ...(removeFile && !selectedFile ? { clearFile: true } : {}),
          publish: true,
        })
        toast.success(`Material "${title.trim()}" updated.`)
      } else {
        await createLecturerMaterial({
          offeringId,
          title: title.trim(),
          moduleName: moduleName.trim() || undefined,
          description: description.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
          ...(filePayload
            ? {
                fileKey: filePayload.fileKey,
                fileName: selectedFile!.name,
                mimeType: filePayload.mimeType,
                fileSizeBytes: filePayload.fileSizeBytes,
              }
            : {}),
          publish: true,
        })
        toast.success(`Material "${title.trim()}" published.`)
      }
      await onSuccess()
    } catch (err) {
      toast.error(apiErrorMessage(err, isEdit ? 'Could not update that material.' : 'Could not publish that material.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {isEdit ? 'Edit course material' : 'Add course material'}
        </h3>
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Published materials appear here and in the student portal. File upload is optional.
        </p>
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 1 lecture slides" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Module / week (optional)</label>
          <Input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="e.g. Week 1" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Description (optional)</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief note for students…" rows={3} />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Link URL (optional)</label>
          <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" type="url" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>File (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={COURSE_MATERIAL_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setSelectedFile(file)
              if (file) setRemoveFile(false)
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed px-4 py-5 text-left transition-colors hover:bg-[var(--muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, backgroundColor: 'rgba(15, 189, 59, 0.08)' }}>
                <Upload style={{ width: 16, height: 16, color: 'var(--brand)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {currentFileLabel ?? 'Upload PDF, Word document, or image'}
                </p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Max 10 MB · PDF, DOCX, DOC, PNG, JPG, WEBP, GIF
                </p>
              </div>
            </div>
          </button>
          {material?.fileKey && !selectedFile && !removeFile ? (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setRemoveFile(true)}>
              Remove current file
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <ConfirmAlertDialog
            trigger={
              <Button
                type="button"
                disabled={title.trim().length < 2 || saving}
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish material'}
              </Button>
            }
            title={isEdit ? 'Save these changes?' : 'Publish this material?'}
            tone="success"
            headlineLabel="Action"
            headline={isEdit ? 'Update course material' : 'Publish course material'}
            summary={isEdit
              ? `Students will see the updated version of "${title.trim() || material?.title}".`
              : `"${title.trim()}" will be published to this course.`}
            notices={[
              { icon: 'user', label: 'Enrolled students can access published materials in their portal.' },
              { icon: 'file', label: selectedFile ? `File "${selectedFile.name}" will be uploaded.` : 'Only the details you entered will be published.' },
            ]}
            confirmLabel={isEdit ? 'Save changes' : 'Publish'}
            confirmVariant="brand"
            loading={saving}
            onConfirm={saveMaterial}
          />
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

function StudentSheet({
  student,
  course,
  onClose,
}: {
  student: LecturerCourseDetail['students'][number]
  course: LecturerCourseRow
  onClose: () => void
}) {
  const gc = gradeColor(student.lastGrade ?? '—')
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{course.code}</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>{student.name}</h3>
        <p className="t-caption mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{student.studentNumber}</p>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Attendance: {student.attendanceRate != null ? `${student.attendanceRate}%` : '—'}</p>
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
          Course grade: <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{student.lastGrade ?? '—'}</span>
        </p>
        {student.riskLevel ? (
          <p className="t-body-sm" style={{ color: 'var(--error)' }}>Risk: {student.riskLevel}</p>
        ) : null}
      </div>
      <div style={{ padding: '0 24px 28px' }}>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
