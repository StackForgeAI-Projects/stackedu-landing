import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { StudentShell } from '@/components/StudentShell'
import { StatTile } from '@/components/StatTile'
import { formatCurrency } from '@/lib/utils'
import { getStudentFees, studentFeesQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/fees')({
  component: FeeStatementPage,
})

function FeeStatementPage() {
  const { data, isPending, error } = useQuery({
    queryKey: studentFeesQueryKey,
    queryFn: getStudentFees,
  })

  return (
    <StudentShell pageTitle="Fees" guide="Your invoices and payments. Pay the balance from this statement. A fee hold from the Bursar can block registration.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <div className="flex flex-wrap justify-between gap-4 mb-6">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Fee statement</h1>
          <Link to="/student/payment" className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Make a payment →</Link>
        </div>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading fees…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load fees.')}</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatTile icon={CreditCard} iconColor="var(--info)" iconBg="var(--info-bg)" label="CHARGED" value={formatCurrency(data.totalCharged)} />
              <StatTile icon={CreditCard} iconColor="var(--success)" iconBg="var(--success-bg)" label="PAID" value={formatCurrency(data.totalPaid)} />
              <StatTile icon={CreditCard} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="BALANCE" value={formatCurrency(data.balance)} />
            </div>
            <h2 className="t-h3 mb-3">Invoices</h2>
            <div className="mb-6">
              <DataTable
                rows={data.invoices}
                rowKey={(invoice) => invoice.id}
                searchPlaceholder="Search invoices…"
                filters={[{ id: 'status', label: 'statuses', getValue: (invoice) => invoice.status }]}
                empty="No invoices yet."
                columns={[
                  { id: 'number', header: 'Invoice', value: (invoice) => invoice.invoiceNumber, sortable: true, cell: (invoice) => <span className="font-medium">{invoice.invoiceNumber}</span> },
                  { id: 'status', header: 'Status', value: (invoice) => invoice.status, cell: (invoice) => invoice.status },
                  { id: 'due', header: 'Due', value: (invoice) => invoice.dueDate ?? 'TBC', cell: (invoice) => invoice.dueDate ?? 'TBC' },
                  { id: 'paid', header: 'Paid', value: (invoice) => invoice.amountPaid, sortable: true, sortValue: (invoice) => invoice.amountPaid, cell: (invoice) => formatCurrency(invoice.amountPaid) },
                  { id: 'dueAmt', header: 'Amount due', value: (invoice) => invoice.amountDue, sortable: true, sortValue: (invoice) => invoice.amountDue, cell: (invoice) => formatCurrency(invoice.amountDue) },
                ]}
              />
            </div>
            <h2 className="t-h3 mb-3">Payments</h2>
            <DataTable
              rows={data.payments}
              rowKey={(payment) => payment.id}
              searchPlaceholder="Search payments…"
              filters={[
                { id: 'status', label: 'statuses', getValue: (payment) => payment.status },
                { id: 'method', label: 'methods', getValue: (payment) => payment.method },
              ]}
              empty="No payments yet."
              columns={[
                { id: 'ref', header: 'Reference', value: (payment) => payment.reference, sortable: true, cell: (payment) => <span className="font-medium">{payment.reference}</span> },
                { id: 'method', header: 'Method', value: (payment) => payment.method, cell: (payment) => payment.method },
                { id: 'status', header: 'Status', value: (payment) => payment.status, cell: (payment) => payment.status },
                { id: 'amount', header: 'Amount', value: (payment) => payment.amount, sortable: true, sortValue: (payment) => payment.amount, cell: (payment) => formatCurrency(payment.amount) },
                {
                  id: 'receipt',
                  header: '',
                  cell: (payment) => payment.status === 'Completed'
                    ? <Link to="/student/receipt" search={{ id: payment.id }} className="t-caption" style={{ color: 'var(--success)' }}>Receipt</Link>
                    : null,
                  className: 'text-right',
                },
              ]}
            />
          </>
        ) : null}
      </div>
    </StudentShell>
  )
}
