# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**HomeX Team Board** (`homexaitech-team-board`) — an internal, invite-only team
board for the HomeX.AI team (tickets, meetings, action items, docs, roadmap,
quick links). It is a **separate project** from the `Web/` MVP described in the
workspace-root `CLAUDE.md`; the root doc's "the only code is in `Web/`" is
out of date for this directory. This is its own git repo and the published site
at <https://homexaitech.github.io/>.

## Commands

```bash
npm run dev        # next dev on port 3031 (note: NOT the default 3000)
npm run build      # static export -> ./out
npm run start      # serve the export on port 3031
npm run typecheck  # tsc --noEmit — the only check gate; there is no lint or test script
```

Before claiming a change compiles, run `npm run typecheck`. There is no test
suite and no linter configured.

Local setup needs `.env.local` (copy `.env.local.example`) with two **public**
`NEXT_PUBLIC_` Supabase values — the URL and the publishable (anon) key. These
point at the **same Supabase project as the `homex-backend-ticket` app** (they
share a backend).

## Architecture

**Static front end, no app server.** `next.config.ts` sets `output: "export"`,
so `next build` emits a fully static `out/` that GitHub Pages serves at the
root (no basePath). The browser talks **directly to Supabase** (Postgres +
Auth). All security is enforced server-side by Supabase **Auth + Row Level
Security + a team email allowlist** — never in this code. The anon key is
public by design.

This static-export constraint drives several patterns; respect them:

- **No dynamic route segments.** Detail views use query params instead, e.g.
  ticket detail is `/ticket?id=<uuid>` (`src/app/ticket/page.tsx`), not
  `/tickets/[id]`. Any component reading `useSearchParams()` must be wrapped in
  `<Suspense>` or the export build fails.
- **Email confirmation runs client-side** (`src/app/auth/confirm/page.tsx`)
  because there is no server route handler.
- **SPA fallback**: the deploy workflow copies `out/index.html` to
  `out/404.html` and touches `.nojekyll` so client-routed deep links resolve.

**Auth & access control — `src/components/AuthGate.tsx`.** Every protected page
is `"use client"` and wraps its content in `<AuthGate>` (see
`src/app/page.tsx`). `AuthGate` checks an authenticated session, then calls the
`is_team_member` Supabase RPC as the authoritative allowlist gate — **fail
closed**: only a literal `true` admits the user; anything else redirects to
`/access-denied`. It renders nothing protected until checks resolve (no data
flash). It provides `useSession()` and `useRole()` (`isAdmin`, `canWrite`);
these only drive UI affordances — **RLS is the real fence**, so client role
checks are never the security boundary. A null/unknown role is treated as the
least-privileged `viewer` everywhere.

**Data layer — `src/lib/*.ts`.** One module per entity (`tickets`, `meetings`,
`action-items`, `documents`, `roadmap`, `quick-links`, `profiles`). Each
exports thin async functions that call Supabase and funnel results through
helpers in `src/lib/db.ts`:
- `db()` — lazy, memoized browser client. Never instantiate the Supabase client
  at module load, or static prerender constructs it and demands env vars.
- `throwIf({data, error})` / `asError(error)` — Supabase/PostgREST errors are
  plain objects, not `Error` instances; these normalize them into real `Error`s
  carrying the Postgres message. Use these instead of raw error handling.

**Types & validation.**
- `src/lib/types.ts` is the hand-written TypeScript source of truth, mirroring
  the SQL schema (snake_case columns). The migrations themselves live in the
  `homex-backend-ticket` repo, **not here** — keep these types in sync with that
  schema by hand. Enums are `as const` tuples (`STATUSES`, `PRIORITIES`,
  `ROLES`, …) with derived union types.
- `src/lib/schemas.ts` holds Zod schemas for every create/update form, sharing
  helpers like `optionalText`, `optionalUrl`, `optionalUuid` (which coerce empty
  `<select>`/input strings to `undefined`). `z.input` vs `z.output` types matter
  — forms take input, lib functions take output.

**Components & UI.** Page shells live in `src/app/<route>/page.tsx` and are
intentionally thin — they wrap a feature component from `src/components/`
(e.g. `Dashboard`, `BoardPage`, `MeetingsPage`) in `<AuthGate>`. Reusable
primitives are in `src/shared/ui/` (`Button`, `Card`, `Dialog`, `Input`,
`Badge`, `Avatar` — re-exported from `src/shared/ui/index.ts`), styled with
Tailwind v4 + `class-variance-authority` and CSS custom properties
(`var(--primary)`, `var(--muted)`, etc.) defined in `globals.css`. `cn()` for
class merging lives in `src/shared/utils/`.

**Timezone handling — `src/lib/tz.ts`.** Meeting times are stored as UTC ISO and
shown in each viewer's local zone. `zonedWallToUtc` / `utcToZonedWall` convert
between a `datetime-local` wall string in a chosen IANA zone and UTC (with a DST
refinement pass); `formatInLocal` renders for display; `nextOccurrence` computes
the next instance of a recurring meeting. Use these rather than ad-hoc `Date`
math.

**Import alias:** `@/*` → `./src/*`.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci` →
`npm run build` (with the two `NEXT_PUBLIC_` values injected from GitHub repo
**Variables**) → add `.nojekyll` + `404.html` fallback → publish `out/` to
GitHub Pages. No secrets are used or stored in this repo — only the public
`NEXT_PUBLIC_` values.
