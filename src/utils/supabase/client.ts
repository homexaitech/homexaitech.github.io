import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Browser-only Supabase client, memoized to a single instance. There is no
// server client in this app — the whole UI talks to Supabase directly from the
// browser, gated by RLS + the team email allowlist. The publishable key is
// public by design. A single shared instance avoids "multiple GoTrueClient"
// warnings and keeps one auth session across the app.
//
// Typed as SupabaseClient (not `ReturnType<typeof createBrowserClient>`, which
// broadens auth method results to `any`) so auth calls stay type-checked.
let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return browserClient;
}
