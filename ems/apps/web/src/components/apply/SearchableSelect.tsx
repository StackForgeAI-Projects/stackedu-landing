import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  /** Allow a value that is not in the options list. */
  allowCustom?: boolean
}

/** Dropdown with type-to-filter — used for districts, sectors, and similar long lists. */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  allowCustom = true,
}: SearchableSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    setOpen(false)
  }, [options])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.toLowerCase().includes(needle))
  }, [options, query])

  const commit = (next: string) => {
    onChange(next)
    setQuery(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            if (allowCustom) onChange(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && filtered[0]) {
              event.preventDefault()
              commit(filtered[0])
            }
            if (event.key === 'Escape') setOpen(false)
          }}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'pr-9',
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md"
          style={{ color: 'var(--muted-foreground)', background: 'transparent', border: 'none' }}
          aria-label="Show options"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-[100] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {filtered.length === 0 ? (
            <p className="bg-popover px-3 py-2 text-sm text-muted-foreground">
              {allowCustom ? 'Keep typing to use your entry.' : 'No matches found.'}
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(option)
                }}
                className={cn(
                  'block w-full bg-popover px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-muted',
                  option === value && 'bg-muted',
                )}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
