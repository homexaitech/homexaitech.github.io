"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card } from "@/shared/ui";
import type { QuickLink } from "@/lib/types";
import { listQuickLinks } from "@/lib/quick-links";

// Public-facing product links (demo, landing page, deck, …). These are the
// NON-sensitive entries from Quick Links — manage them there; this page is a
// read-only, presentation-friendly view of the public subset.
export function ProductLinksPage() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listQuickLinks()
      .then((l) => {
        if (!active) return;
        setLinks(l);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const publicLinks = useMemo(() => links.filter((l) => !l.sensitive), [links]);

  const groups = useMemo(() => {
    const map = new Map<string, QuickLink[]>();
    for (const l of publicLinks) {
      const key = l.category || "Other";
      const arr = map.get(key) ?? [];
      arr.push(l);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [publicLinks]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Product links</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Public-facing links — demo, landing page, and more. Managed under{" "}
          <span className="font-medium">Quick links</span> (non-sensitive entries).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading…</p>
      ) : publicLinks.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[color:var(--muted)]">
          No public links yet.
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([category, list]) => (
            <div key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                {category}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((l) => (
                  <Card key={l.id} className="flex items-center gap-2 p-3">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 flex-1 items-center gap-1 font-medium text-[color:var(--primary)] hover:underline"
                    >
                      <span className="truncate">{l.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
