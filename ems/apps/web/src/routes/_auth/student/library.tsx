import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { ResourceType } from '@stackedu/shared'
import { StudentShell } from '@/components/StudentShell'
import { Input } from '@/components/ui/input'
import { getStudentLibrary, studentLibraryQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/library')({
  component: ELibraryPage,
})

const TYPE_LABEL: Record<ResourceType, string> = {
  Ebook: 'E-Book',
  Journal: 'Journal',
  ResearchPaper: 'Research paper',
  CoursePack: 'Course pack',
  Video: 'Video',
}

function ELibraryPage() {
  const { data, isPending, error } = useQuery({
    queryKey: studentLibraryQueryKey,
    queryFn: getStudentLibrary,
  })
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ResourceType | 'all'>('all')

  const types = useMemo(() => {
    const seen = new Set<ResourceType>()
    for (const item of data ?? []) seen.add(item.type)
    return [...seen]
  }, [data])

  const filtered = (data ?? []).filter((item) => {
    const haystack = `${item.title} ${item.author ?? ''} ${item.subjectTags.join(' ')}`.toLowerCase()
    const matchesQuery = haystack.includes(query.trim().toLowerCase())
    const matchesType = type === 'all' || item.type === type
    return matchesQuery && matchesType
  })

  return (
    <StudentShell pageTitle="E-Library" guide="Published catalogue items from the Librarian. Search by title, author or subject.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>E-Library</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Published resources from your institution catalogue.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author or subject"
            className="sm:max-w-sm"
          />
          <select
            className="text-sm px-3 py-2 rounded-lg"
            style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType | 'all')}
          >
            <option value="all">All types</option>
            {types.map((value) => (
              <option key={value} value={value}>{TYPE_LABEL[value]}</option>
            ))}
          </select>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading catalogue…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the library.')}</p>
        ) : filtered.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {data?.length ? 'No resources match that search.' : 'No published resources yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="p-5"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
              >
                <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>{TYPE_LABEL[item.type]}</p>
                <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{item.title}</h2>
                <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {[item.author, item.publicationYear].filter(Boolean).join(' · ')}
                </p>
                {item.description ? (
                  <p className="text-sm mb-3" style={{ color: 'var(--foreground)' }}>{item.description}</p>
                ) : null}
                {item.subjectTags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.subjectTags.map((tag) => (
                      <span key={tag} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </StudentShell>
  )
}
