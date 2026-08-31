import type { CreateAcademicCourseRequest } from '@stackedu/shared'

const HEADER_ALIASES: Record<string, keyof ParsedCourseRow> = {
  code: 'code',
  'course code': 'code',
  name: 'name',
  'course name': 'name',
  title: 'name',
  'course title': 'name',
  department: 'department',
  dept: 'department',
  'dept.': 'department',
  faculty: 'department',
  credits: 'credits',
  credit: 'credits',
  'credit units': 'credits',
  units: 'credits',
  cu: 'credits',
  type: 'type',
  description: 'description',
  prerequisites: 'prerequisites',
  prereq: 'prerequisites',
  prerequisite: 'prerequisites',
}

interface ParsedCourseRow {
  code: string
  name: string
  department: string
  credits: string
  type: string
  description: string
  prerequisites: string
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseCredits(value: string): number {
  const match = String(value).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
  if (!match) return Number.NaN
  const credits = Number.parseInt(match[1]!, 10)
  return Number.isFinite(credits) ? credits : Number.NaN
}

function rowToCourse(row: ParsedCourseRow, defaultDepartment: string): CreateAcademicCourseRequest | null {
  const code = row.code.trim().toUpperCase()
  const name = row.name.trim()
  const department = row.department.trim() || defaultDepartment
  const credits = parseCredits(row.credits)

  if (!code || !name || !department || !Number.isFinite(credits) || credits < 1) return null

  const type = row.type.trim().toLowerCase()
  const yearOfStudy = type.includes('elect') ? 2 : 1
  const prerequisiteCodes = row.prerequisites
    .split(/[,;|]/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)

  return {
    code,
    name,
    departmentName: department,
    credits,
    yearOfStudy,
    description: row.description.trim() || undefined,
    prerequisiteCodes: prerequisiteCodes.length > 0 ? prerequisiteCodes : undefined,
  }
}

function detectDelimiter(line: string): string {
  const counts = {
    ',': (line.match(/,/g) ?? []).length,
    ';': (line.match(/;/g) ?? []).length,
    '\t': (line.match(/\t/g) ?? []).length,
  }
  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) return ';'
  if (counts['\t'] > counts[','] && counts['\t'] >= counts[';']) return '\t'
  return ','
}

function headerIndex(rows: string[][]): number {
  const idx = rows.findIndex((row) => row.some((cell) => HEADER_ALIASES[normalizeHeader(cell)]))
  return idx === -1 ? 0 : idx
}

function sheetRowsToCourses(
  rows: string[][],
  defaultDepartment: string,
): CreateAcademicCourseRequest[] {
  if (rows.length === 0) return []

  const start = headerIndex(rows)
  const headerRow = rows[start] ?? []
  const columnMap = headerRow.map((cell) => HEADER_ALIASES[normalizeHeader(cell)] ?? null)
  const hasHeader = columnMap.some(Boolean)
  const dataRows = hasHeader ? rows.slice(start + 1) : rows

  const courses: CreateAcademicCourseRequest[] = []
  for (const cells of dataRows) {
    const parsed: ParsedCourseRow = {
      code: '',
      name: '',
      department: '',
      credits: '',
      type: '',
      description: '',
      prerequisites: '',
    }

    cells.forEach((cell, index) => {
      const key = hasHeader ? columnMap[index] : null
      if (key) parsed[key] = String(cell ?? '')
      else if (!hasHeader) {
        if (index === 0) parsed.code = String(cell ?? '')
        if (index === 1) parsed.name = String(cell ?? '')
        if (index === 2) parsed.department = String(cell ?? '')
        if (index === 3) parsed.credits = String(cell ?? '')
        if (index === 4) parsed.type = String(cell ?? '')
        if (index === 5) parsed.description = String(cell ?? '')
        if (index === 6) parsed.prerequisites = String(cell ?? '')
      }
    })

    const course = rowToCourse(parsed, defaultDepartment)
    if (course) courses.push(course)
  }

  return courses
}

function parseCsv(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return []
  const delimiter = detectDelimiter(lines[0]!)

  return lines.map((line) => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]!
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (char === delimiter && !inQuotes) {
        cells.push(current.trim())
        current = ''
        continue
      }
      current += char
    }
    cells.push(current.trim())
    return cells
  })
}

export async function parseCourseSpreadsheet(
  file: File,
  defaultDepartment: string,
): Promise<CreateAcademicCourseRequest[]> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (extension === 'csv') {
    const text = await file.text()
    return sheetRowsToCourses(parseCsv(text), defaultDepartment)
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return []
    const sheet = workbook.Sheets[sheetName]
    const rows = (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][])
      .map((row) => row.map((cell) => String(cell ?? '')))
    return sheetRowsToCourses(rows, defaultDepartment)
  }

  throw new Error('Upload a .csv, .xlsx, or .xls file.')
}
