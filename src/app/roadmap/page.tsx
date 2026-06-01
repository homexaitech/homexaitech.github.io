"use client";

import { AuthGate } from "@/components/AuthGate";
import { RoadmapPage } from "@/components/RoadmapPage";

export default function Roadmap() {
  return (
    <AuthGate>
      <RoadmapPage />
    </AuthGate>
  );
}
