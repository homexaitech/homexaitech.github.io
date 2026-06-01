import type { Meeting } from "./types";
import type { MeetingValues, MeetingUpdateValues } from "./schemas";
import { db, throwIf } from "./db";

export async function listMeetings(): Promise<Meeting[]> {
  return throwIf(
    await db()
      .from("meetings")
      .select("*")
      .order("scheduled_at", { ascending: false, nullsFirst: false }),
  ) as Meeting[];
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  return throwIf(
    await db().from("meetings").select("*").eq("id", id).maybeSingle(),
  ) as Meeting | null;
}

export async function createMeeting(values: MeetingValues): Promise<Meeting> {
  return throwIf(
    await db().from("meetings").insert(values).select("*").single(),
  ) as Meeting;
}

export async function updateMeeting(
  id: string,
  patch: MeetingUpdateValues,
): Promise<Meeting> {
  return throwIf(
    await db().from("meetings").update(patch).eq("id", id).select("*").single(),
  ) as Meeting;
}

export async function deleteMeeting(id: string): Promise<void> {
  throwIf(await db().from("meetings").delete().eq("id", id));
}
