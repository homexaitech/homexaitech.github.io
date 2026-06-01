import type { RoadmapItem } from "./types";
import type { RoadmapItemValues, RoadmapItemUpdateValues } from "./schemas";
import { db, throwIf } from "./db";

export async function listRoadmapItems(): Promise<RoadmapItem[]> {
  return throwIf(
    await db()
      .from("roadmap_items")
      .select("*")
      .order("created_at", { ascending: true }),
  ) as RoadmapItem[];
}

export async function createRoadmapItem(
  values: RoadmapItemValues,
): Promise<RoadmapItem> {
  return throwIf(
    await db().from("roadmap_items").insert(values).select("*").single(),
  ) as RoadmapItem;
}

export async function updateRoadmapItem(
  id: string,
  patch: RoadmapItemUpdateValues,
): Promise<RoadmapItem> {
  return throwIf(
    await db()
      .from("roadmap_items")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single(),
  ) as RoadmapItem;
}

export async function deleteRoadmapItem(id: string): Promise<void> {
  throwIf(await db().from("roadmap_items").delete().eq("id", id));
}
