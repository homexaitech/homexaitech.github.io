"use client";

import { AuthGate } from "@/components/AuthGate";
import { ActionItemsPage } from "@/components/ActionItemsPage";

export default function ActionItems() {
  return (
    <AuthGate>
      <ActionItemsPage />
    </AuthGate>
  );
}
