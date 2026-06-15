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

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|--------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from [Account → Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | `yonkaaylolrdsjfgpvyp` |
| `SUPABASE_DB_PASSWORD` | Database password from project creation (used by CLI in CI) |

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
