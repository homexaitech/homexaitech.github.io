"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Archive, StickyNote, Trash2 } from "lucide-react";
import { Button, Card, Input } from "@/shared/ui";
import type { Note, Profile } from "@/lib/types";
import { noteSchema } from "@/lib/schemas";
import {
  createNote,
  deleteNote,
  listNotes,
  setNoteArchived,
} from "@/lib/notes";
import { profileName, timeAgo } from "@/lib/format";
import { useRole, useSession } from "./AuthGate";

// How many recent (non-archived) notes the dashboard shows. Older ones live in
// the full Notes tab; archiving moves a note out of this list too.
const DASHBOARD_LIMIT = 5;

// Short, shared reminders on the dashboard. Anyone can add; the author or an
// admin can archive/delete (controls only show when allowed — RLS is the real
// fence). Self-contained: fetches and owns its own list. `byId` is the profile
// lookup already loaded by the dashboard, used to label authors.
export function NotesCard({ byId }: { byId: Map<string, Profile> }) {
  const { userId } = useSession();
  const { isAdmin } = useRole();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listNotes()
      .then((n) => {
        if (!active) return;
        setNotes(n);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // The five most recent notes that haven't been archived. listNotes() already
  // returns newest-first, so a slice is enough.
  const recent = useMemo(
    () => notes.filter((n) => !n.archived).slice(0, DASHBOARD_LIMIT),
    [notes],
  );

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = noteSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid note");
      return;
    }
    setSaving(true);
    try {
      const saved = await createNote(parsed.data, userId);
      setNotes((prev) => [saved, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(id: string) {
    try {
      await setNoteArchived(id, true);
      // Keep it in state but flagged — filtering reveals the next note in line.
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, archived: true } : n)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive note");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-[color:var(--primary)]">
            <StickyNote className="h-4 w-4" />
          </span>
          Notes
        </div>
        <Link
          href="/notes"
          className="text-xs text-[color:var(--muted)] hover:text-[color:var(--primary)]"
        >
          View all
        </Link>
      </div>
      <p className="text-xs text-[color:var(--muted)]">
        Short things to keep in mind.
      </p>

      <form onSubmit={onAdd} className="mt-1 flex items-center gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note…"
          maxLength={500}
          aria-label="New note"
        />
        <Button type="submit" size="sm" disabled={saving || !body.trim()}>
          {saving ? "…" : "Add"}
        </Button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {loading ? (
        <p className="py-2 text-sm text-[color:var(--muted)]">Loading…</p>
      ) : recent.length === 0 ? (
        <p className="py-2 text-sm text-[color:var(--muted)]">No notes yet.</p>
      ) : (
        // Fixed window: ~5 rows tall, scroll if the notes wrap to more lines.
        <div className="flex max-h-56 flex-col overflow-y-auto">
          {recent.map((n) => {
            const canModify = isAdmin || n.author === userId;
            return (
              <div
                key={n.id}
                className="flex items-start gap-2 border-t border-[color:var(--border)] py-1.5 text-sm first:border-t-0"
              >
                <span className="min-w-0 flex-1 break-words">{n.body}</span>
                <span className="shrink-0 whitespace-nowrap text-xs text-[color:var(--muted)]">
                  {profileName(n.author, byId)} · {timeAgo(n.created_at)}
                </span>
                {canModify && (
                  <>
                    <button
                      onClick={() => onArchive(n.id)}
                      className="shrink-0 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      title="Archive note"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(n.id)}
                      className="shrink-0 text-[color:var(--muted)] hover:text-red-600"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
