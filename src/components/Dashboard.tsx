"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  Flame,
  Map as MapIcon,
  Target,
} from "lucide-react";
import { Avatar, Badge, Card } from "@/shared/ui";
import {
  CURRENT_PHASE,
  PHASE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONE,
  STATUS_LABELS,
  type Document,
  type Meeting,
  type Profile,
  type QuickLink,
  type RoadmapItem,
  type Ticket,
} from "@/lib/types";
import { listTickets, listProfiles } from "@/lib/tickets";
import { listMeetings } from "@/lib/meetings";
import { listDocuments } from "@/lib/documents";
import { listRoadmapItems } from "@/lib/roadmap";
import { listQuickLinks } from "@/lib/quick-links";
import { indexProfiles, timeAgo } from "@/lib/format";
import { formatInLocal, nextOccurrence } from "@/lib/tz";
import { useSession } from "./AuthGate";
import { NotesCard } from "./NotesCard";

export function Dashboard() {
  const { email, profile } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Resilient: a single failing query falls back to [] instead of blanking
    // the whole dashboard.
    Promise.all([
      listTickets().catch(() => [] as Ticket[]),
      listMeetings().catch(() => [] as Meeting[]),
      listDocuments().catch(() => [] as Document[]),
      listRoadmapItems().catch(() => [] as RoadmapItem[]),
      listQuickLinks().catch(() => [] as QuickLink[]),
      listProfiles().catch(() => [] as Profile[]),
    ]).then(([t, m, d, r, l, p]) => {
      if (!active) return;
      setTickets(t);
      setMeetings(m);
      setDocs(d);
      setRoadmap(r);
      setLinks(l);
      setProfiles(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(() => indexProfiles(profiles), [profiles]);

  const focus = useMemo(
    () =>
      roadmap.filter(
        (r) =>
          r.phase === CURRENT_PHASE &&
          (r.status === "open" || r.status === "in_progress"),
      ),
    [roadmap],
  );
  const highPriority = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (t.priority === "high" || t.priority === "critical") &&
          t.status !== "done",
      ),
    [tickets],
  );
  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 5),
    [tickets],
  );
  // Next occurrence (recurrence-aware) within the next 5 days, max 5 items.
  const upcoming = useMemo(() => {
    const now = Date.now();
    const horizon = now + 5 * 24 * 60 * 60 * 1000;
    return meetings
      .filter((m) => m.scheduled_at)
      .map((m) => ({ m, next: nextOccurrence(m.scheduled_at!, m.recurrence, now) }))
      .filter(({ next }) => next.getTime() >= now && next.getTime() <= horizon)
      .sort((a, b) => a.next.getTime() - b.next.getTime())
      .slice(0, 5);
  }, [meetings]);
  const importantDocs = useMemo(
    () => docs.filter((d) => d.status === "active").slice(0, 6),
    [docs],
  );
  const activeLinks = useMemo(() => links.slice(0, 8), [links]);

  const name = profile?.name || email;

  if (loading) {
    return <p className="text-sm text-[color:var(--muted)]">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold tracking-tight">
        Welcome, {name}
      </h1>

      {/* Current focus banner — full width across the top */}
      <Card className="border-[color:var(--primary)]/20 bg-[color:var(--accent)]/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-[color:var(--primary)]" />
            Current focus — {PHASE_LABELS[CURRENT_PHASE]}
          </div>
          <Link
            href="/product-links"
            className="text-xs text-[color:var(--muted)] hover:text-[color:var(--primary)]"
          >
            Product links
          </Link>
        </div>
        {focus.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Nothing in progress this phase.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {focus.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1 text-sm"
              >
                {r.title}
                <Badge tone="muted">{STATUS_LABELS[r.status]}</Badge>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          icon={<ExternalLink className="h-4 w-4" />}
          title="Quick links"
          href="/quick-links"
          empty={activeLinks.length === 0 ? "No links yet." : null}
        >
          {activeLinks.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 py-1 text-sm text-[color:var(--primary)] hover:underline"
            >
              <span className="flex-1 truncate">{l.title}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ))}
        </Section>

        <Section
          icon={<CalendarClock className="h-4 w-4" />}
          title="Upcoming meetings"
          href="/meetings"
          empty={
            upcoming.length === 0 ? "Nothing in the next 5 days." : null
          }
        >
          {upcoming.map(({ m, next }) => (
            <Row key={m.id}>
              <span className="flex-1 truncate">{m.title}</span>
              <span className="text-xs text-[color:var(--muted)]">
                {formatInLocal(next.toISOString())}
              </span>
            </Row>
          ))}
        </Section>

        <Section
          icon={<Flame className="h-4 w-4" />}
          title="High-priority tickets"
          href="/tickets"
          empty={highPriority.length === 0 ? "None open." : null}
        >
          {highPriority.slice(0, 6).map((t) => (
            <TicketRow key={t.id} t={t} byId={byId} />
          ))}
        </Section>

        <Section
          icon={<FileText className="h-4 w-4" />}
          title="Important docs"
          href="/docs"
          empty={importantDocs.length === 0 ? "No documents yet." : null}
        >
          {importantDocs.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 py-1 text-sm text-[color:var(--primary)] hover:underline"
            >
              <span className="flex-1 truncate">{d.title}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ))}
        </Section>

        <Section
          icon={<MapIcon className="h-4 w-4" />}
          title="Recently updated tickets"
          href="/tickets"
          empty={recentTickets.length === 0 ? "No tickets yet." : null}
        >
          {recentTickets.map((t) => (
            <TicketRow key={t.id} t={t} byId={byId} showTime />
          ))}
        </Section>

        <NotesCard byId={byId} />
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  href,
  empty,
  children,
}: {
  icon: ReactNode;
  title: string;
  href: string;
  empty: string | null;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-[color:var(--primary)]">{icon}</span>
          {title}
        </div>
        <Link
          href={href}
          className="text-xs text-[color:var(--muted)] hover:text-[color:var(--primary)]"
        >
          View all
        </Link>
      </div>
      {empty ? (
        <p className="py-2 text-sm text-[color:var(--muted)]">{empty}</p>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </Card>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-[color:var(--border)] py-1.5 text-sm first:border-t-0">
      {children}
    </div>
  );
}

function TicketRow({
  t,
  byId,
  showTime,
}: {
  t: Ticket;
  byId: Map<string, Profile>;
  showTime?: boolean;
}) {
  return (
    <Link
      href={`/ticket/?id=${t.id}`}
      className="flex items-center gap-2 border-t border-[color:var(--border)] py-1.5 text-sm first:border-t-0 hover:bg-[color:var(--accent)]/40"
    >
      <span className="font-mono text-xs text-[color:var(--muted)]">
        {t.key}
      </span>
      <span className="flex-1 truncate">{t.title}</span>
      {t.assignees.slice(0, 1).map((aid) => {
        const p = byId.get(aid);
        return p ? (
          <Avatar
            key={aid}
            name={p.name || p.email || "?"}
            color={p.avatar_color}
            size="sm"
          />
        ) : null;
      })}
      {showTime ? (
        <span className="text-xs text-[color:var(--muted)]">
          {timeAgo(t.updated_at)}
        </span>
      ) : (
        <Badge tone={PRIORITY_TONE[t.priority]}>
          {PRIORITY_LABELS[t.priority]}
        </Badge>
      )}
    </Link>
  );
}
