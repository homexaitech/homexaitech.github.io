"use client";

import { CheckCircle2 } from "lucide-react";
import { AuthGate, useSession } from "@/components/AuthGate";
import { Card } from "@/shared/ui";

export default function HomePage() {
  return (
    <AuthGate>
      <Landing />
    </AuthGate>
  );
}

function Landing() {
  const { email } = useSession();
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--primary)]">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Login works 🎉
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          You are signed in as{" "}
          <span className="font-medium text-[color:var(--foreground)]">
            {email}
          </span>
          .
        </p>
        <p className="max-w-sm text-xs text-[color:var(--muted)]">
          This is the Phase&nbsp;0 smoke test for the HomeX Team Board. Auth +
          static hosting on GitHub Pages are confirmed working. Dashboard,
          tickets, meetings, docs, roadmap and roles come next.
        </p>
      </Card>
    </div>
  );
}
