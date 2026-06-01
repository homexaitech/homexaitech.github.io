import type { Profile, Role } from "./types";
import { db, throwIf } from "./db";

// Full roster for the admin Team page, ordered admins → developers → viewers.
export async function listTeam(): Promise<Profile[]> {
  return throwIf(
    await db()
      .from("profiles")
      .select("*")
      .order("role", { ascending: true })
      .order("name", { ascending: true }),
  ) as Profile[];
}

export async function updateProfileRole(
  id: string,
  role: Role,
): Promise<Profile> {
  return throwIf(
    await db().from("profiles").update({ role }).eq("id", id).select("*").single(),
  ) as Profile;
}
