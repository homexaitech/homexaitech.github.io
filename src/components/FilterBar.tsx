"use client";

import { Plus, Search } from "lucide-react";
import { Button, Input, Select } from "@/shared/ui";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Profile,
} from "@/lib/types";
import { useRole } from "./AuthGate";

export type Filters = {
  q: string;
  status: string;
  priority: string;
  assignee: string;
  label: string;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  status: "",
  priority: "",
  assignee: "",
  label: "",
};

export function FilterBar({
  filters,
  onChange,
  profiles,
  labels,
  onNew,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  profiles: Profile[];
  labels: string[];
  onNew: () => void;
}) {
  const { canWrite } = useRole();

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
        <Input
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search title, key, description…"
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        className="w-auto"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select
        value={filters.priority}
        onChange={(e) => set("priority", e.target.value)}
        className="w-auto"
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </Select>

      <Select
        value={filters.assignee}
        onChange={(e) => set("assignee", e.target.value)}
        className="w-auto"
      >
        <option value="">Anyone</option>
        <option value="unassigned">Unassigned</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || p.email}
          </option>
        ))}
      </Select>

      {labels.length > 0 && (
        <Select
          value={filters.label}
          onChange={(e) => set("label", e.target.value)}
          className="w-auto"
        >
          <option value="">All labels</option>
          {labels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      )}

      {canWrite && (
        <Button onClick={onNew} className="ml-auto">
          <Plus className="h-4 w-4" />
          New ticket
        </Button>
      )}
    </div>
  );
}
