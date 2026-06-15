# AbilityERP Clone

A modern Next.js prototype of key AbilityERP workflows: enquiries, clients (support received), support plans, products, price lists, and service agreements. Data is stored in the browser for now; Supabase and Amplify hosting are planned next.

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

Service bookings and a shared database (Supabase) are on the roadmap.
