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
} from "@/shared/ui";
import {
  ACTION_ITEM_STATUSES,
  ACTION_ITEM_STATUS_LABELS,
  ACTION_ITEM_STATUS_TONE,
  type ActionItem,
  type Profile,
} from "@/lib/types";
import { actionItemSchema } from "@/lib/schemas";
import {
  createActionItem,
  deleteActionItem,
  listActionItems,
  updateActionItem,
} from "@/lib/action-items";
import { listProfiles } from "@/lib/tickets";
import { indexProfiles, profileName } from "@/lib/format";
import { useRole } from "./AuthGate";

export function ActionItemsPage() {
  const { canWrite, isAdmin } = useRole();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ActionItem | null>(null);
  const [creating, setCreating] = useState(false);

  const byId = useMemo(() => indexProfiles(profiles), [profiles]);

  useEffect(() => {
    let active = true;
    Promise.all([listActionItems(), listProfiles()]).then(([a, p]) => {
      if (!active) return;
      setItems(a);
      setProfiles(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function upsert(a: ActionItem) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === a.id);
      if (i === -1) return [a, ...prev];
      const next = [...prev];
      next[i] = a;
      return next;
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this action item?")) return;
    await deleteActionItem(id);
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  async function toggleDone(a: ActionItem) {
    const done = !a.completed;
    const updated = await updateActionItem(a.id, {
      completed: done,
      status: done ? "done" : "open",
    });
    upsert(updated);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Action items</h1>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New action item
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[color:var(--muted)]">
          No action items yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((a) => {
            const owner = a.owner ? byId.get(a.owner) : null;
            return (
              <Card key={a.id} className="flex items-center gap-3 p-3">
                {canWrite ? (
                  <input
                    type="checkbox"
                    checked={a.completed}
                    onChange={() => toggleDone(a)}
                    className="h-4 w-4 accent-[color:var(--primary)]"
                  />
                ) : (
                  <span className="w-4" />
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      a.completed
                        ? "truncate text-sm line-through opacity-60"
                        : "truncate text-sm font-medium"
                    }
                  >
                    {a.title}
                  </div>
                  {a.due_date && (
                    <div className="text-xs text-[color:var(--muted)]">
                      Due {a.due_date}
                    </div>
                  )}
                </div>
                <Badge tone={ACTION_ITEM_STATUS_TONE[a.status]}>
                  {ACTION_ITEM_STATUS_LABELS[a.status]}
                </Badge>
                {owner ? (
                  <Avatar
                    name={profileName(a.owner, byId)}
                    color={owner.avatar_color}
                    size="sm"
                  />
                ) : (
                  <span className="h-6 w-6 rounded-full border border-dashed border-[color:var(--border)]" />
                )}
                {canWrite && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(a)}
                  >
                    Edit
                  </Button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => onDelete(a.id)}
                    className="text-[color:var(--muted)] hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <ActionItemDialog
          item={editing}
          profiles={profiles}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(a) => {
            upsert(a);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ActionItemDialog({
  item,
  profiles,
  onClose,
  onSaved,
}: {
  item: ActionItem | null;
  profiles: Profile[];
  onClose: () => void;
  onSaved: (a: ActionItem) => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    owner: item?.owner ?? "",
    due_date: item?.due_date ?? "",
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
    const parsed = actionItemSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const saved = item
        ? await updateActionItem(item.id, parsed.data)
        : await createActionItem(parsed.data);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit action item" : "New action item"}
    >
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
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => field("status", e.target.value)}
              className="mt-1"
            >
              {ACTION_ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ACTION_ITEM_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            type="date"
            value={form.due_date}
            onChange={(e) => field("due_date", e.target.value)}
            className="mt-1"
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : item ? "Save changes" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}
