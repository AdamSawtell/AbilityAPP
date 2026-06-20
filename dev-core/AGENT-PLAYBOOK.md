# AbilityAPP — agent playbook

**Read this first.** Then open the docs linked below before any feature work, schema change, or new page.

## Mandatory reading (in order)

| Order | Document | When |
|-------|----------|------|
| 1 | [docs/BUILD-EXPECTATIONS.md](../docs/BUILD-EXPECTATIONS.md) | Every task — stack rules, audit, DB, verification |
| 2 | [docs/BUILD-PROGRESS.md](../docs/BUILD-PROGRESS.md) | Every task — % complete, next slice, **what you can test** |
| 3 | [docs/SCOPE-ROADMAP.md](../docs/SCOPE-ROADMAP.md) | Every feature — which phase/chunk, dependencies |
| 4 | [docs/scope/README.md](../docs/scope/README.md) | Deep requirements for the operational lifecycle |
| 5 | [web/AGENTS.md](../web/AGENTS.md) | App-specific paths (catalog, System nav, help guides) |
| 6 | [docs/DATABASE-CHANGES.md](../docs/DATABASE-CHANGES.md) | Any field, entity, tab, or table change |

## Scope authority

The master scope is **Complete Operational Workflow & Requirements Scope** (19 June 2026).  
Development chunks **0–8** in [docs/SCOPE-ROADMAP.md](../docs/SCOPE-ROADMAP.md) map directly to that document.

Do not start a chunk out of order unless the roadmap explicitly marks it as parallel-safe.

**Autonomous progress:** After each successful push, immediately start the **Next slice** in [BUILD-PROGRESS.md](../docs/BUILD-PROGRESS.md). Do not wait for the user to ask — build, verify, document, push, repeat.

## Current strategic spine

```
Enquiry → Client → Service Agreement → Service Booking → Service Planning
    → Master Roster → Current Roster → Service Complete → Timesheet
    → Billing & Claiming → Employee Payment → Reconciliation
```

**Rostering (Chunks 4–5)** is the largest greenfield build. Everything upstream must be solid first.

## Handoff checklist (every PR / task)

1. Migration in `supabase/migrations/` if schema changed  
2. `mappers.ts` / `data-api.ts` updated  
3. Window in `catalog.ts` if new module; read/write in Roles admin  
4. `AppShell` / `SystemShell` with `audit` prop  
5. Line tables + `persistRecordAudit` on save  
6. Process doc + `processes.json` if new workflow  
7. **User how-to** — article section(s) in `web/src/lib/help/articles/` with steps for the new behaviour  
8. **System setup** — checklist items in `module-setup-guides.ts` + reference data / role grants documented  
9. **Tier 1:** `npm run build` + `page-guides:check` (exit 0)  
10. **Tier 2:** Browser smoke — steps in BUILD-PROGRESS for this slice  
11. **Tier 3:** Bugbot review before push; log in BUILD-PROGRESS  
12. Update [docs/BUILD-PROGRESS.md](../docs/BUILD-PROGRESS.md) (status + test steps + user/setup guides for new slice)  
13. Update [docs/SCOPE-ROADMAP.md](../docs/SCOPE-ROADMAP.md) when chunk status changes  

## Key paths

| Area | Path |
|------|------|
| Migrations | `supabase/migrations/` |
| Data layer | `web/src/lib/supabase/` |
| UI state | `web/src/lib/data-store.tsx` |
| Access / roles | `web/src/lib/access/` |
| Processes | `docs/processes/` |
| Deploy | AWS Amplify (`web/`), Supabase CI on `main` |
