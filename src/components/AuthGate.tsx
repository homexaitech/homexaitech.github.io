"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  CalendarClock,
  FileText,
  LayoutGrid,
  Link2,
  ListChecks,
  LogOut,
  Map as MapIcon,
  StickyNote,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, Button } from "@/shared/ui";
import { cn } from "@/shared/utils";
import { ROLE_LABELS, type Profile, type Role } from "@/lib/types";

type SessionValue = { userId: string; email: string; profile: Profile | null };

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error("useSession must be used within <AuthGate>");
  return v;
}

// Role helpers derived from the session. A null/unknown role is the least
// privileged 'viewer'. These only drive UI affordances — RLS is the real fence.
export function useRole(): { role: Role; isAdmin: boolean; canWrite: boolean } {
  const { profile } = useSession();
  const raw = profile?.role;
  const role: Role =
    raw === "admin" || raw === "developer" || raw === "viewer"
      ? raw
      : "viewer";
  return {
    role,
    isAdmin: role === "admin",
    canWrite: role === "admin" || role === "developer",
  };
}

// Client-side route guard for the static-exported site. Confirms an
// authenticated session AND active team membership before rendering anything
// protected — no protected data flashes before the checks resolve.
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authed" | "anon" | "denied"
  >("loading");
  const [session, setSession] = useState<SessionValue | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!active) return;
      if (userError || !user) {
        // A stale/expired refresh token left in storage (e.g. "Invalid Refresh
        // Token: Refresh Token Not Found") surfaces here. Purge it so the failed
        // refresh doesn't repeat — and spam the console — on every load.
        if (userError) await supabase.auth.signOut().catch(() => {});
        if (!active) return;
        setStatus("anon");
        router.replace("/login");
        return;
      }
      // Authoritative membership check (the allowlist gate). Fail closed: only a
      // confirmed `true` lets the user in; anything else → access denied.
      const { data: isMember } = await supabase.rpc("is_team_member");
      if (!active) return;
      if (isMember !== true) {
        setStatus("denied");
        router.replace("/access-denied");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
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

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/tickets", label: "Tickets", icon: TicketIcon },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/action-items", label: "Actions", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/roadmap", label: "Roadmap", icon: MapIcon },
  { href: "/quick-links", label: "Links", icon: Link2 },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
];

function AppHeader({ session }: { session: SessionValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const displayName = session.profile?.name || session.email || "You";
  const role = session.profile?.role;
  const isAdmin = role === "admin";
  const roleLabel =
    role === "admin" || role === "developer" || role === "viewer"
      ? ROLE_LABELS[role as Role]
      : ROLE_LABELS.viewer;
  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[color:var(--card)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            HomeX Team Board
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition",
                  isActive(item.href)
                    ? "bg-[color:var(--accent)] font-medium text-[color:var(--primary)]"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--accent)]/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-[color:var(--accent)]/50"
            title="Account settings"
          >
            <Avatar
              name={displayName}
              color={session.profile?.avatar_color}
              size="sm"
            />
            <div className="hidden leading-tight sm:block">
              <div className="text-sm">{displayName}</div>
              <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">
                {roleLabel}
              </div>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
