"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button, Card, Input } from "@/shared/ui";
import type { Note, Profile } from "@/lib/types";
import { noteSchema } from "@/lib/schemas";
import {
  createNote,
  deleteNote,
  listNotes,
  setNoteArchived,
} from "@/lib/notes";
import { listProfiles } from "@/lib/tickets";
import { indexProfiles, profileName, timeAgo } from "@/lib/format";
import { useRole, useSession } from "./AuthGate";

// The full Notes tab: every note, active and archived. The dashboard shows only
// the five most recent active ones; this is where the rest live and where notes
// get archived/restored/deleted. Anyone can add; author or admin can modify.
export function NotesPage() {
  const { userId } = useSession();
  const { isAdmin } = useRole();
  const [notes, setNotes] = useState<Note[]>([]);
  const [byId, setById] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      listNotes(),
      listProfiles().catch(() => [] as Profile[]),
    ]).then(([n, p]) => {
      if (!active) return;
      setNotes(n);
      setById(indexProfiles(p));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const activeNotes = useMemo(() => notes.filter((n) => !n.archived), [notes]);
  const archivedNotes = useMemo(() => notes.filter((n) => n.archived), [notes]);

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

  async function onSetArchived(id: string, archived: boolean) {
    try {
      const saved = await setNoteArchived(id, archived);
      setNotes((prev) => prev.map((n) => (n.id === id ? saved : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
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

  function NoteRow({ n }: { n: Note }) {
    const canModify = isAdmin || n.author === userId;
    return (
      <Card className="flex items-start gap-3 p-3">
        <span className="min-w-0 flex-1 break-words text-sm">{n.body}</span>
        <span className="shrink-0 whitespace-nowrap text-xs text-[color:var(--muted)]">
          {profileName(n.author, byId)} · {timeAgo(n.created_at)}
        </span>
        {canModify && (
          <div className="flex shrink-0 items-center gap-2">
            {n.archived ? (
              <button
                onClick={() => onSetArchived(n.id, false)}
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                title="Restore to dashboard"
              >
                <ArchiveRestore className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onSetArchived(n.id, true)}
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                title="Archive note"
              >
                <Archive className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(n.id)}
              className="text-[color:var(--muted)] hover:text-red-600"
              title="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Short things to keep in mind. The dashboard shows the five most recent;
          archived notes stay here.
        </p>
      </div>

      <form onSubmit={onAdd} className="flex items-center gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note…"
          maxLength={500}
          aria-label="New note"
        />
        <Button type="submit" disabled={saving || !body.trim()}>
          {saving ? "Adding…" : "Add note"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : notes.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[color:var(--muted)]">
          No notes yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
              Active ({activeNotes.length})
            </h2>
            {activeNotes.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Nothing active.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeNotes.map((n) => (
                  <NoteRow key={n.id} n={n} />
                ))}
              </div>
            )}
          </div>

          {archivedNotes.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                Archived ({archivedNotes.length})
              </h2>
              <div className="flex flex-col gap-2 opacity-70">
                {archivedNotes.map((n) => (
                  <NoteRow key={n.id} n={n} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
