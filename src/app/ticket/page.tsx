"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { TicketDetail } from "@/components/TicketDetail";

// Ticket detail lives at /ticket?id=<uuid> rather than /tickets/[id] so the
// build can be statically exported (no server to resolve dynamic segments).
function TicketRoute() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <div className="py-16 text-center">
        <p className="text-[color:var(--muted)]">No ticket selected.</p>
        <Link
          href="/tickets"
          className="mt-2 inline-block text-sm text-[color:var(--primary)] underline"
        >
          Back to board
        </Link>
      </div>
    );
  }
  return <TicketDetail id={id} />;
}

export default function TicketPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <p className="py-16 text-center text-sm text-[color:var(--muted)]">
            Loading…
          </p>
        }
      >
        <TicketRoute />
      </Suspense>
    </AuthGate>
  );
}
