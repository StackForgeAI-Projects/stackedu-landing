import { z } from 'zod'

export const attendancePolicySchema = z.object({
  /** When false, submitted attendance is locked immediately. */
  allowEditAfterSubmit: z.boolean(),
  /** Minutes after submission during which edits are allowed. 0 = no time limit when allowed. */
  editWindowMinutes: z.number().int().min(0).max(10_080),
})

export type AttendancePolicy = z.infer<typeof attendancePolicySchema>

export const ATTENDANCE_POLICY_SETTING_KEY = 'attendance.policy'

export const DEFAULT_ATTENDANCE_POLICY: AttendancePolicy = {
  allowEditAfterSubmit: true,
  editWindowMinutes: 60,
}

export function attendanceSessionStatus(closedAt: string | null): 'Draft' | 'Submitted' {
  return closedAt ? 'Submitted' : 'Draft'
}

export function isAttendanceSessionEditable(
  closedAt: string | null,
  policy: AttendancePolicy,
  nowMs = Date.now(),
): boolean {
  if (!closedAt) return true
  if (!policy.allowEditAfterSubmit) return false
  if (policy.editWindowMinutes === 0) return true
  const closedMs = new Date(closedAt).getTime()
  if (Number.isNaN(closedMs)) return false
  return nowMs - closedMs <= policy.editWindowMinutes * 60_000
}
