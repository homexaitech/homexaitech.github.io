import type { ActionItem } from "./types";
import type { ActionItemValues, ActionItemUpdateValues } from "./schemas";
import { db, throwIf } from "./db";

export async function listActionItems(): Promise<ActionItem[]> {
  return throwIf(
    await db()
      .from("action_items")
      .select("*")
      .order("created_at", { ascending: false }),
  ) as ActionItem[];
}

export async function createActionItem(
  values: ActionItemValues,
): Promise<ActionItem> {
  return throwIf(
    await db().from("action_items").insert(values).select("*").single(),
  ) as ActionItem;
}

export async function updateActionItem(
  id: string,
  patch: ActionItemUpdateValues,
): Promise<ActionItem> {
  return throwIf(
    await db()
      .from("action_items")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single(),
  ) as ActionItem;
}

export async function deleteActionItem(id: string): Promise<void> {
  throwIf(await db().from("action_items").delete().eq("id", id));
}
