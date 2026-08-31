function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: string): string {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export interface TableExportPayload {
  filename: string
  title: string
  headers: string[]
  rows: string[][]
}

/** Opens in Excel — UTF-8 CSV with BOM. */
export function downloadExcelSheet({ filename, headers, rows }: TableExportPayload): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8',
  })
  triggerDownload(blob, `${filename}.csv`)
}

/** Simple tabular PDF download. */
export async function downloadPdfTable(payload: TableExportPayload): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const landscape = payload.headers.length > 5
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.text(payload.title, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Exported ${new Date().toLocaleString('en-GB')}`, 14, 22)
  doc.setTextColor(0)

  autoTable(doc, {
    head: [payload.headers],
    body: payload.rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`${payload.filename}.pdf`)
}
