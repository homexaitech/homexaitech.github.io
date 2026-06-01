"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, MapPin, Plus, Repeat, Trash2, Video } from "lucide-react";
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
import {
  MEETING_CATEGORIES,
  RECURRENCES,
  RECURRENCE_LABELS,
  type Meeting,
} from "@/lib/types";
import { meetingSchema } from "@/lib/schemas";
import {
  createMeeting,
  deleteMeeting,
  listMeetings,
  updateMeeting,
} from "@/lib/meetings";
import {
  formatInLocal,
  localTimezone,
  timezoneOptions,
  utcToZonedWall,
  zonedWallToUtc,
} from "@/lib/tz";
import { useRole } from "./AuthGate";

function isUrl(s: string): boolean {
  return /^https?:\/\//.test(s);
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
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.title}</span>
                    {m.category && <Badge tone="muted">{m.category}</Badge>}
                    {m.recurrence !== "none" && (
                      <Badge tone="info" className="gap-1">
                        <Repeat className="h-3 w-3" />
                        {RECURRENCE_LABELS[m.recurrence]}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {m.scheduled_at
                        ? formatInLocal(m.scheduled_at)
                        : "No date set"}
                    </span>
                    {m.location &&
                      (isUrl(m.location) ? (
                        <a
                          href={m.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[color:var(--primary)] hover:underline"
                        >
                          <Video className="h-3.5 w-3.5" /> Join
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {m.location}
                        </span>
                      ))}
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
  const tz = meeting?.timezone || localTimezone();
  const [form, setForm] = useState({
    title: meeting?.title ?? "",
    category: meeting?.category ?? "",
    wall: meeting?.scheduled_at ? utcToZonedWall(meeting.scheduled_at, tz) : "",
    timezone: tz,
    recurrence: meeting?.recurrence ?? "none",
    location: meeting?.location ?? "",
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
    const parsed = meetingSchema.safeParse({
      title: form.title,
      category: form.category,
      scheduled_at: form.wall ? zonedWallToUtc(form.wall, form.timezone) : "",
      timezone: form.wall ? form.timezone : "",
      location: form.location,
      recurrence: form.recurrence,
      agenda: form.agenda,
      notes: form.notes,
      decisions: form.decisions,
    });
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

  const tzOptions = timezoneOptions();

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
            <Label>Repeats</Label>
            <Select
              value={form.recurrence}
              onChange={(e) => field("recurrence", e.target.value)}
              className="mt-1"
            >
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="wall">When</Label>
            <Input
              id="wall"
              type="datetime-local"
              value={form.wall}
              onChange={(e) => field("wall", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Timezone</Label>
            <Select
              value={form.timezone}
              onChange={(e) => field("timezone", e.target.value)}
              className="mt-1"
            >
              {tzOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => field("location", e.target.value)}
            className="mt-1"
            placeholder="Meet/Zoom link, or a physical room"
          />
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Paste a video link (shows a “Join” button) or type a room name.
          </p>
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
