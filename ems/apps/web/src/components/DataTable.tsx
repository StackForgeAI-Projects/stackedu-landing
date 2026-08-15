import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  /** Used for search when `searchFilter` is omitted, and for derived filters. */
  value?: (row: T) => string | number | null | undefined
  className?: string
  headerClassName?: string
  sortable?: boolean
  sortValue?: (row: T) => string | number | null | undefined
}

export interface DataTableFilter<T> {
  id: string
  label: string
  getValue: (row: T) => string
  options?: Array<{ label: string; value: string }>
  allLabel?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  searchPlaceholder?: string
  searchFilter?: (row: T, query: string) => boolean
  filters?: DataTableFilter<T>[]
  empty?: string
  pageSizeOptions?: number[]
  defaultPageSize?: number
  toolbar?: React.ReactNode
  onRowClick?: (row: T) => void
  hideSearch?: boolean
}

const DEFAULT_PAGE_SIZES = [5, 10, 25, 50, 100]

function compareValues(a: string | number | null | undefined, b: string | number | null | undefined): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchPlaceholder = 'Search…',
  searchFilter,
  filters = [],
  empty = 'No rows to show.',
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  defaultPageSize,
  toolbar,
  onRowClick,
  hideSearch = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize ?? 10)
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null)

  const derivedFilters = useMemo(() => {
    return filters.map((filter) => {
      if (filter.options) return filter
      const unique = [...new Set(rows.map((row) => filter.getValue(row)).filter(Boolean))].sort()
      return {
        ...filter,
        options: unique.map((value) => ({ label: value, value })),
      }
    })
  }, [filters, rows])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let next = rows

    if (needle) {
      next = next.filter((row) => {
        if (searchFilter) return searchFilter(row, needle)
        return columns.some((column) => String(column.value?.(row) ?? '').toLowerCase().includes(needle))
      })
    }

    for (const filter of derivedFilters) {
      const selected = filterValues[filter.id]
      if (!selected || selected === 'all') continue
      next = next.filter((row) => filter.getValue(row) === selected)
    }

    if (sort) {
      const column = columns.find((item) => item.id === sort.id)
      if (column) {
        const read = column.sortValue ?? column.value
        next = [...next].sort((a, b) => {
          const result = compareValues(read?.(a), read?.(b))
          return sort.dir === 'asc' ? result : -result
        })
      }
    }

    return next
  }, [rows, query, searchFilter, columns, derivedFilters, filterValues, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filtered.length)

  function resetPage() {
    setPage(1)
  }

  function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return
    setSort((current) => {
      if (current?.id !== column.id) return { id: column.id, dir: 'asc' }
      if (current.dir === 'asc') return { id: column.id, dir: 'desc' }
      return null
    })
  }

  const selectClass =
    'h-9 rounded-lg px-3 text-sm outline-none min-w-[140px]'

  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {hideSearch ? null : (
          <div
            className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 min-w-0 sm:max-w-xs"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                resetPage()
              }}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {derivedFilters.map((filter) => (
            <select
              key={filter.id}
              aria-label={filter.label}
              value={filterValues[filter.id] ?? 'all'}
              onChange={(event) => {
                setFilterValues((prev) => ({ ...prev, [filter.id]: event.target.value }))
                resetPage()
              }}
              className={selectClass}
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="all">{filter.allLabel ?? `All ${filter.label.toLowerCase()}`}</option>
              {(filter.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ))}
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--muted)' }}>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn('t-label text-left px-4 py-3 whitespace-nowrap', column.headerClassName)}
                  style={{ color: 'var(--muted-foreground)', fontWeight: 600, cursor: column.sortable ? 'pointer' : 'default' }}
                  onClick={() => toggleSort(column)}
                  aria-sort={sort?.id === column.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {column.header}
                  {column.sortable ? (
                    <span className="ml-1 t-caption" style={{ color: sort?.id === column.id ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                      {sort?.id === column.id ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center t-body" style={{ color: 'var(--muted-foreground)' }}>
                  {empty}
                </td>
              </tr>
            ) : pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
                style={{ borderTop: '1px solid var(--border)' }}
                onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {columns.map((column) => (
                  <td key={column.id} className={cn('px-4 py-3', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(1)
            }}
            className="h-8 rounded-lg px-2 text-sm outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            per page · {filtered.length} {filtered.length === 1 ? 'row' : 'rows'}
            {filtered.length !== rows.length ? ` of ${rows.length}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            {filtered.length === 0 ? '0 rows' : `Showing ${from}–${to} of ${filtered.length}`}
          </span>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', opacity: currentPage <= 1 ? 0.4 : 1 }}
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', opacity: currentPage >= totalPages ? 0.4 : 1 }}
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
