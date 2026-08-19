import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { LibrarianShell } from '@/components/LibrarianShell'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { toast } from 'sonner'
import {
  RESOURCE_REQUESTS, CATALOGUE_RESOURCES,
  type ResourceRequest, type RequestStatus,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/requests')({
  component: RequestsPage,
})


const STATUS_CONFIG: Record<RequestStatus, { bg: string; color: string }> = {
  Pending:   { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Fulfilled: { bg: 'var(--success-bg)', color: 'var(--success)' },
  Declined:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  Student:  { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  Lecturer: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
}

const REQ_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'New Resource':      { bg: 'rgba(32,244,78,0.1)',   color: 'var(--brand)' },
  'Existing Resource': { bg: 'var(--muted)',           color: 'var(--muted-foreground)' },
}

// ─────────────────────────────────────────────────────────────────────────────

function RequestsPage() {
  const [requests,     setRequests]     = useState<ResourceRequest[]>(RESOURCE_REQUESTS)
  const [detailTarget, setDetailTarget] = useState<ResourceRequest | null>(null)
  const [fulfilTarget, setFulfilTarget] = useState<ResourceRequest | null>(null)
  const [declineTarget,setDeclineTarget]= useState<ResourceRequest | null>(null)
  const [declineReason,setDeclineReason]= useState('')
  const [fulfilHow,    setFulfilHow]    = useState('catalogue')
  const [linkedRes,    setLinkedRes]    = useState('')
  const [arrivalDate,  setArrivalDate]  = useState('')

  const statusCounts = {
    pending:   requests.filter(r => r.status === 'Pending').length,
    fulfilled: requests.filter(r => r.status === 'Fulfilled').length,
    declined:  requests.filter(r => r.status === 'Declined').length,
  }

  const handleFulfil = () => {
    if (!fulfilTarget) return
    setRequests(prev => prev.map(r => r.id === fulfilTarget.id ? { ...r, status: 'Fulfilled', resolution: fulfilHow === 'catalogue' ? `Linked to existing resource: ${linkedRes || 'Selected resource'}` : fulfilHow === 'ordered' ? `Ordered — expected arrival: ${arrivalDate || 'TBD'}` : 'Fulfilled' } : r))
    toast.success(`Request fulfilled. ${fulfilTarget.requester} will be notified.`)
    setFulfilTarget(null)
    setFulfilHow('catalogue')
    setLinkedRes('')
    setArrivalDate('')
  }

  const handleDecline = () => {
    if (!declineTarget) return
    setRequests(prev => prev.map(r => r.id === declineTarget.id ? { ...r, status: 'Declined', resolution: declineReason } : r))
    toast.error(`Request declined. ${declineTarget.requester} will be notified.`)
    setDeclineTarget(null)
    setDeclineReason('')
  }

  return (
    <LibrarianShell pageTitle={"Resource Requests"}>

      <div className="px-4 sm:px-8 py-8 animate-fade-up" style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page header */}
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
          <span>Librarian</span><span>›</span>
          <span style={{ color: 'var(--foreground)' }}>Resource Requests</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Resource Requests</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {([
            { label: 'Pending', count: statusCounts.pending, bg: 'var(--warning-bg)', color: 'var(--warning)' },
            { label: 'Fulfilled', count: statusCounts.fulfilled, bg: 'var(--success-bg)', color: 'var(--success)' },
            { label: 'Declined', count: statusCounts.declined, bg: 'var(--error-bg)', color: 'var(--error)' },
          ] as const).map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 t-caption"
              style={{ backgroundColor: item.bg, color: item.color, borderRadius: 'var(--radius-md)' }}
            >
              <span className="font-semibold">{item.count}</span>
              {item.label}
            </span>
          ))}
        </div>

        <DataTable
          rows={requests}
          rowKey={(row) => String(row.id)}
          searchPlaceholder="Search requester, title or request ID…"
          searchFilter={(row, query) =>
            `${row.requestId} ${row.requester} ${row.resourceTitle}`.toLowerCase().includes(query)
          }
          filters={[
            { id: 'status', label: 'statuses', getValue: (row) => row.status },
            { id: 'role', label: 'roles', getValue: (row) => row.role },
            { id: 'type', label: 'types', getValue: (row) => row.requestType },
          ]}
          empty="No requests match your filters."
          defaultPageSize={10}
          onRowClick={(row) => setDetailTarget(row)}
          columns={[
            {
              id: 'requestId',
              header: 'Request ID',
              value: (row) => row.requestId,
              sortable: true,
              cell: (row) => (
                <span className="t-caption whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', fontSize: 10 }}>
                  {row.requestId}
                </span>
              ),
            },
            {
              id: 'requester',
              header: 'Requester',
              value: (row) => row.requester,
              sortable: true,
              cell: (row) => {
                const rs = ROLE_STYLE[row.role]
                return (
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{row.requester}</p>
                    <span className="t-label px-1.5 py-0.5 inline-block mt-0.5" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>{row.role}</span>
                  </div>
                )
              },
            },
            {
              id: 'title',
              header: 'Resource title',
              value: (row) => row.resourceTitle,
              sortable: true,
              cell: (row) => (
                <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{row.resourceTitle}</p>
              ),
            },
            {
              id: 'type',
              header: 'Type',
              value: (row) => row.requestType,
              sortable: true,
              className: 'hidden xl:table-cell',
              headerClassName: 'hidden xl:table-cell',
              cell: (row) => {
                const ts = REQ_TYPE_STYLE[row.requestType]
                return (
                  <span className="t-label px-1.5 py-0.5 inline-block" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>
                    {row.requestType === 'New Resource' ? 'NEW' : 'EXISTING'}
                  </span>
                )
              },
            },
            {
              id: 'date',
              header: 'Date',
              value: (row) => row.dateSubmitted,
              sortable: true,
              cell: (row) => (
                <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{row.dateSubmitted}</span>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              value: (row) => row.status,
              sortable: true,
              headerClassName: 'text-center',
              className: 'text-center',
              cell: (row) => {
                const ss = STATUS_CONFIG[row.status]
                return (
                  <span className="t-label px-1.5 py-0.5 inline-block" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>
                    {row.status}
                  </span>
                )
              },
            },
            {
              id: 'actions',
              header: 'Actions',
              headerClassName: 'text-center',
              className: 'text-center',
              cell: (row) => (
                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {row.status === 'Pending' ? (
                    <>
                      <Button size="sm" variant="outline" style={{ fontSize: '0.75rem', height: 26, borderColor: 'var(--brand)', color: 'var(--brand)', padding: '0 8px' }} onClick={() => setFulfilTarget(row)}>Fulfil</Button>
                      <Button size="sm" variant="outline" style={{ fontSize: '0.75rem', height: 26, padding: '0 8px' }} onClick={() => setDeclineTarget(row)}>Decline</Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>View</span>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailTarget !== null} onOpenChange={open => { if (!open) setDetailTarget(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          {detailTarget && <RequestDetailSheet request={detailTarget} onClose={() => setDetailTarget(null)} />}
        </SheetContent>
      </Sheet>

      {/* Fulfil Sheet */}
      <Sheet open={fulfilTarget !== null} onOpenChange={open => { if (!open) setFulfilTarget(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          {fulfilTarget && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)' }}>Fulfil Request</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                <DataRow label="Requester"    value={`${fulfilTarget.requester} (${fulfilTarget.role})`} />
                <DataRow label="Resource"     value={fulfilTarget.resourceTitle} />
                <DataRow label="Description"  value={fulfilTarget.description} />
                <DataRow label="Submitted"    value={fulfilTarget.dateSubmitted} />
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>HOW ARE YOU FULFILLING THIS REQUEST?</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {[
                      { id: 'catalogue', label: 'Found in catalogue — link existing resource' },
                      { id: 'ordered',   label: 'Ordered new resource — set expected arrival' },
                      { id: 'decline',   label: 'Cannot fulfil — redirect to decline' },
                    ].map(o => (
                      <label key={o.id} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="fulfil-how" value={o.id} checked={fulfilHow === o.id} onChange={() => setFulfilHow(o.id)} style={{ accentColor: 'var(--brand)' }} />
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{o.label}</span>
                      </label>
                    ))}
                  </div>

                  {fulfilHow === 'catalogue' && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Link to resource</Label>
                      <select
                        value={linkedRes}
                        onChange={e => setLinkedRes(e.target.value)}
                        style={{ height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none' }}
                      >
                        <option value="">Select a resource…</option>
                        {CATALOGUE_RESOURCES.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                      </select>
                    </div>
                  )}

                  {fulfilHow === 'ordered' && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Expected arrival date</Label>
                      <input
                        type="date"
                        value={arrivalDate}
                        onChange={e => setArrivalDate(e.target.value)}
                        style={{ height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none', width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Button variant="outline" className="flex-1" onClick={() => setFulfilTarget(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
                  onClick={fulfilHow === 'decline' ? () => { setFulfilTarget(null); setDeclineTarget(fulfilTarget) } : handleFulfil}
                >
                  {fulfilHow === 'decline' ? 'Go to decline' : 'Mark as fulfilled'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={declineTarget !== null}
        onOpenChange={(open) => { if (!open) setDeclineTarget(null) }}
        title="Decline request?"
        tone="destructive"
        headlineLabel="Action"
        headline="Decline request"
        summary="Please provide a reason for declining this request."
        notices={[{ icon: 'bell', label: 'The requester will be notified with your reason.' }]}
        confirmLabel="Decline request"
        confirmVariant="destructive"
        confirmDisabled={!declineReason.trim()}
        onCancel={() => setDeclineReason('')}
        onConfirm={handleDecline}
      >
        <Textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="Reason for declining (required)…"
          rows={3}
        />
      </ConfirmAlertDialog>
    </LibrarianShell>
  )
}

// ── Request detail Sheet content ──────────────────────────────────────────────

function RequestDetailSheet({ request, onClose }: { request: ResourceRequest; onClose: () => void }) {
  const rs = ROLE_STYLE[request.role]
  const ss = STATUS_CONFIG[request.status]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>{request.status}</span>
          <span className="t-caption" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', fontSize: 11 }}>{request.requestId}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>
          {request.resourceTitle}
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-6 py-5">
        <DataRow label="Requester" value={
          <span className="flex items-center gap-2">
            {request.requester}
            <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>{request.role}</span>
          </span>
        } />
        {request.studentId && <DataRow label="Student ID" value={<span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{request.studentId}</span>} />}
        <DataRow label="Request type" value={request.requestType} />
        <DataRow label="Date submitted" value={request.dateSubmitted} />
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>DESCRIPTION</p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.75 }}>{request.description}</p>
        </div>
        {request.resolution && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>RESOLUTION</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.75 }}>{request.resolution}</p>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 mt-auto">
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', minWidth: 100, paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}
