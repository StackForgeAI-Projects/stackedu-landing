import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { semesters } from './academic'
import { aiJobStatusEnum, riskLevelEnum } from './enums'
import { users } from './people'
import { students } from './students'

/**
 * The AI layer.
 *
 * Risk scores are stored with the factors that produced them. A lecturer being
 * told "this student is at risk" is not useful on its own — they need to see
 * that it was driven by attendance and two missed assignments, and a score with
 * no explanation would not be trusted or acted upon.
 */

export const riskScores = pgTable(
  'risk_scores',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'cascade' }),
    /** 0 to 100, where higher means more likely to fail or drop out. */
    score: numeric('score', { precision: 5, scale: 2 }).notNull(),
    level: riskLevelEnum('level').notNull(),
    /** How confident the model is, so a weak signal can be presented as such. */
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    modelVersion: text('model_version').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true, mode: 'string' }).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('risk_scores_key').on(t.studentId, t.semesterId, t.computedAt),
    index('risk_scores_level_idx').on(t.level, t.semesterId),
  ],
)

export const riskFactors = pgTable(
  'risk_factors',
  {
    id: primaryKeyColumn(),
    riskScoreId: uuid('risk_score_id')
      .notNull()
      .references(() => riskScores.id, { onDelete: 'cascade' }),
    /** e.g. LowAttendance, MissedAssignments, DecliningGrades, FeeArrears. */
    factor: text('factor').notNull(),
    /** How much this factor pushed the score up, as a percentage of the total. */
    contribution: numeric('contribution', { precision: 5, scale: 2 }).notNull(),
    /** Plain-English sentence shown to staff. */
    explanation: text('explanation').notNull(),
    evidence: jsonb('evidence').$type<Record<string, unknown>>(),
    createdAt: timestamps().createdAt,
  },
  (t) => [index('risk_factors_score_idx').on(t.riskScoreId)],
)

/** What somebody actually did about a flagged student, and whether it helped. */
export const riskInterventions = pgTable(
  'risk_interventions',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    riskScoreId: uuid('risk_score_id').references(() => riskScores.id, { onDelete: 'set null' }),
    /** e.g. Counselling, ExtraTutorial, GuardianContacted. */
    interventionType: text('intervention_type').notNull(),
    notes: text('notes'),
    performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
    performedAt: timestamp('performed_at', { withTimezone: true, mode: 'string' }),
    outcome: text('outcome'),
    followUpAt: timestamp('follow_up_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [index('risk_interventions_student_idx').on(t.studentId, t.createdAt)],
)

export const aiJobs = pgTable(
  'ai_jobs',
  {
    id: primaryKeyColumn(),
    /** e.g. EmbedResource, ScoreRisk, SummariseDocument. */
    jobType: text('job_type').notNull(),
    status: aiJobStatusEnum('status').notNull().default('Queued'),
    targetType: text('target_type'),
    targetId: uuid('target_id'),
    input: jsonb('input').$type<Record<string, unknown>>(),
    output: jsonb('output').$type<Record<string, unknown>>(),
    attemptCount: integer('attempt_count').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    errorMessage: text('error_message'),
    ...timestamps(),
  },
  (t) => [
    index('ai_jobs_status_idx').on(t.status, t.createdAt),
    index('ai_jobs_target_idx').on(t.targetType, t.targetId),
  ],
)

/**
 * Token usage per call. AI spend is the one running cost that can surprise you,
 * so it is measured from the first day rather than after the first large bill.
 */
export const aiUsageLogs = pgTable(
  'ai_usage_logs',
  {
    id: primaryKeyColumn(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    feature: text('feature').notNull(),
    model: text('model').notNull(),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    /** Cost in thousandths of a US cent, kept as an integer to avoid float drift. */
    estimatedCostMicros: integer('estimated_cost_micros').notNull().default(0),
    latencyMs: integer('latency_ms'),
    succeeded: jsonb('succeeded').$type<boolean>(),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index('ai_usage_logs_feature_idx').on(t.feature, t.createdAt),
    index('ai_usage_logs_user_idx').on(t.userId, t.createdAt),
  ],
)
