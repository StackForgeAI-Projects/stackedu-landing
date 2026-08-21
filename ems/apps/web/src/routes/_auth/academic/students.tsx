import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import { studentStatusColors } from '@/data/academic'
import {
  academicStudentsQueryKey,
  listAcademicStudents,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/academic/students')({
  component: StudentRegistryPage,
})

function StudentRegistryPage() {
  const { data, isPending, error } = useQuery({
    queryKey: academicStudentsQueryKey,
    queryFn: listAcademicStudents,
  })

  const students = data ?? []

  return (
    <AcademicShell pageTitle="Students">
      <div className="page-body animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Student Registry</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {isPending ? 'Loading…' : `${students.length} enrolled students`}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
          >
            <Download style={{ width: 14, height: 14 }} />Export
          </button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>
            {apiErrorMessage(error, 'Could not load students.')}
          </p>
        ) : null}

        <DataTable
          rows={students}
          rowKey={(s) => s.id}
          searchPlaceholder="Search name or student ID…"
          searchFilter={(s, query) =>
            s.fullName.toLowerCase().includes(query) || s.studentNumber.toLowerCase().includes(query)
          }
          filters={[
            { id: 'programme', label: 'programmes', getValue: (s) => s.programmeName },
            { id: 'year', label: 'years', getValue: (s) => `Year ${s.yearOfStudy}` },
            { id: 'status', label: 'statuses', getValue: (s) => s.status },
          ]}
          empty={isPending ? 'Loading students…' : 'No students found'}
          defaultPageSize={10}
          columns={[
            {
              id: 'id',
              header: 'Student ID',
              value: (s) => s.studentNumber,
              cell: (s) => (
                <Link to="/academic/student" search={{ id: s.studentNumber }} style={{ textDecoration: 'none' }}>
                  <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
                </Link>
              ),
            },
            {
              id: 'name',
              header: 'Name',
              value: (s) => s.fullName,
              cell: (s) => (
                <Link to="/academic/student" search={{ id: s.studentNumber }} style={{ textDecoration: 'none' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.fullName}</span>
                </Link>
              ),
            },
            {
              id: 'programme',
              header: 'Programme',
              value: (s) => s.programmeName,
              cell: (s) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{s.programmeName}</span>,
            },
            {
              id: 'year',
              header: 'Year',
              value: (s) => `Year ${s.yearOfStudy}`,
              cell: (s) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Year {s.yearOfStudy}</span>,
            },
            {
              id: 'enrolled',
              header: 'Enrollment Date',
              value: (s) => formatDateShort(s.enrollmentDate),
              cell: (s) => <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{formatDateShort(s.enrollmentDate)}</span>,
            },
            {
              id: 'status',
              header: 'Status',
              value: (s) => s.status,
              cell: (s) => {
                const sc = studentStatusColors(s.status as Parameters<typeof studentStatusColors>[0])
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{s.status}</span>
              },
            },
          ]}
        />
      </div>
    </AcademicShell>
  )
}
