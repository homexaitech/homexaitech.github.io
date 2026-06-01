import type { Note } from "./types";
import type { NoteValues } from "./schemas";
import { db, throwIf } from "./db";

// Newest first — notes are short reminders, most-recent matters most.
export async function listNotes(): Promise<Note[]> {
  return throwIf(
    await db()
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false }),
  ) as Note[];
}

// `author` must equal the signed-in user (RLS enforces this; the column also
// defaults to auth.uid()). Pass it explicitly so the row is complete on return.
export async function createNote(
  values: NoteValues,
  author: string,
): Promise<Note> {
  return throwIf(
    await db()
      .from("notes")
      .insert({ ...values, author })
      .select("*")
      .single(),
  ) as Note;
}

// Archive (or restore) a note. Archived notes drop off the dashboard's recent
// list but remain in the full Notes tab. RLS limits this to author/admin.
export async function setNoteArchived(
  id: string,
  archived: boolean,
): Promise<Note> {
  return throwIf(
    await db()
      .from("notes")
      .update({ archived })
      .eq("id", id)
      .select("*")
      .single(),
  ) as Note;
}

export async function deleteNote(id: string): Promise<void> {
  throwIf(await db().from("notes").delete().eq("id", id));
}
