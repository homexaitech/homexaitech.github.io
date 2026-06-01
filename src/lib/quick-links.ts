import type { QuickLink } from "./types";
import type { QuickLinkValues, QuickLinkUpdateValues } from "./schemas";
import { db, throwIf } from "./db";

export async function listQuickLinks(): Promise<QuickLink[]> {
  return throwIf(
    await db()
      .from("quick_links")
      .select("*")
      .order("title", { ascending: true }),
  ) as QuickLink[];
}

export async function createQuickLink(
  values: QuickLinkValues,
): Promise<QuickLink> {
  return throwIf(
    await db().from("quick_links").insert(values).select("*").single(),
  ) as QuickLink;
}

export async function updateQuickLink(
  id: string,
  patch: QuickLinkUpdateValues,
): Promise<QuickLink> {
  return throwIf(
    await db()
      .from("quick_links")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single(),
  ) as QuickLink;
}

export async function deleteQuickLink(id: string): Promise<void> {
  throwIf(await db().from("quick_links").delete().eq("id", id));
}
