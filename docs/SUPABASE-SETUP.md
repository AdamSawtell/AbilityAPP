# Supabase setup — AbilityAPP

Project: [yonkaaylolrdsjfgpvyp](https://supabase.com/dashboard/project/yonkaaylolrdsjfgpvyp)

## How schema vs demo data works

Two separate concerns:

| What | When it runs | Stays in DB? |
|------|----------------|--------------|
| **Migrations** (`supabase/migrations/`) | Automatically on push to `main` (GitHub Actions) | Yes — schema changes accumulate |
| **Demo / dummy data** (`supabase/seed-*.sql`) | **One-off, manual only** | Yes — until you delete rows or re-run that seed file |

Pushing app code to Amplify does **not** touch Postgres. Pushing migrations updates **schema only** — not demo rows.

Regenerate seed SQL after editing TypeScript seed sources (e.g. `web/src/lib/reference-data.ts`):

```powershell
cd web
npx tsx ../scripts/generate-reference-seed.mjs
```

That updates the SQL file in git; it does **not** load data until you run a one-off seed (below).

## Local env (`web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://yonkaaylolrdsjfgpvyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Settings → API>
```

Copy from `web/.env.example` if needed. Never commit real keys.

## Amplify env vars

In Amplify → **Environment variables**, add:

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Settings → API (no `/rest/v1/`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | anon public key |
| `AUTH_SESSION_SECRET` | Yes | Long random string you generate — signs login cookies |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Reports Advance SQL |
| `OPENAI_API_KEY` | Yes (for AI) | Home and workspace assistants |

**Save**, then **redeploy** the app. `NEXT_PUBLIC_*` values are baked in at build time; `AUTH_SESSION_SECRET` must be present before session creation works on production.

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing at build time, the app falls back to **local seed data** (~6 employees and ~4 tasks) even though Supabase holds the full dummy dataset. The browser console shows `[DataStore] Supabase hydrate failed` when the connection breaks at runtime.

`amplify.yml` writes these values into `web/.env.production` during the Amplify build so Next.js API routes can read `AUTH_SESSION_SECRET` at runtime. If the build fails with “AUTH_SESSION_SECRET is missing”, the variable is not set in the Amplify console for that branch.

## GitHub secrets (for auto-migrate)

Repo → **[Settings → Secrets and variables → Actions](https://github.com/AdamSawtell/AbilityAPP/settings/secrets/actions)** → **Secrets** tab (not Variables) → **New repository secret**.

### Option A — one secret (recommended)

| Secret | Value |
|--------|--------|
| `SUPABASE_DB_URL` | Full Postgres URI from [Database → Connect](https://supabase.com/dashboard/project/yonkaaylolrdsjfgpvyp/database/settings) → **URI** → **Session pooler** → port **5432**. Replace `[YOUR-PASSWORD]` with your database password. |

Example shape (use your real password and host from the dashboard):

```text
postgresql://postgres.yonkaaylolrdsjfgpvyp:YOUR_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

### Option B — two secrets (legacy)

| Secret | Value |
|--------|--------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from [Account → Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Database password |

If the workflow still fails in ~5 seconds, the secret is almost always on the **Variables** tab by mistake, added as an **organisation** secret without granting this repo access, or under a different repository.

When no secrets are configured, the migrate workflow **skips** and completes successfully (no failure email).

### Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **Supabase migrations** | Push to `main` when `supabase/migrations/**` changes | `db push` only — schema |
| **Supabase seed demo data** | Manual — Actions → Run workflow | One-off load of all demo SQL (or one file) |

After demo data is loaded once, it **stays** in the database. Day-to-day pushes do not re-seed.

## One-off demo data load (local or first-time remote)

Add your database URI to `web/.env.local` (do not commit):

```env
SUPABASE_DB_URL=postgresql://postgres.yonkaaylolrdsjfgpvyp:YOUR_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**First-time setup** (migrations + all demo data once):

```powershell
cd "c:\Users\AdamSawtell\Documents\Cursor Play\AbilityERP Clone"
npm install
npm run supabase:setup-remote
```

**Schema only** (ongoing, same as CI on push):

```powershell
npm run supabase:push-remote
```

**Demo data only** (one-off, e.g. after adding a new seed file):

```powershell
npm run supabase:seed-demo-once
npm run supabase:seed-demo-once -- --file supabase/seed-clients-bulk.sql
```

Or from GitHub: **Actions → Supabase seed demo data → Run workflow**.

## Manual commands

```powershell
cd "c:\Users\AdamSawtell\Documents\Cursor Play\AbilityERP Clone"
$env:SUPABASE_ACCESS_TOKEN = "<your-token>"
npx supabase link --project-ref yonkaaylolrdsjfgpvyp
npx supabase db push
npx supabase db query --linked -f supabase/seed.sql
```

## Security note

Reference data tables currently allow anonymous read/write (MVP). Lock down RLS when Supabase Auth and org roles are added.

Rotate your access token if it was shared in chat or email.
