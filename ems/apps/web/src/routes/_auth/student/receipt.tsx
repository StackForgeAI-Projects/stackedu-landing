import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { StudentShell } from '@/components/StudentShell'
import { formatCurrency } from '@/lib/utils'
import { getStudentReceipt } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/receipt')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: PaymentReceiptPage,
})

function PaymentReceiptPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: ['student', 'receipt', id],
    queryFn: () => getStudentReceipt(id),
    enabled: Boolean(id),
  })

  return (
    <StudentShell pageTitle="Receipt" guide="Proof of a completed payment on your fee account. Open this from the fee statement.">
      <div className="animate-fade-up max-w-lg" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/fees" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Fees</Link>
        <h1 className="t-h1 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Payment receipt</h1>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Open a receipt from your fee statement.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading receipt…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load receipt.')}</p>
        ) : data ? (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p className="text-2xl font-semibold mb-2">{formatCurrency(data.amount)}</p>
            <p className="text-sm">{data.receiptNumber}</p>
            <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>{data.reference} · {data.method}</p>
            <p className="text-sm">{data.studentName} · {data.studentNumber}</p>
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{data.institutionName}</p>
            <p className="t-caption mt-2">{data.paidAt ? new Date(data.paidAt).toLocaleString() : 'Pending'}</p>
          </div>
        ) : null}
      </div>
    </StudentShell>
  )
}
