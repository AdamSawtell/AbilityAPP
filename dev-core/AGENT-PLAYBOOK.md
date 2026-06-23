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
| 6 | [docs/core/README.md](../docs/core/README.md) | Core reference docs — functions, windows, processes, entities, access |
| 7 | [docs/DATABASE-CHANGES.md](../docs/DATABASE-CHANGES.md) | Any field, entity, tab, or table change |

## Scope authority

The master scope is **Complete Operational Workflow & Requirements Scope** (19 June 2026).  
Development chunks **0–8** in [docs/SCOPE-ROADMAP.md](../docs/SCOPE-ROADMAP.md) map directly to that document.

Do not start a chunk out of order unless the roadmap explicitly marks it as parallel-safe.

**Autonomous progress:** After each successful push, immediately start the **Next slice** in [BUILD-PROGRESS.md](../docs/BUILD-PROGRESS.md). Do not wait for the user to ask — build, verify, document, push, repeat.

**Slice closure (non-negotiable):** Every slice ends with this loop — no exceptions for UI work:

1. **Tier 1** — `npm run build` + `page-guides:check` (exit 0)
2. **Tier 2** — Browser smoke on **localhost** (`npm run dev`) using **What you can test** steps; log pass/fail
3. **Tier 3** — **Bugbot** subagent on uncommitted or branch changes; fix Critical/High before push; log result
4. Update BUILD-PROGRESS (verification + browser + code review logs)
5. **Supabase (required when migrations or seed SQL changed)** — `npm run supabase:push-remote` for new migrations; run targeted seed SQL when access/seed files changed (`npm run supabase:seed-demo-once -- --file supabase/seed-access.sql` or the file you touched). Do not hand off without applying to remote.
6. **Commit and push to `main`** — never leave finished work only on local disk; push includes any pending commits from the slice.
7. **Immediately** start the next slice — do not pause for user confirmation

See [.cursor/commands/test-before-handoff.md](../.cursor/commands/test-before-handoff.md).

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
8. **Record documents** — if print/PDF/send: `RecordDocumentsSection` + `document-print-audit.ts` per `.cursor/rules/record-documents.mdc`  
9. **System setup** — checklist items in `module-setup-guides.ts` + reference data / role grants documented  
10. **Core reference** — update matching `docs/core/*` guides per `core-reference-docs.mdc` (windows/tabs, functions, processes, entities, roles)  
11. **Testing docs** — `.cursor/rules/docs-and-testing.mdc`: HP matrix, TEST-RUNBOOKS, UAT pack(s), `npm run uat:inventory` when processes/windows change  
12. **Tier 1:** `npm run build` + `page-guides:check` (exit 0)  
13. **Tier 2:** Browser smoke — steps in BUILD-PROGRESS for this slice  
14. **Tier 3:** Bugbot review before push; log in BUILD-PROGRESS  
15. Update [docs/BUILD-PROGRESS.md](../docs/BUILD-PROGRESS.md) (status + test steps + user/setup guides for new slice)  
16. Update [docs/SCOPE-ROADMAP.md](../docs/SCOPE-ROADMAP.md) when chunk status changes  

## Key paths

| Area | Path |
|------|------|
| Migrations | `supabase/migrations/` |
| Data layer | `web/src/lib/supabase/` |
| UI state | `web/src/lib/data-store.tsx` |
| Access / roles | `web/src/lib/access/` |
| Processes | `docs/processes/` |
| Deploy | AWS Amplify (`web/`), Supabase CI on `main` |
