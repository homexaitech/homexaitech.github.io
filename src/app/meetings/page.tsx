"use client";

import { AuthGate } from "@/components/AuthGate";
import { MeetingsPage } from "@/components/MeetingsPage";

export default function Meetings() {
  return (
    <AuthGate>
      <MeetingsPage />
    </AuthGate>
  );
}
