"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/ui";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TICKET_TYPES,
  TYPE_LABELS,
  type Profile,
  type Ticket,
} from "@/lib/types";
import { createTicketSchema } from "@/lib/schemas";
import { createTicket } from "@/lib/tickets";
import { AssigneePicker } from "./AssigneePicker";

const BLANK = {
  title: "",
  description: "",
  type: "task",
  priority: "medium",
  labels: "",
  file_path: "",
  pr_url: "",
  commit_sha: "",
};

export function CreateTicketDialog({
  open,
  onClose,
  profiles,
  reporterId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  reporterId: string;
  onCreated: (t: Ticket) => void;
}) {
  const [form, setForm] = useState(BLANK);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field<K extends keyof typeof BLANK>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = createTicketSchema.safeParse({
      title: form.title,
      description: form.description,
      type: form.type,
      priority: form.priority,
      assignees,
      labels: form.labels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      file_path: form.file_path,
      pr_url: form.pr_url,
      commit_sha: form.commit_sha,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSaving(true);
    try {
      const ticket = await createTicket(parsed.data, reporterId);
      setForm(BLANK);
      setAssignees([]);
      onCreated(ticket);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New ticket">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            className="mt-1"
            placeholder="Short summary"
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
            placeholder="What needs to happen, repro steps, context…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select
              value={form.type}
              onChange={(e) => field("type", e.target.value)}
              className="mt-1"
            >
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
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
        </div>

        <div>
          <Label>Assignees</Label>
          <div className="mt-1">
            <AssigneePicker
              profiles={profiles}
              value={assignees}
              onChange={setAssignees}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="labels">Labels</Label>
          <Input
            id="labels"
            value={form.labels}
            onChange={(e) => field("labels", e.target.value)}
            className="mt-1"
            placeholder="comma, separated, labels"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="file_path">File path</Label>
            <Input
              id="file_path"
              value={form.file_path}
              onChange={(e) => field("file_path", e.target.value)}
              className="mt-1"
              placeholder="src/app/api/…"
            />
          </div>
          <div>
            <Label htmlFor="pr_url">PR URL</Label>
            <Input
              id="pr_url"
              value={form.pr_url}
              onChange={(e) => field("pr_url", e.target.value)}
              className="mt-1"
              placeholder="https://github.com/…/pull/123"
            />
          </div>
          <div>
            <Label htmlFor="commit_sha">Commit SHA</Label>
            <Input
              id="commit_sha"
              value={form.commit_sha}
              onChange={(e) => field("commit_sha", e.target.value)}
              className="mt-1"
              placeholder="a1b2c3d"
            />
          </div>
        </div>

        <FieldError>{error}</FieldError>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create ticket"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
