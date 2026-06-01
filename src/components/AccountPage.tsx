"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, FieldError, Input, Label } from "@/shared/ui";
import { createClient } from "@/utils/supabase/client";
import { useSession } from "./AuthGate";

export function AccountPage() {
  const { userId, email, profile } = useSession();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Account</h1>
      <ProfileCard userId={userId} email={email} initialName={profile?.name ?? ""} />
      <PasswordCard />
    </div>
  );
}

function ProfileCard({
  userId,
  email,
  initialName,
}: {
  userId: string;
  email: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    const { error } = await createClient()
      .from("profiles")
      .update({ name: name.trim() || null })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMsg("Display name updated. Refresh to see it in the header.");
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Profile</h2>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="mt-1 opacity-70" />
        </div>
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            placeholder="Your name"
          />
        </div>
        <FieldError>{error}</FieldError>
        {msg && (
          <p className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-[color:var(--primary)]">
            {msg}
          </p>
        )}
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (pw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPw("");
    setConfirm("");
    setMsg("Password updated.");
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Change password</h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        Set a new password (replaces the temporary one you were given).
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-4">
        <div>
          <Label htmlFor="pw">New password</Label>
          <Input
            id="pw"
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1"
          />
        </div>
        <FieldError>{error}</FieldError>
        {msg && (
          <p className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-[color:var(--primary)]">
            {msg}
          </p>
        )}
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
