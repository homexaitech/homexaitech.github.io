import type { Document } from "./types";
import type { DocumentValues, DocumentUpdateValues } from "./schemas";
import { db, throwIf } from "./db";

export async function listDocuments(): Promise<Document[]> {
  return throwIf(
    await db().from("documents").select("*").order("title", { ascending: true }),
  ) as Document[];
}

export async function createDocument(
  values: DocumentValues,
): Promise<Document> {
  return throwIf(
    await db().from("documents").insert(values).select("*").single(),
  ) as Document;
}

export async function updateDocument(
  id: string,
  patch: DocumentUpdateValues,
): Promise<Document> {
  return throwIf(
    await db().from("documents").update(patch).eq("id", id).select("*").single(),
  ) as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  throwIf(await db().from("documents").delete().eq("id", id));
}
