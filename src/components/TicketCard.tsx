"use client";

import { Eye, GitPullRequest } from "lucide-react";
import { Avatar, Badge } from "@/shared/ui";
import type { Profile, Ticket } from "@/lib/types";
import { PRIORITY_LABELS, PRIORITY_TONE, TYPE_LABELS, TYPE_TONE } from "@/lib/types";

// Resolve a list of profile ids to profiles, dropping any that no longer exist.
function resolve(ids: string[], byId: Map<string, Profile>): Profile[] {
  return ids.map((id) => byId.get(id)).filter((p): p is Profile => !!p);
}

// Overlapping avatars; shows up to 3 then "+N".
function AvatarStack({ people }: { people: Profile[] }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {people.slice(0, 3).map((p) => (
        <Avatar
          key={p.id}
          name={p.name || p.email || "?"}
          color={p.avatar_color}
          size="sm"
          className="ring-2 ring-white"
        />
      ))}
      {people.length > 3 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-semibold text-[color:var(--primary)] ring-2 ring-white">
          +{people.length - 3}
        </span>
      )}
    </div>
  );
}

export function TicketCard({
  ticket,
  byId,
  onOpen,
  onDragStart,
}: {
  ticket: Ticket;
  byId: Map<string, Profile>;
  onOpen: (id: string) => void;
  onDragStart?: (id: string) => void;
}) {
  const assignees = resolve(ticket.assignees, byId);
  const reviewers = resolve(ticket.reviewers, byId);
  const showReviewers = ticket.status === "in_review" && reviewers.length > 0;

  return (
    <button
      type="button"
      draggable={!!onDragStart}
      onDragStart={() => onDragStart?.(ticket.id)}
      onClick={() => onOpen(ticket.id)}
      className="group w-full cursor-pointer rounded-xl border border-[color:var(--border)] bg-white p-3 text-left shadow-[0_1px_2px_rgba(17,23,18,0.04)] transition hover:border-[color:var(--primary)]/30 hover:shadow-md"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-[color:var(--muted)]">
          {ticket.key}
        </span>
        <Badge tone={TYPE_TONE[ticket.type]}>{TYPE_LABELS[ticket.type]}</Badge>
      </div>

      <p className="line-clamp-2 text-sm font-medium leading-snug text-[color:var(--foreground)]">
        {ticket.title}
      </p>

      {ticket.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ticket.labels.map((l) => (
            <span
              key={l}
              className="rounded-md bg-[color:var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--primary)]"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge tone={PRIORITY_TONE[ticket.priority]}>
          {PRIORITY_LABELS[ticket.priority]}
        </Badge>
        <div className="flex items-center gap-2 text-[color:var(--muted)]">
          {ticket.pr_url && <GitPullRequest className="h-3.5 w-3.5" />}
          {assignees.length > 0 ? (
            <AvatarStack people={assignees} />
          ) : (
            <span className="h-6 w-6 rounded-full border border-dashed border-[color:var(--border)]" />
          )}
        </div>
      </div>

      {showReviewers && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-[color:var(--border)] pt-2 text-[color:var(--muted)]">
          <Eye className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">
            Reviewed by
          </span>
          <span className="ml-auto">
            <AvatarStack people={reviewers} />
          </span>
        </div>
      )}
    </button>
  );
}
