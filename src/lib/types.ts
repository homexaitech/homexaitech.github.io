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

// =============================================================================
// Team-board entities (meetings, action items, docs, roadmap, quick links)
// =============================================================================

// ---- Action items ----
export const ACTION_ITEM_STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "done",
] as const;
export type ActionItemStatus = (typeof ACTION_ITEM_STATUSES)[number];

export const ACTION_ITEM_STATUS_LABELS: Record<ActionItemStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export const ACTION_ITEM_STATUS_TONE: Record<ActionItemStatus, Tone> = {
  open: "muted",
  in_progress: "info",
  blocked: "danger",
  done: "success",
};

// ---- Roadmap ----
export const ROADMAP_PHASES = ["mvp", "demo", "beta", "future"] as const;
export type RoadmapPhase = (typeof ROADMAP_PHASES)[number];

export const PHASE_LABELS: Record<RoadmapPhase, string> = {
  mvp: "MVP",
  demo: "Demo",
  beta: "Beta",
  future: "Future",
};

export const PHASE_TONE: Record<RoadmapPhase, Tone> = {
  mvp: "primary",
  demo: "info",
  beta: "warn",
  future: "muted",
};

// The phase treated as "current" for the dashboard focus section. Bump to
// advance the active phase (a movable pointer can replace this later).
export const CURRENT_PHASE: RoadmapPhase = "mvp";

// ---- Documents ----
export const DOC_STATUSES = ["active", "archived"] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

// ---- Suggested categories / types (free-text in DB; drive select options) ----
export const MEETING_CATEGORIES = [
  "Weekly dev",
  "UI review",
  "Backend review",
  "AI / prompt review",
  "Investor demo prep",
  "Product planning",
  "Bug triage",
] as const;

export const DOC_CATEGORIES = [
  "Product Design",
  "Backend",
  "Frontend",
  "AI / Prompt",
  "Energy Analysis",
  "Business",
  "Investor Demo",
  "Meeting Notes",
  "Infrastructure",
] as const;

export const DOC_TYPES = [
  "Google Doc",
  "Google Sheet",
  "Google Drive Folder",
  "GitHub Repo",
  "Figma",
  "PDF",
  "Other",
] as const;

export const ROADMAP_CATEGORIES = [
  "Core product",
  "Energy analysis",
  "AI agent",
  "Device detection",
  "Upgrade recommendation",
  "User profile",
  "Data pipeline",
  "Business development",
] as const;

export const LINK_CATEGORIES = [
  "GitHub",
  "Google Drive",
  "Supabase",
  "Deployment",
  "API docs",
  "Design",
  "Demo",
  "Other",
] as const;

// ---- Row types (mirror the SQL in supabase/migrations exactly) ----
export type Meeting = {
  id: string;
  title: string;
  category: string | null;
  scheduled_at: string | null;
  agenda: string | null;
  notes: string | null;
  decisions: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionItem = {
  id: string;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  completed: boolean;
  ticket_id: string | null;
  meeting_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  title: string;
  url: string;
  category: string | null;
  doc_type: string | null;
  description: string | null;
  status: DocStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  phase: RoadmapPhase;
  category: string | null;
  owner: string | null;
  priority: Priority;
  status: Status;
  ticket_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type QuickLink = {
  id: string;
  title: string;
  url: string;
  category: string | null;
  sensitive: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
