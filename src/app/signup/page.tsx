"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, Label, FieldError } from "@/shared/ui";
import { AuthShell } from "../login/page";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() || undefined },
        emailRedirectTo: `${window.location.origin}/auth/confirm/?next=/`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is OFF (recommended for this internal tool), a
    // session is returned immediately and we can go straight to the board.
    if (data.session) {
      router.replace("/");
      return;
    }
    setNotice("Check your email to confirm your account, then sign in.");
  }

  return (
    <AuthShell title="Create account" subtitle="Team members only">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            placeholder="Jane Dev"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <FieldError>{error}</FieldError>
        {notice && (
          <p className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm text-[color:var(--primary)]">
            {notice}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-[color:var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[color:var(--primary)] underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
