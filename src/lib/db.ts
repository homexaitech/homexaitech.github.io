import { createClient } from "@/utils/supabase/client";

// Lazy accessor — never instantiate the client at module load, so static
// prerendering (`next build`) doesn't construct it (and doesn't need env vars).
// createClient() is memoized, so this returns the one shared instance.
export const db = () => createClient();

// Supabase/PostgREST errors are plain objects ({ message, details, hint, code }),
// not Error instances — so `instanceof Error` checks miss them and they surface
// as "[object Object]" unhandled rejections. Normalize into a real Error carrying
// the underlying Postgres message so failures are legible in the UI and console.
export function asError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === "object") {
    const e = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    const msg = parts.length ? parts.join(" — ") : JSON.stringify(error);
    return new Error(e.code ? `${msg} (${e.code})` : msg);
  }
  return new Error(String(error));
}

export function throwIf<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw asError(error);
  return data;
}
