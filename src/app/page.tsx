"use client";

import Link from "next/link";
import { Ticket as TicketIcon, ArrowRight } from "lucide-react";
import { AuthGate, useSession, useRole } from "@/components/AuthGate";
import { Card } from "@/shared/ui";
import { ROLE_LABELS } from "@/lib/types";

export default function DashboardPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}

function Dashboard() {
  const { email, profile } = useSession();
  const { role } = useRole();
  const name = profile?.name || email;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome, {name}
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          You&apos;re signed in as <strong>{ROLE_LABELS[role]}</strong>. The full
          dashboard (sprint focus, blockers, meetings, docs, roadmap) is coming
          soon.
        </p>
      </div>

      <Link href="/tickets" className="block">
        <Card className="flex items-center gap-4 p-5 transition hover:border-[color:var(--primary)]/30 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--accent)] text-[color:var(--primary)]">
            <TicketIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-medium">Tickets</div>
            <div className="text-sm text-[color:var(--muted)]">
              Development, debugging and dispatch board.
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[color:var(--muted)]" />
        </Card>
      </Link>
    </div>
  );
}
