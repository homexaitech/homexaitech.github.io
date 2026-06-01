"use client";

import { AuthGate } from "@/components/AuthGate";
import { AccountPage } from "@/components/AccountPage";

export default function Account() {
  return (
    <AuthGate>
      <AccountPage />
    </AuthGate>
  );
}
