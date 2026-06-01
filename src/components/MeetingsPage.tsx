"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/ui";
import { MEETING_CATEGORIES, type Meeting } from "@/lib/types";
import { meetingSchema } from "@/lib/schemas";
import {
  createMeeting,
  deleteMeeting,
  listMeetings,
  updateMeeting,
} from "@/lib/meetings";
import { useRole } from "./AuthGate";

function fmtDate(iso: string | null): string {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MeetingsPage() {
  const { canWrite, isAdmin } = useRole();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    listMeetings().then((m) => {
      if (!active) return;
      setMeetings(m);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function upsert(m: Meeting) {
    setMeetings((prev) => {
      const i = prev.findIndex((x) => x.id === m.id);
      if (i === -1) return [m, ...prev];
      const next = [...prev];
      next[i] = m;
      return next;
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this meeting?")) return;
    await deleteMeeting(id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Meetings</h1>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New meeting
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : meetings.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[color:var(--muted)]">
          No meetings yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => (
            <Card key={m.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.title}</span>
                    {m.category && <Badge tone="muted">{m.category}</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--muted)]">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {fmtDate(m.scheduled_at)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canWrite && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing(m)}
                    >
                      Edit
                    </Button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(m.id)}
                      className="text-[color:var(--muted)] hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {m.agenda && (
                <p className="whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                  {m.agenda}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <MeetingDialog
          meeting={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(m) => {
            upsert(m);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function MeetingDialog({
  meeting,
  onClose,
  onSaved,
}: {
  meeting: Meeting | null;
  onClose: () => void;
  onSaved: (m: Meeting) => void;
}) {
  const [form, setForm] = useState({
    title: meeting?.title ?? "",
    category: meeting?.category ?? "",
    scheduled_at: meeting?.scheduled_at
      ? meeting.scheduled_at.slice(0, 16)
      : "",
    agenda: meeting?.agenda ?? "",
    notes: meeting?.notes ?? "",
    decisions: meeting?.decisions ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = meetingSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const saved = meeting
        ? await updateMeeting(meeting.id, parsed.data)
        : await createMeeting(parsed.data);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={meeting ? "Edit meeting" : "New meeting"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            className="mt-1"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onChange={(e) => field("category", e.target.value)}
              className="mt-1"
            >
              <option value="">—</option>
              {MEETING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="scheduled_at">When</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => field("scheduled_at", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="agenda">Agenda</Label>
          <Textarea
            id="agenda"
            value={form.agenda}
            onChange={(e) => field("agenda", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => field("notes", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="decisions">Decisions</Label>
          <Textarea
            id="decisions"
            value={form.decisions}
            onChange={(e) => field("decisions", e.target.value)}
            className="mt-1"
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : meeting ? "Save changes" : "Create meeting"}
        </Button>
      </form>
    </Dialog>
  );
}
