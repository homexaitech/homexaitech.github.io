"use client";

import {
  GitBranch,
  MessageSquare,
  PencilLine,
  Plus,
  SignpostBig,
  UserCheck,
} from "lucide-react";
import type { Activity, Profile } from "@/lib/types";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Priority,
  type Status,
} from "@/lib/types";
import { profileName, timeAgo } from "@/lib/format";

function describe(a: Activity, byId: Map<string, Profile>): string {
  switch (a.type) {
    case "created":
      return `created ${a.to_value ?? "this ticket"}`;
    case "status_changed":
      return `moved ${label(a.from_value, STATUS_LABELS)} → ${label(
        a.to_value,
        STATUS_LABELS,
      )}`;
    case "priority_changed":
      return `set priority ${label(a.from_value, PRIORITY_LABELS)} → ${label(
        a.to_value,
        PRIORITY_LABELS,
      )}`;
    case "assigned": {
      const noun = a.field === "reviewers" ? "reviewers" : "assignees";
      const names = (a.to_value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => profileName(id, byId));
      return names.length
        ? `set ${noun} to ${names.join(", ")}`
        : `cleared all ${noun}`;
    }
    case "link_changed":
      return `updated ${a.field?.replace("_", " ")}`;
    case "edited":
      return `edited the ${a.field}`;
    case "commented":
      return "commented";
    default:
      return a.type;
  }
}

function label<T extends string>(
  v: string | null,
  map: Record<T, string>,
): string {
  if (!v) return "—";
  return (map as Record<string, string>)[v] ?? v;
}

function icon(type: Activity["type"]) {
  switch (type) {
    case "created":
      return Plus;
    case "status_changed":
      return SignpostBig;
    case "priority_changed":
      return GitBranch;
    case "assigned":
      return UserCheck;
    case "commented":
      return MessageSquare;
    default:
      return PencilLine;
  }
}

export function ActivityLog({
  activities,
  byId,
}: {
  activities: Activity[];
  byId: Map<string, Profile>;
}) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)]">No activity yet.</p>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {activities.map((a) => {
        const Icon = icon(a.type);
        return (
          <li key={a.id} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--primary)]">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="text-[color:var(--foreground)]">
              <span className="font-medium">{profileName(a.actor, byId)}</span>{" "}
              <span className="text-[color:var(--muted)]">
                {describe(a, byId)}
              </span>{" "}
              <span className="text-xs text-[color:var(--muted)]">
                · {timeAgo(a.created_at)}
              </span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
