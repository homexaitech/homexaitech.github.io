import type { Profile } from "./types";

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function profileName(
  id: string | null | undefined,
  byId: Map<string, Profile>,
): string {
  if (!id) return "Unassigned";
  const p = byId.get(id);
  return p?.name || p?.email || "Unknown";
}

export function indexProfiles(profiles: Profile[]): Map<string, Profile> {
  return new Map(profiles.map((p) => [p.id, p]));
}
