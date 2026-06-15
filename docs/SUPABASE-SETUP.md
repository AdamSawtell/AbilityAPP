# Supabase setup — AbilityAPP

Project: [yonkaaylolrdsjfgpvyp](https://supabase.com/dashboard/project/yonkaaylolrdsjfgpvyp)

## How schema updates work

You do **not** paste SQL into the dashboard for routine changes.

1. I add a new file under `supabase/migrations/` (timestamped).
2. Changes are committed to GitHub.
3. GitHub Actions runs `supabase db push` on `main`.
4. Reference list seed re-applies from `supabase/seed.sql` when that file changes.

Regenerate seed after editing `web/src/lib/reference-data.ts`:

```powershell
cd web
npx tsx ../scripts/generate-reference-seed.mjs
```

## Local env (`web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://yonkaaylolrdsjfgpvyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Settings → API>
```

Copy from `web/.env.example` if needed. Never commit real keys.

## Amplify env vars

In Amplify → **Environment variables**, add the same two `NEXT_PUBLIC_*` values, then redeploy.

## GitHub secrets (for auto-migrate)

Repo → **Settings → Secrets and variables → Actions** → **New repository secret**:

| Secret | Value |
|--------|--------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from [Account → Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Database password from project creation (Settings → Database; reset if you do not have it) |

`SUPABASE_PROJECT_REF` is set in the workflow (`yonkaaylolrdsjfgpvyp`) — you do not need a secret for it.

Both secrets above are required. If any are missing, the **Supabase migrations** workflow fails within a few seconds and GitHub emails you.

After adding secrets, re-run the workflow: **Actions → Supabase migrations → Run workflow**, or push any commit that touches `supabase/migrations/`.

### Workflow failed emails

1. Open [Actions → Supabase migrations](https://github.com/AdamSawtell/AbilityAPP/actions/workflows/supabase-migrate.yml).
2. Click the failed run → expand **Verify GitHub secrets** or **Link Supabase project** for the error.
3. Most common fix: add or correct the three secrets above.
4. Optional: GitHub → **Settings → Notifications** → uncheck **Actions** if you do not want failure emails (fixing secrets is still recommended).

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
