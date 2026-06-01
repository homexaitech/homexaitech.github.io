"use client";

import { AuthGate } from "@/components/AuthGate";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
