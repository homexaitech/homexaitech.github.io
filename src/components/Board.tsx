"use client";

import { useState } from "react";
import { STATUSES, STATUS_LABELS, type Profile, type Status, type Ticket } from "@/lib/types";
import { cn } from "@/shared/utils";
import { TicketCard } from "./TicketCard";

export function Board({
  tickets,
  byId,
  onOpen,
  onMove,
}: {
  tickets: Ticket[];
  byId: Map<string, Profile>;
  onOpen: (id: string) => void;
  onMove: (id: string, status: Status) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  function drop(status: Status) {
    if (dragId) {
      const t = tickets.find((x) => x.id === dragId);
      if (t && t.status !== status) onMove(dragId, status);
    }
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {STATUSES.map((status) => {
        const col = tickets.filter((t) => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={() => drop(status)}
            className={cn(
              "flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-2 transition",
              overCol === status &&
                "border-[color:var(--primary)] bg-[color:var(--accent)]",
            )}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                {STATUS_LABELS[status]}
              </span>
              <span className="rounded-full bg-white px-1.5 text-xs text-[color:var(--muted)]">
                {col.length}
              </span>
            </div>
            <div className="flex min-h-16 flex-1 flex-col gap-2 p-1">
              {col.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  byId={byId}
                  onOpen={onOpen}
                  onDragStart={setDragId}
                />
              ))}
              {col.length === 0 && (
                <div className="flex flex-1 items-center justify-center py-6 text-xs text-[color:var(--muted)]/60">
                  —
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
