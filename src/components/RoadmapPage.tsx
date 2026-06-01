"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/ui";
import {
  PHASE_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_TONE,
  ROADMAP_CATEGORIES,
  ROADMAP_PHASES,
  STATUS_LABELS,
  STATUSES,
  type Profile,
  type RoadmapItem,
} from "@/lib/types";
import { roadmapItemSchema } from "@/lib/schemas";
import {
  createRoadmapItem,
  deleteRoadmapItem,
  listRoadmapItems,
  updateRoadmapItem,
} from "@/lib/roadmap";
import { listProfiles } from "@/lib/tickets";
import { indexProfiles, profileName } from "@/lib/format";
import { useRole } from "./AuthGate";

export function RoadmapPage() {
  const { canWrite, isAdmin } = useRole();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [creating, setCreating] = useState(false);

  const byId = useMemo(() => indexProfiles(profiles), [profiles]);

  useEffect(() => {
    let active = true;
    Promise.all([listRoadmapItems(), listProfiles()]).then(([r, p]) => {
      if (!active) return;
      setItems(r);
      setProfiles(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function upsert(r: RoadmapItem) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === r.id);
      if (i === -1) return [...prev, r];
      const next = [...prev];
      next[i] = r;
      return next;
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this roadmap item?")) return;
    await deleteRoadmapItem(id);
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Roadmap</h1>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New item
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ROADMAP_PHASES.map((phase) => {
            const list = items.filter((r) => r.phase === phase);
            return (
              <div key={phase} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{PHASE_LABELS[phase]}</h2>
                  <span className="text-xs text-[color:var(--muted)]">
                    {list.length}
                  </span>
                </div>
                {list.map((r) => {
                  const owner = r.owner ? byId.get(r.owner) : null;
                  return (
                    <Card key={r.id} className="flex flex-col gap-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{r.title}</span>
                        {isAdmin && (
                          <button
                            onClick={() => onDelete(r.id)}
                            className="shrink-0 text-[color:var(--muted)] hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {r.description && (
                        <p className="line-clamp-3 text-xs text-[color:var(--muted)]">
                          {r.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={PRIORITY_TONE[r.priority]}>
                          {PRIORITY_LABELS[r.priority]}
                        </Badge>
                        <Badge tone="muted">{STATUS_LABELS[r.status]}</Badge>
                        {r.category && <Badge tone="muted">{r.category}</Badge>}
                        <span className="ml-auto flex items-center gap-1">
                          {owner && (
                            <Avatar
                              name={profileName(r.owner, byId)}
                              color={owner.avatar_color}
                              size="sm"
                            />
                          )}
                          {canWrite && (
                            <button
                              onClick={() => setEditing(r)}
                              className="text-xs text-[color:var(--primary)] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <RoadmapDialog
          item={editing}
          profiles={profiles}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(r) => {
            upsert(r);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RoadmapDialog({
  item,
  profiles,
  onClose,
  onSaved,
}: {
  item: RoadmapItem | null;
  profiles: Profile[];
  onClose: () => void;
  onSaved: (r: RoadmapItem) => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    phase: item?.phase ?? "mvp",
    category: item?.category ?? "",
    owner: item?.owner ?? "",
    priority: item?.priority ?? "medium",
    status: item?.status ?? "open",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = roadmapItemSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const saved = item
        ? await updateRoadmapItem(item.id, parsed.data)
        : await createRoadmapItem(parsed.data);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={item ? "Edit roadmap item" : "New roadmap item"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            className="mt-1"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Phase</Label>
            <Select
              value={form.phase}
              onChange={(e) => field("phase", e.target.value)}
              className="mt-1"
            >
              {ROADMAP_PHASES.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onChange={(e) => field("category", e.target.value)}
              className="mt-1"
            >
              <option value="">—</option>
              {ROADMAP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onChange={(e) => field("priority", e.target.value)}
              className="mt-1"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => field("status", e.target.value)}
              className="mt-1"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label>Owner</Label>
          <Select
            value={form.owner}
            onChange={(e) => field("owner", e.target.value)}
            className="mt-1"
          >
            <option value="">Unassigned</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.email}
              </option>
            ))}
          </Select>
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : item ? "Save changes" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}
