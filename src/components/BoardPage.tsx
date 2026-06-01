"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Status, Ticket } from "@/lib/types";
import { listProfiles, listTickets, updateTicket } from "@/lib/tickets";
import { indexProfiles } from "@/lib/format";
import { useSession } from "./AuthGate";
import { Board } from "./Board";
import { FilterBar, EMPTY_FILTERS, type Filters } from "./FilterBar";
import { CreateTicketDialog } from "./CreateTicketDialog";

export function BoardPage() {
  const router = useRouter();
  const { userId } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([listTickets(), listProfiles()]).then(([t, p]) => {
      if (!active) return;
      setTickets(t);
      setProfiles(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(() => indexProfiles(profiles), [profiles]);

  const labels = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.labels))).sort(),
    [tickets],
  );
  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (q) {
        const hay = `${t.key} ${t.title} ${t.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.assignee === "unassigned" && t.assignees.length > 0)
        return false;
      if (
        filters.assignee &&
        filters.assignee !== "unassigned" &&
        !t.assignees.includes(filters.assignee)
      )
        return false;
      if (filters.label && !t.labels.includes(filters.label)) return false;
      return true;
    });
  }, [tickets, filters]);

  async function onMove(id: string, status: Status) {
    // optimistic
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    try {
      const updated = await updateTicket(id, { status });
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      // revert by reloading on failure
      listTickets().then(setTickets);
    }
  }

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        profiles={profiles}
        labels={labels}
        onNew={() => setCreating(true)}
      />

      {loading ? (
        <p className="py-16 text-center text-sm text-[color:var(--muted)]">
          Loading tickets…
        </p>
      ) : (
        <Board
          tickets={filtered}
          byId={byId}
          onOpen={(id) => router.push(`/ticket/?id=${id}`)}
          onMove={onMove}
        />
      )}

      <CreateTicketDialog
        open={creating}
        onClose={() => setCreating(false)}
        profiles={profiles}
        reporterId={userId}
        onCreated={(t) => setTickets((prev) => [t, ...prev])}
      />
    </div>
  );
}
