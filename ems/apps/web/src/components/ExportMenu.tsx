import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  downloadExcelSheet,
  downloadPdfTable,
  type TableExportPayload,
} from '@/lib/export-table'
import { notifyError } from '@/lib/notify'

interface ExportMenuProps {
  payload: TableExportPayload
  disabled?: boolean
  className?: string
}

export function ExportMenu({ payload, disabled = false, className }: ExportMenuProps) {
  const runExport = async (format: 'excel' | 'pdf') => {
    if (payload.rows.length === 0) {
      notifyError('Nothing to export', 'Adjust your filters or wait for data to load.')
      return
    }

    try {
      if (format === 'excel') {
        downloadExcelSheet(payload)
        return
      }
      await downloadPdfTable(payload)
    } catch {
      notifyError('Export failed', 'Please try again.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={className ?? 'gap-2'}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => void runExport('excel')} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" style={{ color: 'var(--success)' }} />
          Excel Sheet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void runExport('pdf')} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" style={{ color: 'var(--error)' }} />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
