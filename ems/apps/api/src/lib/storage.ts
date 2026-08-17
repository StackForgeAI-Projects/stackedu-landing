import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env'
import { badRequest, internalError } from './errors'

const UPLOAD_TTL_SECONDS = 15 * 60
const DOWNLOAD_TTL_SECONDS = 10 * 60

export interface UploadTarget {
  uploadUrl: string
  uploadMethod: 'PUT'
  headers: Record<string, string>
}

function signingSecret(): string {
  const configured = env().STORAGE_SIGNING_SECRET
  if (configured) return configured
  if (env().NODE_ENV === 'production') {
    throw internalError(new Error('STORAGE_SIGNING_SECRET is not configured'))
  }
  return 'stackedu-local-dev-signing-secret'
}

function localRoot(): string {
  const root = path.resolve(env().STORAGE_LOCAL_ROOT)
  if (!existsSync(root)) mkdirSync(root, { recursive: true })
  return root
}

function localPathFor(fileKey: string): string {
  const resolved = path.resolve(localRoot(), fileKey)
  if (!resolved.startsWith(localRoot() + path.sep) && resolved !== localRoot()) {
    throw badRequest('Invalid file key.')
  }
  return resolved
}

function r2Client(): S3Client {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env()
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })
}

/** Object key scoped to the institution and application — never guessable alone. */
export function buildFileKey(input: {
  institutionId: string
  applicationId: string
  documentType: string
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return [
    'institutions',
    input.institutionId,
    'applications',
    input.applicationId,
    input.documentType,
    `${randomUUID()}-${safeName}`,
  ].join('/')
}

function signLocalToken(payload: string): string {
  return createHmac('sha256', signingSecret()).update(payload).digest('base64url')
}

export function createLocalUploadToken(input: {
  fileKey: string
  mimeType: string
  fileSizeBytes: number
  expiresAt: number
}): string {
  const body = [
    input.fileKey,
    input.mimeType,
    String(input.fileSizeBytes),
    String(input.expiresAt),
  ].join('|')
  return `${Buffer.from(body).toString('base64url')}.${signLocalToken(body)}`
}

export function verifyLocalUploadToken(token: string): {
  fileKey: string
  mimeType: string
  fileSizeBytes: number
} {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) throw badRequest('Upload link is invalid or expired.')

  let body: string
  try {
    body = Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    throw badRequest('Upload link is invalid or expired.')
  }

  const expected = signLocalToken(body)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw badRequest('Upload link is invalid or expired.')
  }

  const [fileKey, mimeType, sizeRaw, expiresRaw] = body.split('|')
  const expiresAt = Number(expiresRaw)
  const fileSizeBytes = Number(sizeRaw)
  if (!fileKey || !mimeType || !Number.isFinite(expiresAt) || !Number.isFinite(fileSizeBytes)) {
    throw badRequest('Upload link is invalid or expired.')
  }
  if (Date.now() > expiresAt) throw badRequest('Upload link has expired. Request a new one.')

  return { fileKey, mimeType, fileSizeBytes }
}

export async function createUploadTarget(input: {
  fileKey: string
  mimeType: string
  fileSizeBytes: number
}): Promise<UploadTarget> {
  if (env().STORAGE_DRIVER === 'r2') {
    const command = new PutObjectCommand({
      Bucket: env().R2_BUCKET!,
      Key: input.fileKey,
      ContentType: input.mimeType,
      ContentLength: input.fileSizeBytes,
    })
    const uploadUrl = await getSignedUrl(r2Client(), command, { expiresIn: UPLOAD_TTL_SECONDS })
    return {
      uploadUrl,
      uploadMethod: 'PUT',
      headers: {
        'Content-Type': input.mimeType,
      },
    }
  }

  const expiresAt = Date.now() + UPLOAD_TTL_SECONDS * 1000
  const token = createLocalUploadToken({ ...input, expiresAt })
  return {
    uploadUrl: `${env().API_PUBLIC_URL}/apply/documents/upload/${token}`,
    uploadMethod: 'PUT',
    headers: {
      'Content-Type': input.mimeType,
    },
  }
}

export async function writeLocalUpload(
  token: string,
  body: Buffer,
  contentLength: number | undefined,
): Promise<void> {
  const { fileKey, mimeType, fileSizeBytes } = verifyLocalUploadToken(token)
  if (contentLength !== undefined && contentLength !== fileSizeBytes) {
    throw badRequest('File size does not match the upload reservation.')
  }
  if (body.byteLength !== fileSizeBytes) {
    throw badRequest('File size does not match the upload reservation.')
  }

  const destination = localPathFor(fileKey)
  mkdirSync(path.dirname(destination), { recursive: true })
  await pipeline(Readable.from(body), createWriteStream(destination))

  // mimeType is reserved for future content sniffing; keep the contract clear.
  void mimeType
}

export async function createDownloadUrl(fileKey: string): Promise<{
  url: string
  expiresAt: string
}> {
  const expiresAt = new Date(Date.now() + DOWNLOAD_TTL_SECONDS * 1000).toISOString()

  if (env().STORAGE_DRIVER === 'r2') {
    const command = new GetObjectCommand({
      Bucket: env().R2_BUCKET!,
      Key: fileKey,
    })
    const url = await getSignedUrl(r2Client(), command, { expiresIn: DOWNLOAD_TTL_SECONDS })
    return { url, expiresAt }
  }

  const token = createLocalUploadToken({
    fileKey,
    mimeType: 'application/octet-stream',
    fileSizeBytes: 0,
    expiresAt: Date.now() + DOWNLOAD_TTL_SECONDS * 1000,
  })
  return {
    url: `${env().API_PUBLIC_URL}/apply/documents/file/${token}`,
    expiresAt,
  }
}

export function openLocalFile(token: string): {
  stream: ReturnType<typeof createReadStream>
  fileKey: string
} {
  const { fileKey } = verifyLocalUploadToken(token)
  const filePath = localPathFor(fileKey)
  if (!existsSync(filePath)) throw badRequest('That file is not available.')
  return { stream: createReadStream(filePath), fileKey }
}

export async function deleteStoredObject(fileKey: string): Promise<void> {
  if (env().STORAGE_DRIVER === 'r2') {
    await r2Client().send(
      new DeleteObjectCommand({
        Bucket: env().R2_BUCKET!,
        Key: fileKey,
      }),
    )
    return
  }

  const filePath = localPathFor(fileKey)
  if (existsSync(filePath)) await unlink(filePath)
}

export function buildInstitutionLogoKey(institutionId: string): string {
  return `institutions/${institutionId}/branding/logo`
}

const LOGO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

export async function writeInstitutionLogo(input: {
  institutionId: string
  body: Buffer
  mimeType: string
}): Promise<string> {
  if (!LOGO_MIME_TYPES.has(input.mimeType)) {
    throw badRequest('Upload a PNG, JPEG, WebP or SVG logo.')
  }
  if (input.body.byteLength > 2 * 1024 * 1024) {
    throw badRequest('The logo must be 2 MB or smaller.')
  }

  const fileKey = buildInstitutionLogoKey(input.institutionId)

  if (env().STORAGE_DRIVER === 'r2') {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: env().R2_BUCKET!,
        Key: fileKey,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    )
    return fileKey
  }

  const destination = localPathFor(fileKey)
  mkdirSync(path.dirname(destination), { recursive: true })
  await pipeline(Readable.from(input.body), createWriteStream(destination))
  return fileKey
}

export function openInstitutionLogo(fileKey: string): {
  stream: ReturnType<typeof createReadStream>
  mimeType: string
} {
  if (env().STORAGE_DRIVER === 'r2') {
    throw internalError(new Error('Institution logo streaming is only supported for local storage.'))
  }

  const filePath = localPathFor(fileKey)
  if (!existsSync(filePath)) throw badRequest('That logo is not available.')

  const ext = path.extname(filePath).toLowerCase()
  const mimeType =
    ext === '.png'
      ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.svg'
            ? 'image/svg+xml'
            : 'application/octet-stream'

  return { stream: createReadStream(filePath), mimeType }
}
