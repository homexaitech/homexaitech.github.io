# HomeX Team Board

Internal team board for the HomeX.AI dev team — frontend-only, static-exported
Next.js, hosted on **GitHub Pages** at <https://homexaitech.github.io/>. It reuses
the **same Supabase project** as the `homex-backend-ticket` app (single source of
truth; the publishable/anon key is public by design — all security is enforced by
Supabase Auth + Row Level Security + the team email allowlist).

> **Status: Phase 0 — login smoke test.** Minimal vertical slice (login / signup /
> auth-confirm + a protected landing page) to prove the public site loads and
> Supabase login works end-to-end over the Pages URL. Roles, dashboard, tickets,
> meetings, docs, roadmap, etc. follow in later phases.

## Local dev

```bash
npm install
cp .env.local.example .env.local   # already filled in locally; values shared with the ticket app
npm run dev                         # http://localhost:3031
```

Runs on port **3031** so it doesn't clash with the ticket app (3030).

## Build (static export)

```bash
npm run build      # emits ./out (fully static)
```

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the static
export and publishes `out/` to Pages. One-time setup in the repo:

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → Variables** — add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (same values as `.env.local`).
3. In Supabase Auth, keep **Confirm email OFF** so team logins are instant.

The site is a user/org root site, served at the root URL — no `basePath` needed.

## Security note

GitHub Pages is publicly reachable and the anon key ships in the bundle by design.
There is no server and no server-side secret. Anyone can load the app shell, but
no data loads without an allowlisted Supabase login. Never put a service-role key
or any private secret in this repo.
