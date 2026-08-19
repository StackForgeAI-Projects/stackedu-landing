import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  Info,
  Lock,
  Mail,
  Monitor,
  Shield,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export type ConfirmAlertTone = 'info' | 'success' | 'warning' | 'destructive'

export type ConfirmAlertNoticeIcon =
  | 'email'
  | 'track'
  | 'documents'
  | 'clock'
  | 'shield'
  | 'info'
  | 'trash'
  | 'archive'
  | 'user'
  | 'bell'
  | 'file'
  | 'lock'

export type ConfirmAlertNotice = {
  icon: ConfirmAlertNoticeIcon
  label: string
}

export const CONFIRM_ALERT_TONE_STYLES = {
  info: { bg: 'var(--info-bg)', border: 'var(--info)', accent: 'var(--info)' },
  success: { bg: 'var(--success-bg)', border: 'var(--success)', accent: 'var(--success)' },
  warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', accent: 'var(--warning)' },
  destructive: { bg: 'var(--error-bg)', border: 'var(--error)', accent: 'var(--error)' },
} as const

const CONFIRM_ALERT_NOTICE_ICONS: Record<ConfirmAlertNoticeIcon, LucideIcon> = {
  email: Mail,
  track: Monitor,
  documents: FileUp,
  clock: Clock,
  shield: Shield,
  info: Info,
  trash: Trash2,
  archive: Archive,
  user: User,
  bell: Bell,
  file: FileText,
  lock: Lock,
}

const CONFIRM_ALERT_TONE_ICONS: Record<ConfirmAlertTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
}

export type ConfirmAlertPanelProps = {
  tone: ConfirmAlertTone
  headlineLabel?: string
  headline: string
  summary: string
  notices?: ReadonlyArray<ConfirmAlertNotice>
  caution?: string
}

export function ConfirmAlertPanel({
  tone,
  headlineLabel = 'Action',
  headline,
  summary,
  notices = [],
  caution,
}: ConfirmAlertPanelProps) {
  const toneStyle = CONFIRM_ALERT_TONE_STYLES[tone]
  const StatusIcon = CONFIRM_ALERT_TONE_ICONS[tone]

  return (
    <div className="flex flex-col gap-3 text-left">
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: toneStyle.bg, border: `1px solid ${toneStyle.border}` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <StatusIcon size={18} style={{ color: toneStyle.accent }} />
          </div>
          <div className="min-w-0">
            <p className="t-label" style={{ color: toneStyle.accent }}>{headlineLabel}</p>
            <p
              className="text-base font-semibold mt-0.5"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}
            >
              {headline}
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--foreground)' }}>
              {summary}
            </p>
          </div>
        </div>
      </div>

      {caution ? (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5"
          style={{
            backgroundColor: tone === 'destructive' ? 'var(--error-bg)' : 'var(--warning-bg)',
            border: `1px solid ${tone === 'destructive' ? 'var(--error)' : 'var(--warning)'}`,
          }}
        >
          <AlertTriangle
            size={16}
            className="flex-shrink-0 mt-0.5"
            style={{ color: tone === 'destructive' ? 'var(--error)' : 'var(--warning)' }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {caution}
          </p>
        </div>
      ) : null}

      {notices.length > 0 ? (
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>What happens next</p>
          <ul className="flex flex-col gap-2">
            {notices.map((notice) => {
              const Icon = CONFIRM_ALERT_NOTICE_ICONS[notice.icon]
              return (
                <li key={notice.label} className="flex items-start gap-2.5">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <Icon size={13} style={{ color: 'var(--info)' }} />
                  </div>
                  <span className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--foreground)' }}>
                    {notice.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export type ConfirmAlertDialogProps = ConfirmAlertPanelProps & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title: string
  cancelLabel?: string
  confirmLabel: React.ReactNode
  onConfirm?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  onCancel?: () => void
  confirmVariant?: 'default' | 'destructive' | 'warning' | 'brand'
  confirmDisabled?: boolean
  loading?: boolean
  children?: React.ReactNode
  contentClassName?: string
}

const CONFIRM_BUTTON_STYLES: Record<NonNullable<ConfirmAlertDialogProps['confirmVariant']>, React.CSSProperties> = {
  default: {},
  destructive: { backgroundColor: 'var(--error)', color: '#FFFFFF' },
  warning: { backgroundColor: 'var(--warning)', color: '#FFFFFF' },
  brand: { backgroundColor: 'var(--brand)', color: '#FFFFFF' },
}

export function ConfirmAlertDialog({
  open,
  onOpenChange,
  trigger,
  title,
  tone,
  headlineLabel,
  headline,
  summary,
  notices,
  caution,
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'default',
  confirmDisabled = false,
  loading = false,
  children,
  contentClassName,
}: ConfirmAlertDialogProps) {
  const dialog = (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent className={contentClassName ?? 'max-w-[calc(100vw-2rem)] sm:max-w-[440px]'}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-3">
              <ConfirmAlertPanel
                tone={tone}
                headlineLabel={headlineLabel}
                headline={headline}
                summary={summary}
                notices={notices}
                caution={caution}
              />
              {children}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <AlertDialogCancel
            disabled={loading}
            className="mt-0 w-full sm:w-auto"
            onClick={onCancel}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmDisabled || loading}
            className="w-full sm:w-auto"
            style={CONFIRM_BUTTON_STYLES[confirmVariant]}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return dialog
}
