// Hand-written DB contract types for the ticket system. These mirror the SQL
// schema in supabase/migrations exactly (snake_case columns). Keep them in sync
// with the migration — this file is the TypeScript source of truth.

export const TICKET_TYPES = [
  "bug-fix",
  "new-feature",
  "chore",
  "task",
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "in_review",
  "done",
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ACTIVITY_TYPES = [
  "created",
  "status_changed",
  "priority_changed",
  "assigned",
  "commented",
  "edited",
  "link_changed",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// Team-board roles (stored in profiles.role; enforced by RLS). A null role is
// treated as the least-privileged 'viewer' everywhere.
export const ROLES = ["admin", "developer", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  developer: "Developer",
  viewer: "Viewer",
};

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  avatar_color: string | null;
  created_at: string;
  updated_at: string;
};

export type Ticket = {
  id: string;
  key: string;
  title: string;
  description: string;
  type: TicketType;
  status: Status;
  priority: Priority;
  assignees: string[];
  reviewers: string[];
  reporter: string;
  labels: string[];
  file_path: string | null;
  pr_url: string | null;
  commit_sha: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  ticket_id: string;
  author: string;
  body: string;
  created_at: string;
};

export type Activity = {
  id: string;
  ticket_id: string;
  actor: string | null;
  type: ActivityType;
  field: string | null;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
};

// ---- Display metadata --------------------------------------------------------

export const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  in_review: "In Review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TYPE_LABELS: Record<TicketType, string> = {
  "bug-fix": "Bug fix",
  "new-feature": "New feature",
  chore: "Chore",
  task: "Task",
};

import type { Badge } from "@/shared/ui";
type Tone = NonNullable<Parameters<typeof Badge>[0]["tone"]>;

export const PRIORITY_TONE: Record<Priority, Tone> = {
  low: "muted",
  medium: "info",
  high: "warn",
  critical: "danger",
};

export const TYPE_TONE: Record<TicketType, Tone> = {
  "bug-fix": "danger",
  "new-feature": "primary",
  chore: "muted",
  task: "info",
};
