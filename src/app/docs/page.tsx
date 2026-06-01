"use client";

import { AuthGate } from "@/components/AuthGate";
import { DocsPage } from "@/components/DocsPage";

export default function Docs() {
  return (
    <AuthGate>
      <DocsPage />
    </AuthGate>
  );
}
