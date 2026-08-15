import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, BURSAR_STUDENTS, statusColors,
} from '@/data/bursar'
import { toast } from 'sonner'
import { Users, AlertCircle, Lock } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/student-accounts')({
  component: StudentAccountsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function StudentAccountsPage() {
  const navigate = useNavigate()

  const totalOutstanding = BURSAR_STUDENTS.reduce((s, st) => s + st.outstanding, 0)
  const holdCount        = BURSAR_STUDENTS.filter((s) => s.hasHold).length
  const paidCount        = BURSAR_STUDENTS.filter((s) => s.status === 'Paid').length

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Student Accounts"
      userName={BURSAR.fullName}
      userRole="Bursar"
      userInitials={BURSAR.initials}
      unreadCount={2}
      infoCardLabel="BURSAR"
      infoCardValue={BURSAR.institution}
      infoCardSubtext="Finance Office"
    >
      <div className="page-scroll">
        <div className="page-body animate-fade-up">

          {/* Section header */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1
                className="t-h1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
              >
                Student Accounts
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                View and manage fee accounts for all enrolled students
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast.success('Export started. CSV will download shortly.')}
            >
              <Download style={{ width: 14, height: 14 }} />
              Export
            </Button>
          </div>

          {/* StatTiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatTile
              icon={Users}
              iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)"
              label="TOTAL STUDENTS"
              value={String(BURSAR_STUDENTS.length)}
              delta={`${paidCount} fully paid`}
              deltaColor="var(--success)"
              animationDelay={0}
            />
            <StatTile
              icon={AlertCircle}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="TOTAL OUTSTANDING"
              value={formatCurrency(totalOutstanding)}
              delta="Across all students"
              deltaColor="var(--warning)"
              animationDelay={60}
            />
            <StatTile
              icon={Lock}
              iconColor="var(--error)" iconBg="var(--error-bg)"
              label="FEE HOLDS ACTIVE"
              value={String(holdCount)}
              delta="Students blocked"
              deltaColor="var(--error)"
              animationDelay={120}
            />
          </div>

          <DataTable
            rows={BURSAR_STUDENTS}
            rowKey={(student) => student.id}
            searchPlaceholder="Search by name or ID…"
            searchFilter={(s, query) =>
              s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
            }
            filters={[
              { id: 'programme', label: 'programmes', getValue: (s) => s.programme },
              { id: 'status', label: 'statuses', getValue: (s) => s.status },
            ]}
            empty="No students match the selected filters."
            defaultPageSize={10}
            onRowClick={(student) => navigate({ to: '/bursar/student-account', search: { id: student.id } })}
            columns={[
              {
                id: 'id',
                header: 'Student ID',
                value: (student) => student.id,
                cell: (student) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{student.id}</span>,
              },
              {
                id: 'name',
                header: 'Name',
                value: (student) => student.name,
                cell: (student) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{student.name}</span>,
              },
              {
                id: 'programme',
                header: 'Programme',
                value: (student) => student.programme,
                cell: (student) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{student.programme}</span>,
              },
              {
                id: 'year',
                header: 'Year',
                value: (student) => student.year,
                className: 'text-center',
                cell: (student) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{student.year}</span>,
              },
              {
                id: 'totalFees',
                header: 'Total Fees',
                value: (student) => student.totalFees,
                cell: (student) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{formatCurrency(student.totalFees)}</span>,
              },
              {
                id: 'amountPaid',
                header: 'Amount Paid',
                value: (student) => student.amountPaid,
                cell: (student) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{formatCurrency(student.amountPaid)}</span>,
              },
              {
                id: 'outstanding',
                header: 'Outstanding',
                value: (student) => student.outstanding,
                cell: (student) => (
                  <span className="text-sm font-semibold" style={{ color: student.outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {formatCurrency(student.outstanding)}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                value: (student) => student.status,
                cell: (student) => {
                  const sc = statusColors(student.status)
                  return (
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
                      {student.status}
                    </span>
                  )
                },
              },
            ]}
          />

        </div>
      </div>
    </AppShell>
  )
}
