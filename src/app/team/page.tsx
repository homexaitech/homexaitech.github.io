"use client";

import { AuthGate } from "@/components/AuthGate";
import { TeamPage } from "@/components/TeamPage";

export default function Team() {
  return (
    <AuthGate>
      <TeamPage />
    </AuthGate>
  );
}
