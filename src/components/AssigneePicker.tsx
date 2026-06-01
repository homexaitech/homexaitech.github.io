"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/utils";
import type { Profile } from "@/lib/types";

// Multi-select roster picker. A flat list of equal assignees — click to toggle.
// Used by both the create dialog and the ticket detail sidebar.
export function AssigneePicker({
  profiles,
  value,
  onChange,
}: {
  profiles: Profile[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }

  if (profiles.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)]">No team members yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {profiles.map((p) => {
        const selected = value.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition",
              selected
                ? "border-[color:var(--primary)]/40 bg-[color:var(--accent)]"
                : "border-transparent hover:bg-[color:var(--accent)]/50",
            )}
          >
            <Avatar name={p.name || p.email || "?"} color={p.avatar_color} size="sm" />
            <span className="flex-1 truncate">{p.name || p.email}</span>
            {selected && (
              <Check className="h-4 w-4 text-[color:var(--primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
