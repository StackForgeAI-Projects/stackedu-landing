import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { AcademicCourseRow } from '@stackedu/shared'
import { Pencil, Archive, Plus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import {
  academicCoursesQueryKey,
  academicLecturersQueryKey,
  createAcademicCourse,
  listAcademicCourses,
  listAcademicLecturers,
  updateAcademicCourse,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/academic/courses')({
  component: CoursesCataloguePage,
})

type CourseFormData = {
  code: string
  name: string
  department: string
  credits: number
  type: 'Compulsory' | 'Elective'
  description: string
  prerequisites: string[]
  lecturer: string
  status: 'Active' | 'Inactive'
}

function defaultDepartment(courses: AcademicCourseRow[]): string {
  return courses[0]?.department ?? 'Computer Science'
}

function blankForm(courses: AcademicCourseRow[]): CourseFormData {
  return {
    code: '',
    name: '',
    department: defaultDepartment(courses),
    credits: 3,
    type: 'Compulsory',
    description: '',
    prerequisites: [],
    lecturer: '',
    status: 'Active',
  }
}

function yearOfStudyForType(type: 'Compulsory' | 'Elective'): number {
  return type === 'Compulsory' ? 1 : 2
}

function CoursesCataloguePage() {
  const queryClient = useQueryClient()
  const coursesQuery = useQuery({ queryKey: academicCoursesQueryKey, queryFn: listAcademicCourses })
  const lecturersQuery = useQuery({ queryKey: academicLecturersQueryKey, queryFn: listAcademicLecturers })

  const courses = coursesQuery.data ?? []
  const lecturers = lecturersQuery.data ?? []

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicCourseRow | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AcademicCourseRow | null>(null)
  const [form, setForm] = useState<CourseFormData>(() => blankForm([]))
  const [prereqInput, setPrereqInput] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() && !editing) throw new Error('Course code is required.')
      if (!form.name.trim()) throw new Error('Course name is required.')
      if (!form.credits || form.credits < 1) throw new Error('Credits must be at least 1.')

      const yearOfStudy = yearOfStudyForType(form.type)
      const prerequisiteCodes = form.prerequisites.filter(Boolean)

      if (editing) {
        return updateAcademicCourse(editing.id, {
          name: form.name.trim(),
          credits: form.credits,
          yearOfStudy,
          description: form.description.trim() || null,
          isActive: form.status === 'Active',
          prerequisiteCodes,
        })
      }

      return createAcademicCourse({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        departmentName: form.department.trim(),
        credits: form.credits,
        yearOfStudy,
        description: form.description.trim() || undefined,
        prerequisiteCodes: prerequisiteCodes.length > 0 ? prerequisiteCodes : undefined,
      })
    },
    onSuccess: async () => {
      toast.success(editing ? 'Course updated.' : 'Course created.')
      setSheetOpen(false)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save course.')),
  })

  const archiveMutation = useMutation({
    mutationFn: (course: AcademicCourseRow) => updateAcademicCourse(course.id, { isActive: false }),
    onSuccess: async () => {
      toast.success('Course archived.')
      setArchiveTarget(null)
      await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not archive course.')),
  })

  const openAdd = () => {
    setEditing(null)
    setForm(blankForm(courses))
    setPrereqInput('')
    setSheetOpen(true)
  }

  const openEdit = (c: AcademicCourseRow) => {
    setEditing(c)
    setForm({
      code: c.code,
      name: c.name,
      department: c.department,
      credits: c.credits,
      type: c.type,
      description: c.description ?? '',
      prerequisites: c.prerequisites,
      lecturer: c.lecturerName ?? '',
      status: c.status === 'Active' ? 'Active' : 'Inactive',
    })
    setPrereqInput('')
    setSheetOpen(true)
  }

  const addPrerequisite = () => {
    const code = prereqInput.trim().toUpperCase()
    if (!code || form.prerequisites.includes(code)) return
    setForm((f) => ({ ...f, prerequisites: [...f.prerequisites, code] }))
    setPrereqInput('')
  }

  const removePrerequisite = (code: string) => {
    setForm((f) => ({ ...f, prerequisites: f.prerequisites.filter((p) => p !== code) }))
  }

  const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  return (
    <AcademicShell pageTitle="Courses">
      <div className="page-body animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Course Catalogue</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {coursesQuery.isPending ? 'Loading…' : `${courses.filter((c) => c.status === 'Active').length} active courses`}
            </p>
          </div>
          <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
            <Plus style={{ width: 15, height: 15 }} />Add course
          </button>
        </div>

        {coursesQuery.error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(coursesQuery.error, 'Could not load courses.')}</p>
        ) : null}

        <DataTable
          rows={courses}
          rowKey={(c) => c.id}
          searchPlaceholder="Search course name or code…"
          searchFilter={(c, query) => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)}
          filters={[
            { id: 'department', label: 'departments', getValue: (c) => c.department },
            { id: 'status', label: 'statuses', getValue: (c) => c.status },
          ]}
          empty={coursesQuery.isPending ? 'Loading courses…' : 'No courses found'}
          defaultPageSize={10}
          columns={[
            { id: 'code', header: 'Code', value: (c) => c.code, cell: (c) => <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{c.code}</span> },
            { id: 'name', header: 'Course Name', value: (c) => c.name, cell: (c) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)', minWidth: 200, display: 'inline-block' }}>{c.name}</span> },
            { id: 'department', header: 'Department', value: (c) => c.department, cell: (c) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{c.department}</span> },
            { id: 'credits', header: 'Credits', value: (c) => c.credits, cell: (c) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.credits}</span> },
            {
              id: 'type', header: 'Type', value: (c) => c.type,
              cell: (c) => {
                const typeColors = c.type === 'Compulsory'
                  ? { bg: 'var(--info-bg)', color: 'var(--info)' }
                  : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: typeColors.bg, color: typeColors.color, borderRadius: 'var(--radius-sm)' }}>{c.type}</span>
              },
            },
            { id: 'lecturer', header: 'Assigned Lecturer', value: (c) => c.lecturerName ?? '', cell: (c) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{c.lecturerName ?? '—'}</span> },
            { id: 'enrolled', header: 'Enrolled', value: (c) => c.enrolled, cell: (c) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.enrolled}</span> },
            {
              id: 'status', header: 'Status', value: (c) => c.status,
              cell: (c) => {
                const statusColors = c.status === 'Active'
                  ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                  : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: statusColors.bg, color: statusColors.color, borderRadius: 'var(--radius-sm)' }}>{c.status}</span>
              },
            },
            {
              id: 'actions', header: '', className: 'text-right',
              cell: (c) => (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(c)} title="Edit" className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', cursor: 'pointer', background: 'transparent' }}>
                    <Pencil style={{ width: 12, height: 12 }} />
                  </button>
                  {c.status === 'Active' ? (
                    <button type="button" onClick={() => setArchiveTarget(c)} title="Archive" className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', cursor: 'pointer', background: 'transparent' }}>
                      <Archive style={{ width: 12, height: 12 }} />
                    </button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmAlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title={`Archive ${archiveTarget?.code}?`}
        tone="warning"
        headlineLabel="Action"
        headline="Archive course"
        summary="This will mark the course as inactive."
        notices={[
          { icon: 'archive', label: 'Students already enrolled will remain on record.' },
          { icon: 'info', label: 'The course will no longer appear as active for new registrations.' },
        ]}
        confirmLabel={archiveMutation.isPending ? 'Archiving…' : 'Archive'}
        confirmVariant="warning"
        loading={archiveMutation.isPending}
        onConfirm={() => { if (archiveTarget) archiveMutation.mutate(archiveTarget) }}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editing ? `Edit Course — ${editing.code}` : 'Add Course'}
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Course Code">
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  readOnly={!!editing}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={{ ...inputStyle, backgroundColor: editing ? 'var(--muted)' : 'var(--background)' }}
                  placeholder="CSC101"
                />
              </FormField>
              <FormField label="Credit Units">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.credits}
                  onChange={(e) => setForm((f) => ({ ...f, credits: Number.parseInt(e.target.value, 10) || 0 }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                />
              </FormField>
            </div>
            <FormField label="Course Name" className="mb-4">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
                placeholder="Introduction to Programming"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Department">
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  readOnly={!!editing}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={{ ...inputStyle, backgroundColor: editing ? 'var(--muted)' : 'var(--background)' }}
                />
              </FormField>
              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'Compulsory' | 'Elective' }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                >
                  <option value="Compulsory">Compulsory</option>
                  <option value="Elective">Elective</option>
                </select>
              </FormField>
            </div>
            <FormField label="Description" className="mb-4">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={inputStyle}
                placeholder="Optional course description"
              />
            </FormField>
            <FormField label="Prerequisites" className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  value={prereqInput}
                  onChange={(e) => setPrereqInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPrerequisite() } }}
                  className="flex-1 text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                  placeholder="Course code, press Enter"
                />
                <button type="button" onClick={addPrerequisite} className="px-3 h-9 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}>Add</button>
              </div>
              {form.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.prerequisites.map((code) => (
                    <span key={code} className="t-label px-2 py-1 flex items-center gap-1" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                      {code}
                      <button type="button" onClick={() => removePrerequisite(code)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 12, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No prerequisites</p>
              )}
            </FormField>
            <FormField label="Assigned Lecturer" className="mb-4">
              <select
                value={form.lecturer}
                onChange={(e) => setForm((f) => ({ ...f, lecturer: e.target.value }))}
                disabled
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={{ ...inputStyle, backgroundColor: 'var(--muted)' }}
                title="Lecturer assignment is managed separately"
              >
                <option value="">Select lecturer</option>
                {lecturers.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </FormField>
            {editing ? (
              <FormField label="Status" className="mb-8">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FormField>
            ) : (
              <div className="mb-8" />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', opacity: saveMutation.isPending ? 0.7 : 1 }}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AcademicShell>
  )
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
    </div>
  )
}
