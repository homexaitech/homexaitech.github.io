"use client";

import { AuthGate } from "@/components/AuthGate";
import { ProductLinksPage } from "@/components/ProductLinksPage";

export default function ProductLinks() {
  return (
    <AuthGate>
      <ProductLinksPage />
    </AuthGate>
  );
}
