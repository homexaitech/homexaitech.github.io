"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { LayoutGrid, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, Button } from "@/shared/ui";

// Minimal profile shape we read for display. The full role-aware Profile type
// arrives in Phase 1; the smoke test only needs name + avatar color.
type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_color: string | null;
};

type SessionValue = { userId: string; email: string; profile: Profile | null };

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error("useSession must be used within <AuthGate>");
  return v;
}

// Client-side route guard for the static-exported site. Renders children only
// once an authenticated Supabase session is confirmed; otherwise redirects to
// /login. PHASE 0: auth only — team-membership + role gating land in Phase 1.
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authed" | "anon">(
    "loading",
  );
  const [session, setSession] = useState<SessionValue | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setStatus("anon");
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, name, avatar_color")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setSession({
        userId: user.id,
        email: user.email ?? "",
        profile: (profile as Profile | null) ?? null,
      });
      setStatus("authed");
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, current: Session | null) => {
        if (!current) {
          setStatus("anon");
          router.replace("/login");
        }
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (status !== "authed" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <div className="min-h-screen">
        <AppHeader session={session} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </SessionContext.Provider>
  );
}

function AppHeader({ session }: { session: SessionValue }) {
  const router = useRouter();
  const displayName = session.profile?.name || session.email || "You";

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[color:var(--card)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            HomeX Team Board
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={displayName}
              color={session.profile?.avatar_color}
              size="sm"
            />
            <span className="hidden text-sm text-[color:var(--muted)] sm:inline">
              {displayName}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
