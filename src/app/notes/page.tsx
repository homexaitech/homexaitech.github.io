"use client";

import { AuthGate } from "@/components/AuthGate";
import { NotesPage } from "@/components/NotesPage";

export default function Notes() {
  return (
    <AuthGate>
      <NotesPage />
    </AuthGate>
  );
}
