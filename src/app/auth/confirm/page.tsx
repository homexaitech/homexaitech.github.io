"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { AuthShell } from "../../login/page";

// Client-side email confirmation. The main app uses a server route handler for
// this; we do it in the browser so the app stays statically exportable. Only
// reached if "Confirm email" is left ON in Supabase Auth settings.
function Confirm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const next = params.get("next") || "/";
    if (!token_hash || !type) {
      setError("Invalid confirmation link.");
      return;
    }
    createClient()
      .auth.verifyOtp({ token_hash, type })
      .then((result) => {
        if (result.error) setError(result.error.message);
        else router.replace(next);
      });
  }, [params, router]);

  return (
    <AuthShell title="Confirming…" subtitle="Verifying your email">
      {error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-center text-sm text-[color:var(--muted)]">
          One moment…
        </p>
      )}
    </AuthShell>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Confirming…" subtitle="Verifying your email">
          <p className="text-center text-sm text-[color:var(--muted)]">
            One moment…
          </p>
        </AuthShell>
      }
    >
      <Confirm />
    </Suspense>
  );
}
