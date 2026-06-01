"use client";

import { AuthGate } from "@/components/AuthGate";
import { QuickLinksPage } from "@/components/QuickLinksPage";

export default function QuickLinks() {
  return (
    <AuthGate>
      <QuickLinksPage />
    </AuthGate>
  );
}
