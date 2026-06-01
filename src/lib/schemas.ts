import { z } from "zod";
import {
  ACTION_ITEM_STATUSES,
  DOC_STATUSES,
  PRIORITIES,
  RECURRENCES,
  ROADMAP_PHASES,
  ROLES,
  STATUSES,
  TICKET_TYPES,
} from "./types";

// Empty string -> undefined, then trim. Keeps optional link/text fields clean.
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .refine(
    (v) => v === undefined || /^https?:\/\/.+/.test(v),
    "Must be a valid http(s) URL",
  );

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(10000).optional().default(""),
  type: z.enum(TICKET_TYPES).default("task"),
  priority: z.enum(PRIORITIES).default("medium"),
  assignees: z.array(z.string().uuid()).default([]),
  reviewers: z.array(z.string().uuid()).default([]),
  labels: z.array(z.string().trim().min(1)).default([]),
  file_path: optionalText,
  pr_url: optionalUrl,
  commit_sha: optionalText,
});

export type CreateTicketInput = z.input<typeof createTicketSchema>;
export type CreateTicketValues = z.output<typeof createTicketSchema>;

// Partial update — every field optional. status included (board drag / detail).
export const updateTicketSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(10000).optional(),
  type: z.enum(TICKET_TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignees: z.array(z.string().uuid()).optional(),
  reviewers: z.array(z.string().uuid()).optional(),
  labels: z.array(z.string().trim().min(1)).optional(),
  file_path: z.string().nullable().optional(),
  pr_url: z.string().nullable().optional(),
  commit_sha: z.string().nullable().optional(),
});

export type UpdateTicketValues = z.output<typeof updateTicketSchema>;

// =============================================================================
// Team-board entities
// =============================================================================

// Optional uuid that also accepts "" (from an unselected <select>) -> undefined.
const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal("").transform(() => undefined));

const requiredUrl = z
  .string()
  .trim()
  .min(1, "URL is required")
  .refine((v) => /^https?:\/\/.+/.test(v), "Must be a valid http(s) URL");

const title = z.string().trim().min(1, "Title is required").max(200);

// ---- Meetings ----
export const meetingSchema = z.object({
  title,
  category: optionalText,
  scheduled_at: optionalText,
  timezone: optionalText,
  location: optionalText,
  recurrence: z.enum(RECURRENCES).default("none"),
  agenda: optionalText,
  notes: optionalText,
  decisions: optionalText,
});
export const meetingUpdateSchema = meetingSchema.partial();
export type MeetingValues = z.output<typeof meetingSchema>;
export type MeetingUpdateValues = z.output<typeof meetingUpdateSchema>;

// ---- Action items ----
export const actionItemSchema = z.object({
  title,
  owner: optionalUuid,
  due_date: optionalText,
  status: z.enum(ACTION_ITEM_STATUSES).default("open"),
  completed: z.boolean().default(false),
  ticket_id: optionalUuid,
  meeting_id: optionalUuid,
});
export const actionItemUpdateSchema = actionItemSchema.partial();
export type ActionItemValues = z.output<typeof actionItemSchema>;
export type ActionItemUpdateValues = z.output<typeof actionItemUpdateSchema>;

// ---- Documents ----
export const documentSchema = z.object({
  title,
  url: requiredUrl,
  category: optionalText,
  doc_type: optionalText,
  description: optionalText,
  status: z.enum(DOC_STATUSES).default("active"),
});
export const documentUpdateSchema = documentSchema.partial();
export type DocumentValues = z.output<typeof documentSchema>;
export type DocumentUpdateValues = z.output<typeof documentUpdateSchema>;

// ---- Roadmap items ----
export const roadmapItemSchema = z.object({
  title,
  description: optionalText,
  phase: z.enum(ROADMAP_PHASES).default("mvp"),
  category: optionalText,
  owner: optionalUuid,
  priority: z.enum(PRIORITIES).default("medium"),
  status: z.enum(STATUSES).default("open"),
  ticket_id: optionalUuid,
});
export const roadmapItemUpdateSchema = roadmapItemSchema.partial();
export type RoadmapItemValues = z.output<typeof roadmapItemSchema>;
export type RoadmapItemUpdateValues = z.output<typeof roadmapItemUpdateSchema>;

// ---- Quick links ----
export const quickLinkSchema = z.object({
  title,
  url: requiredUrl,
  category: optionalText,
  sensitive: z.boolean().default(false),
});
export const quickLinkUpdateSchema = quickLinkSchema.partial();
export type QuickLinkValues = z.output<typeof quickLinkSchema>;
export type QuickLinkUpdateValues = z.output<typeof quickLinkUpdateSchema>;

// ---- Profile role management (admin) ----
export const updateRoleSchema = z.object({ role: z.enum(ROLES) });
