"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
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
  DOC_CATEGORIES,
  DOC_TYPES,
  DOC_STATUSES,
  type Document,
} from "@/lib/types";
import { documentSchema } from "@/lib/schemas";
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from "@/lib/documents";
import { useRole } from "./AuthGate";

export function DocsPage() {
  const { canWrite, isAdmin } = useRole();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Document | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    listDocuments().then((d) => {
      if (!active) return;
      setDocs(d);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function upsert(d: Document) {
    setDocs((prev) => {
      const i = prev.findIndex((x) => x.id === d.id);
      if (i === -1) return [...prev, d];
      const next = [...prev];
      next[i] = d;
      return next;
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document link?")) return;
    await deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  // Group active docs by category; archived shown last under "Archived".
  const groups = useMemo(() => {
    const map = new Map<string, Document[]>();
    for (const d of docs) {
      const key = d.status === "archived" ? "Archived" : d.category || "Uncategorized";
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [docs]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Docs</h1>
        {canWrite && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New doc link
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : docs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[color:var(--muted)]">
          No documents yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([category, list]) => (
            <div key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                {category}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map((d) => (
                  <Card key={d.id} className="flex items-start gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[color:var(--primary)] hover:underline"
                      >
                        <span className="truncate">{d.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                      {d.doc_type && (
                        <Badge tone="muted" className="ml-2">
                          {d.doc_type}
                        </Badge>
                      )}
                      {d.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted)]">
                          {d.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {canWrite && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditing(d)}
                        >
                          Edit
                        </Button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => onDelete(d.id)}
                          className="text-[color:var(--muted)] hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <DocDialog
          doc={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(d) => {
            upsert(d);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DocDialog({
  doc,
  onClose,
  onSaved,
}: {
  doc: Document | null;
  onClose: () => void;
  onSaved: (d: Document) => void;
}) {
  const [form, setForm] = useState({
    title: doc?.title ?? "",
    url: doc?.url ?? "",
    category: doc?.category ?? "",
    doc_type: doc?.doc_type ?? "",
    description: doc?.description ?? "",
    status: doc?.status ?? "active",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = documentSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const saved = doc
        ? await updateDocument(doc.id, parsed.data)
        : await createDocument(parsed.data);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={doc ? "Edit doc link" : "New doc link"}>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onChange={(e) => field("category", e.target.value)}
              className="mt-1"
            >
              <option value="">—</option>
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={form.doc_type}
              onChange={(e) => field("doc_type", e.target.value)}
              className="mt-1"
            >
              <option value="">—</option>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
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
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={(e) => field("status", e.target.value)}
            className="mt-1"
          >
            {DOC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : doc ? "Save changes" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}
