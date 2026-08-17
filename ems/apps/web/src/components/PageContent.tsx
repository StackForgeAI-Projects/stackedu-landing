import { cn } from '@/lib/utils'

interface PageContentProps {
  children: React.ReactNode
  className?: string
  /** Use for profile, settings, and other focused forms. */
  narrow?: boolean
}

/** Shared page width — 90% on larger screens, full width with side padding on small screens. */
export function PageContent({ children, className, narrow }: PageContentProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 md:w-[90%]', className)}
      style={{ maxWidth: narrow ? 760 : 1400 }}
    >
      {children}
    </div>
  )
}
