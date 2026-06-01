# HomeX Team Board

An internal team board for the **HomeX.AI** team — a single place for tickets,
meetings, action items, documents, roadmap, and quick links.

🔗 **Live:** <https://homexaitech.github.io/>

> **Access is invite-only.** This is a public website, but it holds no public
> data. The page loads for anyone, yet nothing is shown without an authorized
> sign-in — access is restricted to approved team members. If you've reached this
> looking to get in, please contact a team admin.

## Features

- **Dashboard** — current focus, high-priority and blocked tickets, upcoming
  meetings, recent notes, important docs, roadmap summary, and quick links.
- **Tickets** — a board for development, debugging, and task dispatch
  (status / priority / type / labels, assignees, reviewers, comments, activity).
- **Meetings** — agenda, notes, and decisions; timezone-aware scheduling shown in
  each viewer's local time; optional recurrence; video link or room.
- **Action items** — owners, due dates, and status, with a quick done toggle.
- **Docs** — a curated index of links (Drive, Figma, GitHub, …), grouped by topic.
- **Roadmap** — initiatives grouped by phase (MVP / Demo / Beta / Future).
- **Quick links** — frequently used team resources.
- **Roles** — Admin / Developer / Viewer, enforced end-to-end.

## How it works

A static front end that talks directly to **Supabase** (Postgres + Auth). There is
no application server: data access is governed by **Row Level Security** and an
email **allowlist**, and the UI is served as static files from **GitHub Pages**.

**Stack:** Next.js (App Router, static export) · React · TypeScript · Tailwind CSS
· Zod · Supabase.

## Local development

For team members working on the app:

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL + publishable key
npm run dev                        # http://localhost:3031
```

```bash
npm run build      # static export to ./out
npm run typecheck  # tsc --noEmit
```

Environment variables (both public, prefixed `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`.env.local` is git-ignored. In CI these are provided as GitHub repository
variables.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the static
export and publishes it to GitHub Pages (served at the site root — no base path).

## Security

- **Public site, no public data.** The publishable (anon) key is public by design;
  it grants nothing on its own. All access is enforced server-side by Supabase
  **Auth + Row Level Security + a team allowlist**.
- **Invite-only.** Public sign-up is disabled; accounts are provisioned by an admin.
- **No secrets in this repo.** Only public `NEXT_PUBLIC_` values are used — never a
  service-role key or any private credential.
