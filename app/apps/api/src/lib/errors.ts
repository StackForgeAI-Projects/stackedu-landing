import type { ApiErrorCode } from '@stackedu/shared'

/**
 * Errors the API raises deliberately.
 *
 * Anything thrown that is not an AppError is treated as a bug: it is logged in
 * full and reported to the caller as a generic internal error, so an
 * unexpected failure can never leak a stack trace or a connection string.
 */
export class AppError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: Record<string, string[]>
  /** True when the message is safe to display to an end user. */
  readonly expose: boolean

  constructor(
    code: ApiErrorCode,
    status: number,
    message: string,
    options?: { details?: Record<string, string[]>; cause?: unknown; expose?: boolean },
  ) {
    super(message, { cause: options?.cause })
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = options?.details
    this.expose = options?.expose ?? true
  }
}

export const badRequest = (message: string, details?: Record<string, string[]>) =>
  new AppError('BAD_REQUEST', 400, message, { details })

export const validationFailed = (details: Record<string, string[]>) =>
  new AppError('VALIDATION_FAILED', 422, 'Some fields need your attention.', { details })

export const unauthenticated = (message = 'Please sign in to continue.') =>
  new AppError('UNAUTHENTICATED', 401, message)

/**
 * Deliberately vague, and identical for an unknown address, a wrong password
 * and a disabled account. Distinguishing them would confirm to an attacker
 * which addresses are real.
 */
export const invalidCredentials = () =>
  new AppError('UNAUTHENTICATED', 401, 'That email or password is not correct.')

export const forbidden = (message = 'You do not have permission to do that.') =>
  new AppError('FORBIDDEN', 403, message)

export const notFound = (what = 'That item') =>
  new AppError('NOT_FOUND', 404, `${what} could not be found.`)

export const conflict = (message: string) => new AppError('CONFLICT', 409, message)

export const tooManyRequests = (message = 'Too many attempts. Please try again shortly.') =>
  new AppError('RATE_LIMITED', 429, message)

export const internalError = (cause?: unknown) =>
  new AppError('INTERNAL_ERROR', 500, 'Something went wrong on our side.', {
    cause,
    expose: false,
  })

export const serviceUnavailable = (message = 'The service is temporarily unavailable.') =>
  new AppError('SERVICE_UNAVAILABLE', 503, message)
