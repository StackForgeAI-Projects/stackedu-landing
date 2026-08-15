import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, Download, XCircle, X, Receipt as ReceiptIcon } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { DataTable } from '@/components/DataTable'
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, RECEIPTS, BURSAR_STUDENTS, methodColors,
  type BursarReceipt, type PaymentMethod,
} from '@/data/bursar'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/receipts')({
  component: ReceiptsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function ReceiptsPage() {
  const [receipts, setReceipts]         = useState<BursarReceipt[]>(RECEIPTS)
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [issueSheetOpen, setIssueOpen]  = useState(false)
  const [voidTarget, setVoidTarget]     = useState<BursarReceipt | null>(null)
  const [voidReason, setVoidReason]     = useState('')

  const handleVoid = () => {
    if (!voidTarget || !voidReason.trim()) {
      toast.error('Please provide a reason for voiding this receipt.')
      return
    }
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === voidTarget.id
          ? { ...r, status: 'Voided', voidedAt: 'Today', voidedReason: voidReason }
          : r
      )
    )
    toast.success(`Receipt ${voidTarget.receiptNo} has been voided and recorded in the audit log.`)
    setVoidTarget(null)
    setVoidReason('')
  }

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Receipts"
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
                Receipts
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Issue, reprint, and void payment receipts
              </p>
            </div>
            <button
              onClick={() => setIssueOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <ReceiptIcon style={{ width: 15, height: 15 }} />
              Issue receipt
            </button>
          </div>

          <DataTable
            rows={receipts}
            rowKey={(receipt) => String(receipt.id)}
            searchPlaceholder="Search by name, ID or receipt no…"
            searchFilter={(r, query) =>
              r.studentName.toLowerCase().includes(query) ||
              r.receiptNo.toLowerCase().includes(query) ||
              r.studentId.toLowerCase().includes(query)
            }
            empty="No receipts found."
            defaultPageSize={10}
            toolbar={
              <div className="flex items-center gap-2 flex-wrap">
                <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
                />
                <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
                />
              </div>
            }
            columns={[
              {
                id: 'receiptNo',
                header: 'Receipt No.',
                value: (receipt) => receipt.receiptNo,
                cell: (receipt) => (
                  <span
                    className="t-mono"
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: 12,
                      textDecoration: receipt.status === 'Voided' ? 'line-through' : 'none',
                    }}
                  >
                    {receipt.receiptNo}
                  </span>
                ),
              },
              {
                id: 'studentName',
                header: 'Student Name',
                value: (receipt) => receipt.studentName,
                cell: (receipt) => (
                  <span
                    className="text-sm font-medium whitespace-nowrap"
                    style={{
                      color: 'var(--foreground)',
                      textDecoration: receipt.status === 'Voided' ? 'line-through' : 'none',
                    }}
                  >
                    {receipt.studentName}
                  </span>
                ),
              },
              {
                id: 'studentId',
                header: 'Student ID',
                value: (receipt) => receipt.studentId,
                cell: (receipt) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{receipt.studentId}</span>,
              },
              {
                id: 'issueDate',
                header: 'Issue Date',
                value: (receipt) => receipt.issueDate,
                cell: (receipt) => <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{receipt.issueDate}</span>,
              },
              {
                id: 'description',
                header: 'Description',
                value: (receipt) => receipt.description,
                cell: (receipt) => <span className="text-sm truncate block" style={{ color: 'var(--muted-foreground)', maxWidth: 180 }}>{receipt.description}</span>,
              },
              {
                id: 'amount',
                header: 'Amount',
                value: (receipt) => receipt.amount,
                cell: (receipt) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(receipt.amount)}</span>,
              },
              {
                id: 'method',
                header: 'Method',
                value: (receipt) => receipt.method,
                cell: (receipt) => {
                  const mc = methodColors(receipt.method)
                  return <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', fontSize: 10 }}>{receipt.method}</span>
                },
              },
              {
                id: 'status',
                header: 'Status',
                value: (receipt) => receipt.status,
                cell: (receipt) => {
                  const isVoided = receipt.status === 'Voided'
                  const sc = isVoided
                    ? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                    : { bg: 'var(--success-bg)', color: 'var(--success)' }
                  return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{receipt.status}</span>
                },
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (receipt) => {
                  const isVoided = receipt.status === 'Voided'
                  return (
                    <div className="flex items-center gap-1.5" style={{ opacity: isVoided ? 0.65 : 1 }}>
                      <button
                        onClick={() => toast.success(`Receipt ${receipt.receiptNo} download started.`)}
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150"
                        style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
                      >
                        <Download style={{ width: 12, height: 12 }} />
                        Download
                      </button>
                      {!isVoided && (
                        <button
                          onClick={() => { setVoidTarget(receipt); setVoidReason('') }}
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150"
                          style={{ border: '1px solid var(--border)', color: 'var(--error)', background: 'var(--card)', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
                        >
                          <XCircle style={{ width: 12, height: 12 }} />
                          Void
                        </button>
                      )}
                    </div>
                  )
                },
              },
            ]}
          />

        </div>
      </div>

      {/* Issue Receipt Sheet */}
      <Sheet open={issueSheetOpen} onOpenChange={setIssueOpen}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          <IssueReceiptSheet onClose={() => setIssueOpen(false)} onIssue={(r) => {
            setReceipts((prev) => [r, ...prev])
            setIssueOpen(false)
          }} />
        </SheetContent>
      </Sheet>

      {/* Void AlertDialog */}
      <AlertDialog open={!!voidTarget} onOpenChange={(o) => !o && setVoidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Receipt {voidTarget?.receiptNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone and will be recorded in the audit log. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <textarea
              placeholder="Reason for voiding this receipt…"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={3}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVoidReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              Void receipt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

// ── Issue Receipt Sheet ───────────────────────────────────────────────────────

const FEE_DESCRIPTIONS = [
  'Semester 1 Tuition Fee',
  'Semester 1 Partial Payment',
  'Semester 1 Remaining Balance',
  'Administrative Levy',
  'Student Union Fee',
  'Library Fee',
  'ICT Fee',
  'Levies & Fees Bundle',
  'Registration Deposit',
  'Other Payment',
]

const FEE_AMOUNTS: Record<string, number> = {
  'Semester 1 Tuition Fee':      650000,
  'Semester 1 Partial Payment':  325000,
  'Semester 1 Remaining Balance':325000,
  'Administrative Levy':          50000,
  'Student Union Fee':            25000,
  'Library Fee':                  15000,
  'ICT Fee':                      20000,
  'Levies & Fees Bundle':        110000,
  'Registration Deposit':        110000,
  'Other Payment':                     0,
}

function IssueReceiptSheet({
  onClose,
  onIssue,
}: {
  onClose: () => void
  onIssue: (r: BursarReceipt) => void
}) {
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [description, setDescription]     = useState('')
  const [amount, setAmount]               = useState('')
  const [method, setMethod]               = useState<PaymentMethod>('MTN MoMo')
  const [date, setDate]                   = useState('')

  const matchedStudents = BURSAR_STUDENTS.filter(
    (s) =>
      studentSearch.length >= 2 &&
      (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.id.includes(studentSearch))
  )

  const selectedStudent = BURSAR_STUDENTS.find((s) => s.id === selectedStudentId)

  const handleDescriptionChange = (v: string) => {
    setDescription(v)
    const auto = FEE_AMOUNTS[v]
    if (auto !== undefined) setAmount(String(auto))
  }

  const handleIssue = () => {
    if (!selectedStudent || !description || !amount) {
      toast.error('Please fill in all required fields.')
      return
    }
    const newReceipt: BursarReceipt = {
      id: Date.now(),
      receiptNo: `RCT-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      issueDate: 'Today',
      description,
      amount: parseInt(amount, 10),
      method,
      status: 'Valid',
    }
    toast.success(`Receipt ${newReceipt.receiptNo} issued for ${selectedStudent.name}.`)
    onIssue(newReceipt)
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div className="flex items-center justify-between mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            letterSpacing: '-0.015em',
          }}
        >
          Issue Receipt
        </h2>
        <button onClick={onClose} style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Student search */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Student *</label>
          <div className="relative">
            <div
              className="flex items-center gap-2 rounded-xl px-3 h-10"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
            >
              <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name or student ID…"
                value={selectedStudent ? selectedStudent.name : studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentId('') }}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--foreground)' }}
              />
              {selectedStudent && (
                <button
                  onClick={() => { setSelectedStudentId(''); setStudentSearch('') }}
                  style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
            {matchedStudents.length > 0 && !selectedStudent && (
              <div
                className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
              >
                {matchedStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStudentId(s.id); setStudentSearch('') }}
                    className="w-full text-left px-4 py-2.5 transition-colors duration-150"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                    <p className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{s.id}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Fee Description *</label>
          <Select value={description} onValueChange={handleDescriptionChange}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select description…" />
            </SelectTrigger>
            <SelectContent>
              {FEE_DESCRIPTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Amount (RWF) *</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 325000"
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          />
          {amount && !isNaN(parseInt(amount, 10)) && (
            <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {formatCurrency(parseInt(amount, 10))}
            </p>
          )}
        </div>

        {/* Payment method */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Method</label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
              <SelectItem value="Airtel Money">Airtel Money</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleIssue}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
          >
            <ReceiptIcon style={{ width: 15, height: 15 }} />
            Issue receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
