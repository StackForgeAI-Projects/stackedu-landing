import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import type { ApiError } from '@stackedu/shared'
import { AppError } from '../lib/errors'
import type { RequestVariables } from './request-context'

function fieldErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'input'
    ;(details[key] ??= []).push(issue.message)
  }
  return details
}

/**
 * Turns anything thrown anywhere in the API into the single error shape the
 * clients understand.
 *
 * Only deliberate errors carry their message to the caller. An unexpected
 * throw is logged in full and reported as a generic failure, so a stack trace
 * or a connection string can never reach a browser.
 */
export function errorHandler(error: Error, c: Context<{ Variables: RequestVariables }>) {
  const requestId = c.get('requestId')
  const logger = c.get('logger')

  const respond = (status: number, body: ApiError) => c.json(body, status as 400)

  if (error instanceof AppError) {
    if (error.status >= 500) logger?.error('Handled server error', { error, code: error.code })
    else logger?.warn('Handled client error', { code: error.code, message: error.message })

    return respond(error.status, {
      error: {
        code: error.code,
        message: error.expose ? error.message : 'Something went wrong on our side.',
        ...(error.details ? { details: error.details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    })
  }

  if (error instanceof ZodError) {
    logger?.warn('Request failed validation', { issues: error.issues.length })
    return respond(422, {
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Some fields need your attention.',
        details: fieldErrors(error),
        ...(requestId ? { requestId } : {}),
      },
    })
  }

  if (error instanceof HTTPException) {
    return respond(error.status, {
      error: {
        code: error.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message: error.message || 'That request could not be completed.',
        ...(requestId ? { requestId } : {}),
      },
    })
  }

  logger?.error('Unhandled error', { error })
  return respond(500, {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side.',
      ...(requestId ? { requestId } : {}),
    },
  })
}

export function notFoundHandler(c: Context<{ Variables: RequestVariables }>) {
  const requestId = c.get('requestId')
  return c.json(
    {
      error: {
        code: 'NOT_FOUND' as const,
        message: `No route matches ${c.req.method} ${c.req.path}.`,
        ...(requestId ? { requestId } : {}),
      },
    },
    404,
  )
}
