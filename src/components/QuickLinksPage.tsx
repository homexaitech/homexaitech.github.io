"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Lock, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  FieldError,
  Input,
  Label,
  Select,
} from "@/shared/ui";
import { LINK_CATEGORIES, type QuickLink } from "@/lib/types";
import { quickLinkSchema } from "@/lib/schemas";
import {
  createQuickLink,
  deleteQuickLink,
  listQuickLinks,
  updateQuickLink,
} from "@/lib/quick-links";
import { useRole } from "./AuthGate";

export function QuickLinksPage() {
  const { canWrite, isAdmin } = useRole();
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuickLink | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    listQuickLinks().then((l) => {
      if (!active) return;
      setLinks(l);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function upsert(l: QuickLink) {
    setLinks((prev) => {
      const i = prev.findIndex((x) => x.id === l.id);
      if (i === -1) return [...prev, l];
      const next = [...prev];
      next[i] = l;
      return next;
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this link?")) return;
    await deleteQuickLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  const groups = useMemo(() => {
    const map = new Map<string, QuickLink[]>();
    for (const l of links) {
      const key = l.category || "Other";
      const arr = map.get(key) ?? [];
      arr.push(l);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [links]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Quick links</h1>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New link
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : links.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[color:var(--muted)]">
          No links yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([category, list]) => (
            <div key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                {category}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((l) => (
                  <Card key={l.id} className="flex items-center gap-2 p-3">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center gap-1 font-medium text-[color:var(--primary)] hover:underline"
                    >
                      <span className="truncate">{l.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                    {l.sensitive && (
                      <Badge tone="warn" className="gap-1">
                        <Lock className="h-3 w-3" /> Sensitive
                      </Badge>
                    )}
                    {canWrite && (
                      <button
                        onClick={() => setEditing(l)}
                        className="text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      >
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(l.id)}
                        className="text-[color:var(--muted)] hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <QuickLinkDialog
          link={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(l) => {
            upsert(l);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function QuickLinkDialog({
  link,
  onClose,
  onSaved,
}: {
  link: QuickLink | null;
  onClose: () => void;
  onSaved: (l: QuickLink) => void;
}) {
  const [form, setForm] = useState({
    title: link?.title ?? "",
    url: link?.url ?? "",
    category: link?.category ?? "",
  });
  const [sensitive, setSensitive] = useState(link?.sensitive ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = quickLinkSchema.safeParse({ ...form, sensitive });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const saved = link
        ? await updateQuickLink(link.id, parsed.data)
        : await createQuickLink(parsed.data);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={link ? "Edit link" : "New link"}>
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
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={form.url}
            onChange={(e) => field("url", e.target.value)}
            className="mt-1"
            placeholder="https://…"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={form.category}
            onChange={(e) => field("category", e.target.value)}
            className="mt-1"
          >
            <option value="">—</option>
            {LINK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sensitive}
            onChange={(e) => setSensitive(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--primary)]"
          />
          Mark as sensitive
        </label>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : link ? "Save changes" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}
