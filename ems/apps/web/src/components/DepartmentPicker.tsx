import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ADD_DEPARTMENT = '__add_department__'

export function DepartmentPicker({
  value,
  onChange,
  departments,
  disabled,
}: {
  value: string
  onChange: (name: string) => void
  departments: string[]
  disabled?: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')

  const options = useMemo(() => {
    const names = new Set(departments.filter(Boolean))
    if (value.trim()) names.add(value.trim())
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [departments, value])

  const inputStyle = {
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
  }

  if (creating) {
    return (
      <div className="flex flex-col gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full text-sm rounded-lg px-3 h-9 outline-none"
          style={inputStyle}
          placeholder="e.g. Department of Law"
          autoFocus
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => { setCreating(false); setDraft('') }}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
          >
            Back to list
          </button>
          <button
            type="button"
            onClick={() => {
              const name = draft.trim()
              if (!name) return
              onChange(name)
              setCreating(false)
              setDraft('')
            }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
          >
            Add department
          </button>
        </div>
      </div>
    )
  }

  return (
    <Select
      value={value || undefined}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === ADD_DEPARTMENT) {
          setDraft(value)
          setCreating(true)
          return
        }
        onChange(next)
      }}
    >
      <SelectTrigger className="h-9 text-sm rounded-lg" style={inputStyle}>
        <SelectValue placeholder="Select a department" />
      </SelectTrigger>
      <SelectContent>
        {options.map((name) => (
          <SelectItem key={name} value={name}>{name}</SelectItem>
        ))}
        {options.length > 0 ? <SelectSeparator /> : null}
        <SelectItem value={ADD_DEPARTMENT}>
          <span className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add new department
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
