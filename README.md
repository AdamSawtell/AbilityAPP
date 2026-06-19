# AbilityERP Clone

A modern Next.js NDIS provider platform: enquiries, clients, service agreements, bookings, workforce, and operational workflows. Data persists in Supabase; hosted on AWS Amplify.

## Development governance

**Before starting work**, read:

- [dev-core/AGENT-PLAYBOOK.md](./dev-core/AGENT-PLAYBOOK.md)
- [docs/BUILD-EXPECTATIONS.md](./docs/BUILD-EXPECTATIONS.md)
- [docs/SCOPE-ROADMAP.md](./docs/SCOPE-ROADMAP.md) — full backlog from scope doc (Chunks 0–8)

## Structure

| Path | Purpose |
|------|---------|
| `web/` | Next.js 16 app (App Router, TypeScript, Tailwind) |
| `scripts/` | Playwright capture scripts against live AbilityERP |
| `discovery/` | JSON field/tab captures from discovery runs |

## Local development

```powershell
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```powershell
cd web
npm run build
npm run lint
```

Clear saved browser data (if sample records look stale):

```javascript
localStorage.removeItem('abilityerp-clone-data')
localStorage.removeItem('abilityerp-reference-data')
```

## Deploy on AWS Amplify

1. Connect this repository in the Amplify console.
2. Set **app root** to `web`.
3. Amplify reads `amplify.yml` at the repo root for build settings (Next.js SSR).

## Modules

- **Enquiries** — intake and convert to client
- **Clients** — support received record with tabs (locations, support plan, plan & assessment, and more)
- **Products & price lists** — catalog and NDIS sample price list
- **Service agreements** — linked to clients and products
- **Admin** — reference data for configurable dropdowns

**Core processes** (workflows such as enquiry → client): [docs/processes/README.md](docs/processes/README.md)

Service bookings and a shared database (Supabase) are on the roadmap.

## Supabase

Schema migrations live in `supabase/migrations/`. GitHub Actions applies them on push to `main`. See [docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md) and **[docs/DATABASE-CHANGES.md](docs/DATABASE-CHANGES.md)** (required reading for new features).

Local: copy `web/.env.example` to `web/.env.local` and add your Supabase URL + anon key.
