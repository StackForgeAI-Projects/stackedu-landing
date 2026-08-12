import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'
import { bigint } from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { resourceTypeEnum } from './enums'
import { users } from './people'
import { students } from './students'

/**
 * The e-library.
 *
 * Files themselves sit in Cloudflare R2; only the object key is stored here.
 * Download links are signed on demand and expire, so a copied URL stops working.
 */

export const libraryResources = pgTable(
  'library_resources',
  {
    id: primaryKeyColumn(),
    title: text('title').notNull(),
    author: text('author'),
    publisher: text('publisher'),
    isbn: text('isbn'),
    type: resourceTypeEnum('type').notNull(),
    description: text('description'),
    subjectTags: text('subject_tags').array().notNull().default([]),
    publicationYear: integer('publication_year'),
    language: text('language').notNull().default('en'),
    isPublished: boolean('is_published').notNull().default(false),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    downloadCount: integer('download_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index('library_resources_type_idx').on(t.type),
    index('library_resources_published_idx').on(t.isPublished),
    uniqueIndex('library_resources_isbn_key').on(t.isbn),
  ],
)

/** A resource can have several files, e.g. a PDF plus an EPUB of the same book. */
export const resourceFiles = pgTable(
  'resource_files',
  {
    id: primaryKeyColumn(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => libraryResources.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileKey: text('file_key').notNull(),
    /** E-library files can exceed 2 GB, so this must not be a 32-bit integer. */
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
    mimeType: text('mime_type'),
    format: text('format'),
    pageCount: integer('page_count'),
    isPrimary: boolean('is_primary').notNull().default(true),
    ...timestamps(),
  },
  (t) => [index('resource_files_resource_idx').on(t.resourceId)],
)

export const collections = pgTable(
  'collections',
  {
    id: primaryKeyColumn(),
    name: text('name').notNull(),
    description: text('description'),
    isPublic: boolean('is_public').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('collections_name_key').on(t.name)],
)

export const collectionItems = pgTable(
  'collection_items',
  {
    id: primaryKeyColumn(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => libraryResources.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull().default(0),
    createdAt: timestamps().createdAt,
  },
  (t) => [uniqueIndex('collection_items_key').on(t.collectionId, t.resourceId)],
)

/**
 * Who may open a resource. An empty array on a dimension means no restriction
 * on that dimension, which keeps the common "everyone" case simple.
 */
export const resourceAccessRules = pgTable(
  'resource_access_rules',
  {
    id: primaryKeyColumn(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => libraryResources.id, { onDelete: 'cascade' }),
    programmeIds: uuid('programme_ids').array().notNull().default([]),
    departmentIds: uuid('department_ids').array().notNull().default([]),
    yearGroups: integer('year_groups').array().notNull().default([]),
    roles: text('roles').array().notNull().default([]),
    /** Withheld from students on fee hold when true. */
    requiresFeeClearance: boolean('requires_fee_clearance').notNull().default(false),
    ...timestamps(),
  },
  (t) => [uniqueIndex('resource_access_rules_resource_key').on(t.resourceId)],
)

/** A student asking the librarian to add something the library does not hold. */
export const resourceRequests = pgTable(
  'resource_requests',
  {
    id: primaryKeyColumn(),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    author: text('author'),
    reason: text('reason'),
    status: text('status').notNull().default('Pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    fulfilledResourceId: uuid('fulfilled_resource_id').references(() => libraryResources.id, {
      onDelete: 'set null',
    }),
    ...timestamps(),
  },
  (t) => [index('resource_requests_status_idx').on(t.status)],
)

/**
 * Every open and download, kept because publishers licensing content to the
 * institution require usage reporting.
 */
export const resourceAccessLogs = pgTable(
  'resource_access_logs',
  {
    id: primaryKeyColumn(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => libraryResources.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index('resource_access_logs_resource_idx').on(t.resourceId, t.createdAt),
    index('resource_access_logs_user_idx').on(t.userId, t.createdAt),
  ],
)

/**
 * Vector embeddings that power semantic search ("find me something about
 * photosynthesis" rather than exact keyword matching).
 *
 * 1536 dimensions matches OpenAI text-embedding-3-small. Changing model means
 * changing this width and re-embedding everything, so it is a deliberate choice.
 */
export const resourceEmbeddings = pgTable(
  'resource_embeddings',
  {
    id: primaryKeyColumn(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => libraryResources.id, { onDelete: 'cascade' }),
    /** Long documents are split into chunks, each embedded separately. */
    chunkIndex: integer('chunk_index').notNull().default(0),
    chunkText: text('chunk_text').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    model: text('model').notNull(),
    createdAt: timestamps().createdAt,
  },
  (t) => [uniqueIndex('resource_embeddings_key').on(t.resourceId, t.chunkIndex)],
)
