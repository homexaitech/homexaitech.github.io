"use client";

import { AuthGate } from "@/components/AuthGate";
import { BoardPage } from "@/components/BoardPage";

export default function TicketsPage() {
  return (
    <AuthGate>
      <BoardPage />
    </AuthGate>
  );
}
