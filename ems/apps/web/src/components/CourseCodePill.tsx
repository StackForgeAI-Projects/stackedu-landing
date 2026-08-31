import { cn } from '@/lib/utils'

type CourseCodePillProps = {
  code: string
  color: string
  size?: 'sm' | 'md'
  className?: string
}

export function CourseCodePill({ code, color, size = 'sm', className }: CourseCodePillProps) {
  return (
    <div
      className={cn(
        'course-code-pill',
        size === 'md' ? 'course-code-pill--md' : 'course-code-pill--sm',
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <span className="course-code-pill__text">{code}</span>
    </div>
  )
}
