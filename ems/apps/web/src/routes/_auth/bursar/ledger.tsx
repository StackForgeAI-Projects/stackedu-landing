import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Download, X } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, TRANSACTIONS, methodColors, statusColors,
  type Transaction,
} from '@/data/bursar'
import { CreditCard, CheckCircle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/ledger')({
  component: LedgerPage,
})

function LedgerPage() {
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [selectedTxn, setSelectedTxn]  = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    return TRANSACTIONS.filter((t) => {
      if (methodFilter !== 'all' && t.method !== methodFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      return true
    })
  }, [methodFilter, statusFilter, fromDate, toDate])

  const paidCount   = filtered.filter((t) => t.status === 'Paid').length
  const totalAmount = filtered.filter((t) => t.status === 'Paid').reduce((s, t) => s + t.amount, 0)
  const successRate = filtered.length > 0 ? Math.round((paidCount / filtered.length) * 100) : 0

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Payment Ledger"
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

          {/* Section header + filters */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1
                className="t-h1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
              >
                Payment Ledger
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                All transactions across all students and payment channels
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2 outline-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2 outline-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-36 text-sm h-9">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
                  <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-sm h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => toast.success('Export started. CSV will download shortly.')}
              >
                <Download style={{ width: 14, height: 14 }} />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary StatTiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatTile
              icon={CreditCard}
              iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)"
              label="TOTAL TRANSACTIONS"
              value={String(filtered.length)}
              delta={`Showing ${filtered.length} of ${TRANSACTIONS.length}`}
              deltaColor="var(--muted-foreground)"
              animationDelay={0}
            />
            <StatTile
              icon={TrendingUp}
              iconColor="var(--success)" iconBg="var(--success-bg)"
              label="TOTAL AMOUNT (PAID)"
              value={formatCurrency(totalAmount)}
              delta="Successful transactions only"
              deltaColor="var(--muted-foreground)"
              animationDelay={60}
            />
            <StatTile
              icon={CheckCircle}
              iconColor="var(--info)" iconBg="var(--info-bg)"
              label="SUCCESS RATE"
              value={`${successRate}%`}
              delta={`${paidCount} of ${filtered.length} transactions`}
              deltaColor="var(--muted-foreground)"
              animationDelay={120}
            />
          </div>

          <DataTable
            rows={filtered}
            rowKey={(txn) => String(txn.id)}
            searchPlaceholder="Search transactions…"
            empty="No transactions match the selected filters."
            defaultPageSize={10}
            onRowClick={(txn) => setSelectedTxn(txn)}
            columns={[
              {
                id: 'txnId',
                header: 'Transaction ID',
                value: (txn) => txn.txnId,
                cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.txnId}</span>,
              },
              {
                id: 'studentName',
                header: 'Student Name',
                value: (txn) => txn.studentName,
                sortable: true,
                cell: (txn) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{txn.studentName}</span>,
              },
              {
                id: 'studentId',
                header: 'Student ID',
                value: (txn) => txn.studentId,
                cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.studentId}</span>,
              },
              {
                id: 'date',
                header: 'Date & Time',
                value: (txn) => `${txn.date} ${txn.time}`,
                sortable: true,
                sortValue: (txn) => txn.date,
                cell: (txn) => <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{txn.date} · {txn.time}</span>,
              },
              {
                id: 'description',
                header: 'Description',
                value: (txn) => txn.description,
                cell: (txn) => <span className="text-sm truncate block" style={{ color: 'var(--muted-foreground)', maxWidth: 200 }}>{txn.description}</span>,
              },
              {
                id: 'amount',
                header: 'Amount',
                value: (txn) => txn.amount,
                sortable: true,
                sortValue: (txn) => txn.amount,
                className: 'text-right',
                cell: (txn) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(txn.amount)}</span>,
              },
              {
                id: 'method',
                header: 'Method',
                value: (txn) => txn.method,
                cell: (txn) => {
                  const mc = methodColors(txn.method)
                  return <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>{txn.method}</span>
                },
              },
              {
                id: 'status',
                header: 'Status',
                value: (txn) => txn.status,
                sortable: true,
                cell: (txn) => {
                  const sc = statusColors(txn.status)
                  return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{txn.status}</span>
                },
              },
            ]}
          />
        </div>
      </div>

      {/* Transaction detail Sheet */}
      <Sheet open={!!selectedTxn} onOpenChange={(o) => !o && setSelectedTxn(null)}>
        <SheetContent
          className="overflow-y-auto sheet-lg"
          style={{ padding: 0 }}
        >
          {selectedTxn && <TransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Transaction Detail Sheet ──────────────────────────────────────────────────

function TransactionSheet({ txn, onClose }: { txn: Transaction; onClose: () => void }) {
  const mc = methodColors(txn.method)
  const sc = statusColors(txn.status)

  const rows = [
    { label: 'Transaction ID',  value: txn.txnId,         mono: true  },
    { label: 'Student Name',    value: txn.studentName,   mono: false },
    { label: 'Student ID',      value: txn.studentId,     mono: true  },
    { label: 'Date & Time',     value: `${txn.date} · ${txn.time}`, mono: false },
    { label: 'Description',     value: txn.description,   mono: false },
    { label: 'Payment Method',  value: txn.method,        mono: false },
    { label: 'Gateway Reference', value: txn.gatewayRef,  mono: true  },
    ...(txn.receiptNo ? [{ label: 'Receipt Number', value: txn.receiptNo, mono: true }] : []),
  ]

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '-0.015em',
              marginBottom: 6,
            }}
          >
            Transaction Detail
          </h2>
          <span
            className="t-mono"
            style={{ color: 'var(--muted-foreground)', fontSize: 13 }}
          >
            {txn.txnId}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Amount + badges */}
      <div
        className="flex items-center justify-between p-4 mb-6"
        style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-lg)' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            letterSpacing: '-0.015em',
          }}
        >
          {formatCurrency(txn.amount)}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="t-label px-2.5 py-1"
            style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)' }}
          >
            {txn.method}
          </span>
          <span
            className="t-label px-2.5 py-1"
            style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
          >
            {txn.status}
          </span>
        </div>
      </div>

      {/* Data rows */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-4 py-3.5"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <span className="t-caption" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>
              {row.label}
            </span>
            {row.mono ? (
              <span className="t-mono" style={{ color: 'var(--foreground)', textAlign: 'right' }}>
                {row.value}
              </span>
            ) : (
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)', textAlign: 'right' }}>
                {row.value}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {txn.receiptNo && (
          <button
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onClick={() => toast.success(`Receipt ${txn.receiptNo} download started.`)}
          >
            <Download style={{ width: 15, height: 15 }} />
            Download receipt
          </button>
        )}
        {txn.status === 'Paid' && (
          <button
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--error)',
              border: '1px solid var(--error)',
              cursor: 'pointer',
            }}
            onClick={() => toast.error('Void transaction feature — requires admin confirmation.')}
          >
            <X style={{ width: 15, height: 15 }} />
            Void transaction
          </button>
        )}
      </div>
    </div>
  )
}
