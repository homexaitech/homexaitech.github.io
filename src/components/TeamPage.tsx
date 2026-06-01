"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Card, Select } from "@/shared/ui";
import { ROLES, ROLE_LABELS, type Profile, type Role } from "@/lib/types";
import { listTeam, updateProfileRole } from "@/lib/profiles";
import { useRole, useSession } from "./AuthGate";

const ROLE_TONE: Record<Role, "primary" | "info" | "muted"> = {
  admin: "primary",
  developer: "info",
  viewer: "muted",
};

export function TeamPage() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const { userId } = useSession();
  const [team, setTeam] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin-only page; UI guard (RLS is the real enforcement).
  useEffect(() => {
    if (!isAdmin) router.replace("/access-denied");
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    listTeam().then((t) => {
      if (!active) return;
      setTeam(t);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  async function changeRole(id: string, role: Role) {
    setError(null);
    const prev = team;
    setTeam((t) => t.map((p) => (p.id === id ? { ...p, role } : p)));
    try {
      await updateProfileRole(id, role);
    } catch (err) {
      setTeam(prev); // revert
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Manage member roles. Viewers are read-only; developers can create and
          edit; admins can also delete and manage the team.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : (
        <Card className="divide-y divide-[color:var(--border)]">
          {team.map((p) => {
            const role: Role =
              p.role === "admin" || p.role === "developer" || p.role === "viewer"
                ? p.role
                : "viewer";
            return (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <Avatar
                  name={p.name || p.email || "?"}
                  color={p.avatar_color}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {p.name || "—"}
                    {p.id === userId && (
                      <span className="ml-1 text-xs text-[color:var(--muted)]">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-[color:var(--muted)]">
                    {p.email}
                  </div>
                </div>
                <Badge tone={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>
                <Select
                  value={role}
                  onChange={(e) => changeRole(p.id, e.target.value as Role)}
                  className="w-auto"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
