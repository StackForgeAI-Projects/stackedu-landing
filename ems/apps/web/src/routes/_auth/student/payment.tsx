import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import type { PaymentMethod } from '@stackedu/shared'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { getStudentFees, payStudentFees, studentDashboardQueryKey, studentFeesQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/payment')({
  component: MakePaymentPage,
})

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'MoMo', label: 'MTN MoMo' },
  { id: 'Airtel', label: 'Airtel Money' },
  { id: 'Card', label: 'Card' },
  { id: 'BankTransfer', label: 'Bank transfer' },
]

function MakePaymentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: studentFeesQueryKey, queryFn: getStudentFees })
  const invoice = data?.invoices.find((row) => row.amountDue - row.amountPaid > 0)
  const outstanding = invoice ? invoice.amountDue - invoice.amountPaid : data?.balance ?? 0
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('MoMo')
  const [phone, setPhone] = useState('')

  const mutation = useMutation({
    mutationFn: payStudentFees,
    onSuccess: async (fees) => {
      toast.success('Payment recorded.')
      await queryClient.invalidateQueries({ queryKey: studentFeesQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
      const latest = fees.payments[0]
      if (latest?.status === 'Completed') void navigate({ to: '/student/receipt', search: { id: latest.id } })
      else void navigate({ to: '/student/fees' })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Payment failed.')),
  })

  return (
    <StudentShell pageTitle="Pay fees" guide="Pay an outstanding invoice. Sandbox mobile money and card complete immediately and open a receipt.">
      <div className="animate-fade-up max-w-lg" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Make a payment</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Outstanding {formatCurrency(outstanding)}
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="amount">Amount (RWF)</Label>
            <Input id="amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(outstanding)} />
          </div>
          <div>
            <Label>Method</Label>
            <select className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)' }} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {METHODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          {(method === 'MoMo' || method === 'Airtel') ? (
            <div>
              <Label htmlFor="phone">Mobile money number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
            </div>
          ) : null}
          <Button
            disabled={
              mutation.isPending
              || outstanding <= 0
              || ((method === 'MoMo' || method === 'Airtel') && !phone.trim())
            }
            onClick={() => mutation.mutate({
              invoiceId: invoice?.id,
              amount: Math.round(Number(amount || outstanding)),
              method,
              payerPhone: phone.trim() || undefined,
            })}
          >
            Pay now
          </Button>
        </div>
      </div>
    </StudentShell>
  )
}
