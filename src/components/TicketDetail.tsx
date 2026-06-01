"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/ui";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  TICKET_TYPES,
  TYPE_LABELS,
  TYPE_TONE,
  type Activity,
  type Profile,
  type Ticket,
} from "@/lib/types";
import type { UpdateTicketValues } from "@/lib/schemas";
import {
  deleteTicket,
  getTicket,
  listActivity,
  listProfiles,
  updateTicket,
} from "@/lib/tickets";
import { indexProfiles, profileName, timeAgo } from "@/lib/format";
import { useSession, useRole } from "./AuthGate";
import { AssigneePicker } from "./AssigneePicker";
import { CommentThread } from "./CommentThread";
import { ActivityLog } from "./ActivityLog";

export function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const { userId } = useSession();
  const { isAdmin } = useRole();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [notFound, setNotFound] = useState(false);

  const byId = indexProfiles(profiles);

  const refreshActivity = useCallback(() => {
    listActivity(id).then(setActivity);
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.all([getTicket(id), listProfiles(), listActivity(id)]).then(
      ([t, p, a]) => {
        if (!active) return;
        if (!t) setNotFound(true);
        setTicket(t);
        setProfiles(p);
        setActivity(a);
      },
    );
    return () => {
      active = false;
    };
  }, [id]);

  const patch = useCallback(
    async (partial: UpdateTicketValues) => {
      const updated = await updateTicket(id, partial);
      setTicket(updated);
      refreshActivity();
    },
    [id, refreshActivity],
  );

  async function onDelete() {
    if (!confirm("Delete this ticket permanently?")) return;
    await deleteTicket(id);
    router.replace("/tickets");
  }

  if (notFound) {
    return (
      <div className="py-16 text-center">
        <p className="text-[color:var(--muted)]">Ticket not found.</p>
        <Link
          href="/tickets"
          className="mt-2 inline-block text-sm text-[color:var(--primary)] underline"
        >
          Back to board
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <p className="py-16 text-center text-sm text-[color:var(--muted)]">
        Loading…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" /> Board
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-[color:var(--muted)]">
            {ticket.key}
          </span>
          <Badge tone={TYPE_TONE[ticket.type]}>{TYPE_LABELS[ticket.type]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          <TitleField value={ticket.title} onSave={(title) => patch({ title })} />

          <Card className="p-4">
            <Label className="mb-1.5 block">Description</Label>
            <TextSave
              value={ticket.description}
              placeholder="No description."
              onSave={(description) => patch({ description })}
              multiline
            />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Comments</h3>
            <CommentThread
              ticketId={ticket.id}
              byId={byId}
              currentUserId={userId}
              onActivityChange={refreshActivity}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <FieldSelect
              label="Status"
              value={ticket.status}
              options={STATUSES.map((s) => [s, STATUS_LABELS[s]])}
              onChange={(v) => patch({ status: v as Ticket["status"] })}
            />
            <FieldSelect
              label="Priority"
              value={ticket.priority}
              options={PRIORITIES.map((p) => [p, PRIORITY_LABELS[p]])}
              onChange={(v) => patch({ priority: v as Ticket["priority"] })}
            />
            <FieldSelect
              label="Type"
              value={ticket.type}
              options={TICKET_TYPES.map((t) => [t, TYPE_LABELS[t]])}
              onChange={(v) => patch({ type: v as Ticket["type"] })}
            />
            <div>
              <Label className="mb-1 block">Assignees</Label>
              <AssigneePicker
                profiles={profiles}
                value={ticket.assignees}
                onChange={(ids) => patch({ assignees: ids })}
              />
            </div>
            <div>
              <Label className="mb-1 block">Reviewers</Label>
              <AssigneePicker
                profiles={profiles}
                value={ticket.reviewers}
                onChange={(ids) => patch({ reviewers: ids })}
              />
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <div>
              <Label className="mb-1 block">Labels</Label>
              <TextSave
                value={ticket.labels.join(", ")}
                placeholder="comma, separated"
                onSave={(v) =>
                  patch({
                    labels: v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <LinkField
              label="File path"
              value={ticket.file_path}
              onSave={(v) => patch({ file_path: v || null })}
            />
            <LinkField
              label="PR URL"
              value={ticket.pr_url}
              onSave={(v) => patch({ pr_url: v || null })}
              isLink
            />
            <LinkField
              label="Commit SHA"
              value={ticket.commit_sha}
              onSave={(v) => patch({ commit_sha: v || null })}
            />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Activity</h3>
            <ActivityLog activities={activity} byId={byId} />
          </Card>

          <div className="flex items-center justify-between px-1 text-xs text-[color:var(--muted)]">
            <span>
              {profileName(ticket.reporter, byId)} · {timeAgo(ticket.created_at)}
            </span>
            {isAdmin && (
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1 text-red-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </div>
  );
}

function TitleField({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const t = text.trim();
        if (t && t !== value) onSave(t);
        else setText(value);
      }}
      className="h-auto border-transparent bg-transparent px-1 text-xl font-semibold tracking-tight shadow-none focus-visible:bg-white focus-visible:px-3"
    />
  );
}

function TextSave({
  value,
  placeholder,
  onSave,
  multiline,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = () => {
    if (text !== value) onSave(text);
  };
  if (multiline) {
    return (
      <Textarea
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
      />
    );
  }
  return (
    <Input
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
    />
  );
}

function LinkField({
  label,
  value,
  onSave,
  isLink,
}: {
  label: string;
  value: string | null;
  onSave: (v: string) => void;
  isLink?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label>{label}</Label>
        {isLink && value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-xs text-[color:var(--primary)]"
          >
            open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <TextSave value={value ?? ""} onSave={onSave} placeholder="—" />
    </div>
  );
}
