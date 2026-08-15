import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { BookMarked, Eye, Pencil, Minus, BookOpen, Plus } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { LibrarianShell } from '@/components/LibrarianShell'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  CATALOGUE_RESOURCES, LIBRARY_COLLECTIONS,
  type CatalogueResource, type ResourceType, type ResourceStatus,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/collection')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : 'ebooks',
  }),
  component: CollectionDetailPage,
})


const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'E-Book':         { bg: 'var(--info-bg)',      color: 'var(--info)'             },
  'Journal':        { bg: 'var(--success-bg)',   color: 'var(--success)'          },
  'Research Paper': { bg: 'var(--warning-bg)',   color: 'var(--warning)'          },
  'Course Pack':    { bg: 'rgba(32,244,78,0.12)',color: 'var(--brand)'            },
  'Physical Book':  { bg: 'var(--muted)',        color: 'var(--muted-foreground)' },
}

const STATUS_CONFIG: Record<ResourceStatus, { bg: string; color: string; label: string }> = {
  'Active':     { bg: 'var(--success-bg)', color: 'var(--success)',          label: 'Available'  },
  'Restricted': { bg: 'var(--warning-bg)', color: 'var(--warning)',          label: 'Restricted' },
  'Archived':   { bg: 'var(--muted)',      color: 'var(--muted-foreground)', label: 'Archived'   },
  'On Loan':    { bg: 'var(--error-bg)',   color: 'var(--error)',            label: 'On Loan'    },
}

const TYPE_BADGE_LABELS: Record<ResourceType, string> = {
  'E-Book':         'E-BOOK',
  'Journal':        'JOURNAL',
  'Research Paper': 'RESEARCH PAPER',
  'Course Pack':    'COURSE PACK',
  'Physical Book':  'BOOK',
}

// ─────────────────────────────────────────────────────────────────────────────

function CollectionDetailPage() {
  const { id } = Route.useSearch()

  const collection = LIBRARY_COLLECTIONS.find(c => c.id === id)
  const allResources = CATALOGUE_RESOURCES.filter(r => r.collection === id)

  const [resources,     setResources]     = useState<CatalogueResource[]>(allResources)
  const [selectedRow,   setSelectedRow]   = useState<CatalogueResource | null>(null)
  const [removeTarget,  setRemoveTarget]  = useState<CatalogueResource | null>(null)

  const handleRemove = () => {
    if (!removeTarget) return
    setResources(prev => prev.filter(r => r.id !== removeTarget.id))
    toast.success(`"${removeTarget.title}" removed from collection.`)
    if (selectedRow?.id === removeTarget.id) setSelectedRow(null)
    setRemoveTarget(null)
  }

  if (!collection) {
    return (
      <LibrarianShell pageTitle={"Collection"}>

        <div className="flex items-center justify-center h-full">
          <p style={{ color: 'var(--muted-foreground)' }}>Collection not found.</p>
        </div>
      </LibrarianShell>
    )
  }

  return (
    <LibrarianShell pageTitle={collection.name}>

      <div className="flex flex-col lg:h-[calc(100vh-var(--header-height))] lg:overflow-hidden">

        {/* Page header */}
        <div className="flex-shrink-0 animate-fade-up px-4 sm:px-8 pt-6">
          <div className="flex items-center gap-2 mb-1 flex-wrap" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
            <span>Librarian</span><span>›</span>
            <Link to="/librarian/collections" style={{ color: 'var(--muted-foreground)' }} className="hover:opacity-70 transition-opacity">Collections</Link>
            <span>›</span>
            <span style={{ color: 'var(--foreground)' }}>{collection.name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: collection.iconColor + '20' }}>
                <BookMarked size={18} style={{ color: collection.iconColor }} />
              </div>
              <h1 className="t-h1 truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{collection.name}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm">Edit collection</Button>
              <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} size="sm">
                <Plus size={14} style={{ marginRight: 6 }} />
                Add resources
              </Button>
            </div>
          </div>
        </div>

        {/* Two-column split */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* Left — management table */}
          <div className="overflow-y-auto animate-fade-up w-full lg:w-[60%] px-4 sm:px-8 lg:pr-4 pb-8">
            <DataTable
              rows={resources}
              rowKey={(row) => String(row.id)}
              searchPlaceholder="Search by title or author…"
              searchFilter={(row, query) => `${row.title} ${row.author}`.toLowerCase().includes(query)}
              filters={[
                { id: 'type', label: 'types', getValue: (row) => row.type },
                { id: 'status', label: 'statuses', getValue: (row) => row.status },
              ]}
              empty="No resources in this collection yet."
              defaultPageSize={10}
              onRowClick={(row) => setSelectedRow(selectedRow?.id === row.id ? null : row)}
              columns={[
                {
                  id: 'type',
                  header: 'Type',
                  value: (row) => row.type,
                  sortable: true,
                  cell: (row) => {
                    const ts = TYPE_STYLE[row.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                    return (
                      <span className="t-label px-1.5 py-0.5 inline-block" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>
                        {TYPE_BADGE_LABELS[row.type]}
                      </span>
                    )
                  },
                },
                {
                  id: 'title',
                  header: 'Title',
                  value: (row) => row.title,
                  sortable: true,
                  cell: (row) => (
                    <div
                      className="min-w-0"
                      style={{
                        borderLeft: selectedRow?.id === row.id ? '3px solid var(--brand)' : '3px solid transparent',
                        paddingLeft: 8,
                      }}
                    >
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{row.title}</p>
                      <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{row.author}</p>
                    </div>
                  ),
                },
                {
                  id: 'views',
                  header: 'Views',
                  value: (row) => row.accessCount,
                  sortable: true,
                  sortValue: (row) => row.accessCount,
                  headerClassName: 'text-right',
                  className: 'text-right',
                  cell: (row) => (
                    <span className="t-caption" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{row.accessCount}</span>
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
                        {ss.label}
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
                    <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <ColBtn icon={Eye} title="Preview" onClick={() => setSelectedRow(selectedRow?.id === row.id ? null : row)} />
                      <ColBtn icon={Pencil} title="Edit" onClick={() => {}} />
                      <ColBtn icon={Minus} title="Remove from collection" onClick={() => setRemoveTarget(row)} danger />
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Right — student preview panel */}
          <div className="overflow-y-auto flex-1 animate-fade-up px-4 sm:px-8 lg:pl-6 pb-8 lg:border-l" style={{ borderColor: 'var(--border)', animationDelay: '60ms' }}>
            {!selectedRow ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="flex items-center justify-center rounded-2xl mb-4" style={{ width: 60, height: 60, backgroundColor: 'var(--muted)' }}>
                  <BookOpen size={28} style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <h3 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Select a resource</h3>
                <p className="t-body" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>Click any row to preview how it appears to students.</p>
              </div>
            ) : (
              <div className="py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={13} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="t-label uppercase" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}>Student View Preview</span>
                </div>

                <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-md)' }}>
                  This is how students see this resource in the E-Library.
                </div>

                <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
                  <span className="t-label px-2.5 py-1 inline-flex mb-4" style={{ backgroundColor: TYPE_STYLE[selectedRow.type]?.bg ?? 'var(--muted)', color: TYPE_STYLE[selectedRow.type]?.color ?? 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                    {TYPE_BADGE_LABELS[selectedRow.type]}
                  </span>
                  <h3 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>
                    {selectedRow.title}
                  </h3>
                  <p className="t-body-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{selectedRow.author}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedRow.subjects.map(s => (
                      <span key={s} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{s}</span>
                    ))}
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{selectedRow.year}</span>
                  </div>
                  <p className="text-sm mb-6" style={{ color: 'var(--foreground)', lineHeight: 1.65 }}>{selectedRow.description}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1" style={{ pointerEvents: 'none', opacity: 0.7 }}>Learn more</Button>
                    <Button size="sm" className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', pointerEvents: 'none', opacity: 0.7 }}>Download</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remove AlertDialog */}
      <AlertDialog open={removeTarget !== null} onOpenChange={open => { if (!open) setRemoveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            Remove from collection?
          </AlertDialogTitle>
          <AlertDialogDescription>
            "{removeTarget?.title}" will be removed from {collection.name}. The resource will remain in the catalogue.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
              onClick={handleRemove}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LibrarianShell>
  )
}

function ColBtn({ icon: Icon, title, onClick, danger }: { icon: React.ElementType; title: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', backgroundColor: hov ? (danger ? 'var(--error-bg)' : 'var(--muted)') : 'transparent', color: hov && danger ? 'var(--error)' : 'var(--muted-foreground)' }}
    >
      <Icon size={13} />
    </button>
  )
}
