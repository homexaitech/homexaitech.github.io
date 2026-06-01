import type { Activity, Comment, Profile, Ticket } from "./types";
import type { CreateTicketValues, UpdateTicketValues } from "./schemas";
import { db, throwIf, asError } from "./db";

// ---- Tickets ----------------------------------------------------------------

export async function listTickets(): Promise<Ticket[]> {
  return throwIf(
    await db()
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false }),
  ) as Ticket[];
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const { data, error } = await db()
    .from("tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw asError(error);
  return data as Ticket | null;
}

export async function createTicket(
  values: CreateTicketValues,
  reporter: string,
): Promise<Ticket> {
  const row = {
    title: values.title,
    description: values.description ?? "",
    type: values.type,
    priority: values.priority,
    assignees: values.assignees ?? [],
    reviewers: values.reviewers ?? [],
    reporter,
    labels: values.labels ?? [],
    file_path: values.file_path ?? null,
    pr_url: values.pr_url ?? null,
    commit_sha: values.commit_sha ?? null,
  };
  return throwIf(
    await db().from("tickets").insert(row).select("*").single(),
  ) as Ticket;
}

export async function updateTicket(
  id: string,
  patch: UpdateTicketValues,
): Promise<Ticket> {
  return throwIf(
    await db()
      .from("tickets")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single(),
  ) as Ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  const { error } = await db().from("tickets").delete().eq("id", id);
  if (error) throw asError(error);
}

// ---- Comments ---------------------------------------------------------------

export async function listComments(ticketId: string): Promise<Comment[]> {
  return throwIf(
    await db()
      .from("comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ) as Comment[];
}

export async function addComment(
  ticketId: string,
  author: string,
  body: string,
): Promise<Comment> {
  return throwIf(
    await db()
      .from("comments")
      .insert({ ticket_id: ticketId, author, body })
      .select("*")
      .single(),
  ) as Comment;
}

// ---- Activity ---------------------------------------------------------------

export async function listActivity(ticketId: string): Promise<Activity[]> {
  return throwIf(
    await db()
      .from("activity")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false }),
  ) as Activity[];
}

// ---- Profiles ---------------------------------------------------------------

export async function listProfiles(): Promise<Profile[]> {
  return throwIf(
    await db().from("profiles").select("*").order("name"),
  ) as Profile[];
}

// ---- Auth helpers -----------------------------------------------------------

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await db().auth.getUser();
  return user?.id ?? null;
}
