import { z } from "zod";
import { PRIORITIES, STATUSES, TICKET_TYPES } from "./types";

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
