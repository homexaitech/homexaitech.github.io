"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/shared/ui";

// Shown when a user is authenticated but NOT an active team member (or lacks
// the role for a page). Not wrapped in AuthGate — that would redirect-loop.
export default function AccessDeniedPage() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="bg-grid-soft flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--primary)]">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Your account isn&apos;t on the HomeX team allowlist. Ask a team admin to
          add you, then sign in again.
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
