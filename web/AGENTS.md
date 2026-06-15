<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AbilityAPP — agent notes

## Database (required)

**Every feature from here needs a DB update.** Read [../docs/DATABASE-CHANGES.md](../docs/DATABASE-CHANGES.md) before adding fields, entities, or tabs.

- Migrations: `supabase/migrations/`
- App data layer: `web/src/lib/supabase/` (`mappers.ts`, `data-api.ts`)
- UI state: `web/src/lib/data-store.tsx` (loads/saves via Supabase when env vars are set)

## Stack

- Next.js 16 App Router, TypeScript, Tailwind — `web/`
- Supabase Postgres — project `yonkaaylolrdsjfgpvyp`
- Hosted on AWS Amplify (app root `web`)

## Verify

```powershell
cd web
npm run build
npm run lint
```
