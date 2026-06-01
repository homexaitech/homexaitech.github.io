"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Avatar, Button, Textarea } from "@/shared/ui";
import type { Comment, Profile } from "@/lib/types";
import { addComment, listComments } from "@/lib/tickets";
import { profileName, timeAgo } from "@/lib/format";

export function CommentThread({
  ticketId,
  byId,
  currentUserId,
  onActivityChange,
}: {
  ticketId: string;
  byId: Map<string, Profile>;
  currentUserId: string;
  onActivityChange?: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    listComments(ticketId).then((c) => active && setComments(c));
    return () => {
      active = false;
    };
  }, [ticketId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    try {
      const c = await addComment(ticketId, currentUserId, text);
      setComments((prev) => [...prev, c]);
      setBody("");
      onActivityChange?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">No comments yet.</p>
        )}
        {comments.map((c) => {
          const author = byId.get(c.author);
          return (
            <div key={c.id} className="flex gap-3">
              <Avatar
                name={profileName(c.author, byId)}
                color={author?.avatar_color}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {profileName(c.author, byId)}
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[color:var(--foreground)]">
                  {c.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving || !body.trim()}>
            {saving ? "Posting…" : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
