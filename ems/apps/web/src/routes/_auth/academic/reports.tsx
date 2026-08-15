import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { AcademicReports } from '@stackedu/shared'
import { Users, BarChart2, Calendar, GraduationCap, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { AcademicShell } from '@/components/AcademicShell'
import {
  academicReportsQueryKey,
  getAcademicReports,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/academic/reports')({
  component: AcademicReportsPage,
})

type ReportType = AcademicReports['type']

interface ReportConfig {
  key: ReportType
  icon: typeof Users
  title: string
  description: string
}

const REPORT_CONFIGS: ReportConfig[] = [
  { key: 'enrollment', icon: Users, title: 'Enrollment Report', description: 'Student enrollment by programme, year, and status' },
  { key: 'results', icon: BarChart2, title: 'Results Summary', description: 'Grade distributions and GPA analysis by cohort' },
  { key: 'attendance', icon: Calendar, title: 'Attendance Report', description: 'Attendance trends by course and department' },
  { key: 'programme', icon: GraduationCap, title: 'Programme Performance', description: 'Comparative performance across programmes' },
]

function AcademicReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null)
  const [generated, setGenerated] = useState(false)

  const reportsQuery = useQuery({
    queryKey: academicReportsQueryKey(activeReport ?? 'enrollment'),
    queryFn: () => getAcademicReports(activeReport!),
    enabled: generated && activeReport !== null,
  })

  const activeCfg = REPORT_CONFIGS.find((r) => r.key === activeReport)
  const report = reportsQuery.data

  return (
    <AcademicShell pageTitle="Reports">
      <div className="page-body animate-fade-up">
        <div className="mb-8">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Academic Reports</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Generate and export academic reports</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {REPORT_CONFIGS.map((cfg) => {
            const Icon = cfg.icon
            const isActive = activeReport === cfg.key
            return (
              <button key={cfg.key} type="button" onClick={() => { setActiveReport(cfg.key); setGenerated(false) }}
                className="text-left p-6 rounded-xl transition-all duration-150"
                style={{ backgroundColor: isActive ? 'var(--foreground)' : 'var(--card)', border: `1px solid ${isActive ? 'var(--foreground)' : 'var(--border)'}`, boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)', cursor: 'pointer' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(15, 189, 59,0.08)' }}>
                    <Icon style={{ width: 18, height: 18, color: isActive ? '#fff' : 'var(--brand)' }} />
                  </div>
                  <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: isActive ? '#fff' : 'var(--foreground)', fontSize: '1rem' }}>{cfg.title}</h3>
                </div>
                <p className="t-body-sm" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)' }}>{cfg.description}</p>
              </button>
            )
          })}
        </div>

        {activeReport && !generated && (
          <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 24 }}>
            <h2 className="t-h3 mb-4">Configure — {activeCfg?.title}</h2>
            <button type="button" onClick={() => setGenerated(true)} className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
              Generate report
            </button>
          </div>
        )}

        {activeReport && generated && (
          <div>
            {reportsQuery.isPending ? (
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading report…</p>
            ) : reportsQuery.error ? (
              <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(reportsQuery.error, 'Could not load report.')}</p>
            ) : report ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {report.stats.map((s) => (
                    <div key={s.label} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 20 }}>
                      <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 24 }}>
                  <h3 className="t-h3 mb-6">{activeCfg?.title}</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    {activeReport === 'attendance' && report.attendanceChart?.length ? (
                      <LineChart data={report.attendanceChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                        <Line type="monotone" dataKey="avg" stroke="var(--brand)" strokeWidth={2} dot={{ fill: 'var(--brand)', r: 4 }} />
                      </LineChart>
                    ) : activeReport === 'programme' && report.programmeChart?.length ? (
                      <BarChart data={report.programmeChart} barSize={50}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="avgGPA" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : activeReport === 'results' && report.resultsChart?.length ? (
                      <BarChart data={report.resultsChart} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="grade" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="count" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : report.enrollmentChart?.length ? (
                      <BarChart data={report.enrollmentChart} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="Year1" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Year 1" />
                        <Bar dataKey="Year2" fill="var(--info)" radius={[4, 4, 0, 0]} name="Year 2" />
                        <Bar dataKey="Year3" fill="var(--warning)" radius={[4, 4, 0, 0]} name="Year 3" />
                      </BarChart>
                    ) : (
                      <p className="t-body text-center" style={{ color: 'var(--muted-foreground)' }}>No chart data for this report.</p>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="flex gap-3">
                  <button type="button" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
                    <Download style={{ width: 14, height: 14 }} />Export PDF
                  </button>
                  <button type="button" onClick={() => setGenerated(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    Reconfigure
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </AcademicShell>
  )
}
