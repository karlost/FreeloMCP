/**
 * Common Zod schemas for Freelo API responses
 * Based on freelo.apib API documentation
 */

import { z } from 'zod';

// ===== BASIC TYPES =====

/**
 * ISO 8601 date string
 */
export const DateTimeSchema = z.string().describe('ISO 8601 date-time format (e.g., "2021-10-04T09:32:00+02:00")');

/**
 * Numeric ID as string
 */
export const NumericIdSchema = z.union([z.string(), z.number()]).describe('Numeric ID (as string or number)');

/**
 * UUID string
 */
export const UuidSchema = z.string().uuid().describe('UUID identifier');

/**
 * Priority enum
 */
export const PrioritySchema = z.enum(['h', 'm', 'l']).describe('Priority: h=high, m=medium, l=low');

/**
 * State ID
 */
export const StateIdSchema = z.number().describe('State ID: 1=active, 2=finished');

// ===== COMMON OBJECTS =====

/**
 * User/Worker object (minimal)
 */
export const UserMinimalSchema = z.object({
  id: z.number().describe('User ID'),
  fullname: z.string().optional().describe('User full name'),
  email: z.string().email().optional().describe('User email')
}).describe('User object');

/**
 * User/Worker object (full)
 */
export const UserSchema = z.object({
  id: z.number().describe('User ID'),
  fullname: z.string().optional().describe('User full name'),
  name: z.string().optional().describe('User name'),
  surname: z.string().optional().describe('User surname'),
  email: z.string().email().optional().describe('User email'),
  avatar_url: z.string().url().optional().describe('Avatar URL'),
  role: z.string().optional().describe('User role'),
  is_active: z.boolean().optional().describe('Is user active')
}).describe('User object (full)');

/**
 * Label object
 */
export const LabelSchema = z.object({
  uuid: UuidSchema,
  name: z.string().describe('Label name'),
  color: z.string().describe('Label color (hex code)')
}).describe('Label object');

/**
 * Client object
 */
export const ClientSchema = z.object({
  id: z.number().describe('Client ID'),
  email: z.string().email().optional().describe('Client email'),
  name: z.string().optional().describe('Client name'),
  company: z.string().optional().describe('Company name'),
  company_id: z.string().optional().describe('Company ID'),
  company_tax_id: z.string().optional().describe('Company tax ID'),
  street: z.string().optional().describe('Street address'),
  town: z.string().optional().describe('Town'),
  zip: z.string().optional().describe('ZIP code')
}).describe('Client object');

/**
 * Currency object
 */
export const CurrencySchema = z.object({
  amount: z.string().describe('Amount as string (e.g., "100025" for 1000.25)'),
  currency: z.enum(['CZK', 'EUR', 'USD']).describe('Currency code')
}).describe('Currency object');

// ===== TASKLIST SCHEMAS =====

/**
 * Tasklist (minimal)
 */
export const TasklistMinimalSchema = z.object({
  id: z.number().describe('Tasklist ID'),
  name: z.string().describe('Tasklist name')
}).describe('Tasklist object (minimal)');

/**
 * Tasklist (full)
 */
export const TasklistSchema = z.object({
  id: z.number().describe('Tasklist ID'),
  name: z.string().describe('Tasklist name'),
  date_add: DateTimeSchema.optional(),
  date_edited_at: DateTimeSchema.optional(),
  order: z.number().optional().describe('Tasklist order'),
  color: z.string().optional().describe('Tasklist color')
}).describe('Tasklist object');

// ===== PROJECT SCHEMAS =====

/**
 * Project (minimal)
 */
export const ProjectMinimalSchema = z.object({
  id: z.number().describe('Project ID'),
  name: z.string().describe('Project name')
}).describe('Project object (minimal)');

/**
 * Project (standard)
 */
export const ProjectSchema = z.object({
  id: z.number().describe('Project ID'),
  name: z.string().describe('Project name'),
  date_add: DateTimeSchema.optional(),
  date_edited_at: DateTimeSchema.optional(),
  tasklists: z.array(TasklistMinimalSchema).optional().describe('Active tasklists'),
  client: ClientSchema.optional().nullable().describe('Client information'),
  owner: UserMinimalSchema.optional().nullable().describe('Project owner'),
  state: z.string().optional().describe('Project state'),
  currency_iso: z.enum(['CZK', 'EUR', 'USD']).optional().describe('Project currency')
}).describe('Project object');

/**
 * Project (detailed)
 */
export const ProjectDetailedSchema = ProjectSchema.extend({
  workers: z.array(UserSchema).optional().describe('Project workers'),
  custom_fields: z.array(z.any()).optional().describe('Custom fields'),
  tags: z.array(z.string()).optional().describe('Project tags')
}).describe('Project object (detailed)');

// ===== SUBTASK SCHEMAS =====

/**
 * Subtask object
 */
export const SubtaskSchema = z.object({
  id: z.number().describe('Subtask ID'),
  task_id: z.number().describe('Parent task ID'),
  name: z.string().describe('Subtask name'),
  date_add: DateTimeSchema.optional(),
  due_date: DateTimeSchema.optional().nullable(),
  due_date_end: DateTimeSchema.optional().nullable(),
  worker: UserMinimalSchema.optional().nullable(),
  priority_enum: PrioritySchema.optional(),
  labels: z.array(LabelSchema).optional(),
  tracking_users: z.array(UserMinimalSchema).optional(),
  state_id: StateIdSchema.optional()
}).describe('Subtask object');

// ===== TASK SCHEMAS =====

/**
 * Task (minimal)
 */
export const TaskMinimalSchema = z.object({
  id: z.number().describe('Task ID'),
  name: z.string().describe('Task name'),
  state_id: StateIdSchema.optional()
}).describe('Task object (minimal)');

/**
 * Task (standard)
 */
export const TaskSchema = z.object({
  id: z.number().describe('Task ID'),
  name: z.string().describe('Task name'),
  date_add: DateTimeSchema.optional(),
  date_edited_at: DateTimeSchema.optional(),
  due_date: DateTimeSchema.optional().nullable(),
  due_date_end: DateTimeSchema.optional().nullable(),
  worker: UserMinimalSchema.optional().nullable(),
  priority_enum: PrioritySchema.optional().nullable(),
  labels: z.array(LabelSchema).optional(),
  tracking_users: z.array(UserMinimalSchema).optional(),
  state_id: StateIdSchema.optional(),
  project_id: z.number().optional().describe('Project ID'),
  tasklist_id: z.number().optional().describe('Tasklist ID')
}).describe('Task object');

/**
 * Task (detailed)
 */
export const TaskDetailedSchema = TaskSchema.extend({
  description: z.string().optional().nullable().describe('Task description'),
  subtasks: z.array(SubtaskSchema).optional().describe('Subtasks'),
  author: UserMinimalSchema.optional().describe('Task author'),
  date_finished_at: DateTimeSchema.optional().nullable(),
  time_estimate: z.object({
    hours: z.number(),
    minutes: z.number()
  }).optional()
}).describe('Task object (detailed)');

// ===== COMMENT SCHEMAS =====

/**
 * Comment object
 */
export const CommentSchema = z.object({
  id: z.number().describe('Comment ID'),
  content: z.string().describe('Comment content'),
  date_add: DateTimeSchema.optional(),
  author: UserMinimalSchema.optional(),
  task_id: z.number().optional().describe('Parent task ID')
}).describe('Comment object');

// ===== WORK REPORT SCHEMAS =====

/**
 * Work Report object
 */
export const WorkReportSchema = z.object({
  id: z.number().describe('Work report ID'),
  date_reported: z.string().describe('Date of work (YYYY-MM-DD)'),
  minutes: z.number().describe('Minutes worked'),
  description: z.string().optional().nullable().describe('Work description'),
  user: UserMinimalSchema.optional(),
  task: TaskMinimalSchema.optional(),
  project_id: z.number().optional().describe('Project ID'),
  date_add: DateTimeSchema.optional()
}).describe('Work report object');

// ===== FILE SCHEMAS =====

/**
 * File object
 */
export const FileSchema = z.object({
  uuid: UuidSchema,
  name: z.string().describe('File name'),
  size: z.number().optional().describe('File size in bytes'),
  mime_type: z.string().optional().describe('MIME type'),
  url: z.string().url().optional().describe('Download URL'),
  date_add: DateTimeSchema.optional(),
  author: UserMinimalSchema.optional()
}).describe('File object');

// ===== NOTE SCHEMAS =====

/**
 * Note object
 */
export const NoteSchema = z.object({
  uuid: UuidSchema,
  name: z.string().describe('Note name'),
  content: z.string().optional().nullable().describe('Note content'),
  date_add: DateTimeSchema.optional(),
  date_edited_at: DateTimeSchema.optional(),
  author: UserMinimalSchema.optional(),
  project_id: z.number().optional().describe('Project ID')
}).describe('Note object');

// ===== NOTIFICATION SCHEMAS =====

/**
 * Notification object
 */
export const NotificationSchema = z.object({
  id: z.number().describe('Notification ID'),
  type: z.string().describe('Notification type'),
  content: z.string().describe('Notification content'),
  date_add: DateTimeSchema.optional(),
  is_read: z.boolean().optional().describe('Is notification read'),
  task: TaskMinimalSchema.optional(),
  author: UserMinimalSchema.optional()
}).describe('Notification object');

// ===== PAGINATED RESPONSE SCHEMAS =====

/**
 * Paginated response wrapper
 */
export function createPaginatedSchema(dataSchema, dataKey = 'data') {
  return z.object({
    total: z.number().describe('Total number of items'),
    count: z.number().describe('Number of items in current page'),
    page: z.number().describe('Current page number (starting from 0)'),
    per_page: z.number().describe('Items per page'),
    [dataKey]: dataSchema.describe('Page data')
  }).describe('Paginated response');
}

// ===== RESPONSE WRAPPER SCHEMAS =====

/**
 * Standard success response
 */
export function createSuccessResponseSchema(dataSchema) {
  return z.object({
    status: z.literal('success').optional(),
    data: dataSchema.optional(),
    message: z.string().optional()
  }).or(dataSchema).describe('Success response');
}

/**
 * Array response
 */
export function createArrayResponseSchema(itemSchema) {
  const schema = z.object({
    items: z.array(itemSchema).describe('Items in the response')
  }).describe('Array response');

  // Mark schema so we can normalize structuredContent for array outputs
  schema._def.freeloArrayResponse = true;
  return schema;
}
