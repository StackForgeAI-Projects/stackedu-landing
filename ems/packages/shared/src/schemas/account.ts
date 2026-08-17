import { z } from 'zod'
import { userRoleSchema } from '../enums'
import { emailSchema, isoDateSchema, isoDateTimeSchema, phoneSchema, uuidSchema } from '../primitives'

export const accountProfileSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  fullName: z.string(),
  firstName: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  twoFactorEnabled: z.boolean(),
  emailVerifiedAt: isoDateTimeSchema.nullable(),
  institutionName: z.string(),
  institutionShortName: z.string(),
  studentNumber: z.string().nullable(),
  programmeName: z.string().nullable(),
  yearOfStudy: z.number().int().nullable(),
  facultyName: z.string().nullable(),
  admittedAt: isoDateSchema.nullable(),
})

const phoneInputSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => value === '' || phoneSchema.safeParse(value).success, {
    message: 'Phone must be in international format, e.g. +250788123456',
  })
  .transform((value) => (value === '' ? null : value))

export const updateAccountProfileRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: emailSchema,
  phone: z.union([z.null(), phoneInputSchema]).optional(),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(200),
})

export const updateAccountSecurityRequestSchema = z.object({
  twoFactorEnabled: z.boolean(),
})

export const accountNotificationSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  category: z.string(),
  actionUrl: z.string().nullable(),
  readAt: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
})

export const accountNotificationsResponseSchema = z.object({
  notifications: z.array(accountNotificationSchema),
})

export const twoFactorSetupResponseSchema = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
  qrCodeDataUrl: z.string(),
})

const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app.')

export const enableTwoFactorRequestSchema = z.object({
  code: totpCodeSchema,
  secret: z.string().min(16),
})

export const disableTwoFactorRequestSchema = z.object({
  code: totpCodeSchema,
})

export const verifyTwoFactorRequestSchema = z.object({
  code: totpCodeSchema,
})

export const notificationPreferenceItemSchema = z.object({
  key: z.string().trim().min(1).max(64).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
  email: z.boolean(),
  sms: z.boolean(),
  inapp: z.boolean(),
})

export const updateNotificationPreferencesRequestSchema = z.object({
  preferences: z.array(notificationPreferenceItemSchema).min(1).max(20),
})

export const notificationPreferencesResponseSchema = z.object({
  preferences: z.array(notificationPreferenceItemSchema),
})

export type AccountProfile = z.infer<typeof accountProfileSchema>
export type UpdateAccountProfileRequest = z.infer<typeof updateAccountProfileRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
export type UpdateAccountSecurityRequest = z.infer<typeof updateAccountSecurityRequestSchema>
export type AccountNotification = z.infer<typeof accountNotificationSchema>
export type TwoFactorSetupResponse = z.infer<typeof twoFactorSetupResponseSchema>
export type EnableTwoFactorRequest = z.infer<typeof enableTwoFactorRequestSchema>
export type DisableTwoFactorRequest = z.infer<typeof disableTwoFactorRequestSchema>
export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorRequestSchema>
export type NotificationPreferenceItem = z.infer<typeof notificationPreferenceItemSchema>
export type UpdateNotificationPreferencesRequest = z.infer<typeof updateNotificationPreferencesRequestSchema>
export type NotificationPreferencesResponse = z.infer<typeof notificationPreferencesResponseSchema>
