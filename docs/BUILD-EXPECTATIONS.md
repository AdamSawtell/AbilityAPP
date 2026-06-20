# AbilityAPP — system build expectations

Governance for all development. Agents and developers must follow this before starting work.

## 1. Scope alignment

- Check [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) for the active phase and chunk.
- Do not build features from a later chunk without explicit approval (e.g. full rostering before service bookings are compliance-ready).
- Reference [scope/README.md](./scope/README.md) for detailed requirements.

## 2. Database (non-negotiable)

Every feature that persists data needs:

1. Timestamped migration in `supabase/migrations/`
2. Updates to `web/src/lib/supabase/mappers.ts` and `data-api.ts`
3. Seed regeneration when roles/access/sample data change (`npm run supabase:seed-access`, etc.)
4. See [DATABASE-CHANGES.md](./DATABASE-CHANGES.md)

**No** ad-hoc Supabase SQL editor changes for routine schema work.

## 3. Audit trail (non-negotiable)

Every `AppShell` / `SystemShell` page:

- Pass `audit` prop (`moduleLabel` for lists; `entityType` + `entityId` + `meta` for records)
- Saves call `persistRecordAudit()` **outside** React `setState` updaters
- New entity types in `web/src/lib/audit.ts` and field labels in `audit-diff.ts`

## 4. Record line tables (non-negotiable)

Repeating child data on records:

- Line config in `*-line-tables.ts`
- Child Supabase table + migration
- Load/save in data-api + mappers
- UI via `record-line-table.tsx` / `line-item-table.tsx` pattern
- Include line changes in audit diff

## 5. Access control

- Register windows in `web/src/lib/access/catalog.ts` (one surface: `app` or `system`)
- Role grants: **Off | Read | Write** per window/tab (`app_role_window.access_level`)
- UI: `canWindow` (read), `canWriteWindow` (write), `canSaveModule` for record saves
- Processes in `app_role_process`; require write on parent module where applicable

## 6. Business processes

Workflows (convert, approve, assign, etc.):

1. Numbered doc in `docs/processes/`
2. Entry in `docs/processes/processes.json` and README table
3. Process id in catalog + role assignment
4. Help article describing the user path

## 7. System navigation parity

New workspace sidebar section → matching section in `web/src/lib/system/nav.ts` with `withReferenceData()`.

## 8. In-app help

New routes need help articles, `page-guides.ts` mapping, and footer link. Run `npm run page-guides:check` after route changes.

## 9. Payroll & NDIS boundaries (from scope)

| Responsibility | Owner |
|----------------|--------|
| Shift data, verification, timesheet approval | AbilityAPP |
| SCHADS award interpretation, pay, STP, super | Keypay / Employment Hero / Xero (integration) |
| SCHADS **cost estimates** for planning/roster quotes | AbilityAPP (estimate loadings only) |
| NDIS claims submission | AbilityAPP + PRODA/gateway partner |
| Worker screening verification | Manual + expiry tracking (no public NDIS API) |

Do not implement full payroll engine in AbilityAPP.

## 10. Integration pattern

External systems (PRODA, Keypay, Xero, HubSpot, etc.):

- Config in organisation settings (future) or env for now
- Server-side API routes; never expose secrets to client
- Idempotent sync + audit log of import/export
- Graceful degradation when integration not configured

## 11. Verification before handoff

Every slice must pass **automated checks** before push. **UI slices** also need a **browser smoke test**. **Every push to `main`** needs a **Bugbot code review** logged in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md).

### Tier 1 — Every slice (agent, required)

```powershell
cd web
npm run build
npm run page-guides:check
```

If schema changed:

```powershell
cd ..
npm run supabase:push-remote
```

Log commands and exit codes in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md) → **Verification log**.

### Tier 2 — Browser smoke test (agent, required for UI)

Run when the slice adds or changes pages, tabs, save flows, filters, or role-gated UI.

1. Open the hosted app (Amplify URL after push) or `npm run dev` locally.
2. Walk the **What you can test** steps for that slice in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md).
3. Confirm: page loads, save persists after refresh, audit footer visible, no console errors on the path tested.
4. Log result in BUILD-PROGRESS → **Browser verification log** (pass / fail + route).

Skip browser only for pure backend/migration-only slices with no UI surface.

### Tier 3 — Bugbot code review (agent, required before every push to `main`)

After build passes and before `git push`:

1. Launch Bugbot on **`branch changes`** (or `uncommitted changes` if not yet committed).
2. Fix **Critical** and **High** findings before push; log **Medium** as follow-up in BUILD-PROGRESS if deferred.
3. Record in BUILD-PROGRESS → **Code review log**: date, commit range, finding count, link or summary.

Optional on request: Security Review subagent for auth/integration changes.

### Tier 4 — Optional

```powershell
cd web
npm run lint
```

Report **Verification** block with commands and exit codes in handoff messages.

## 12. Deploy pipeline

- Push to `main` → GitHub Actions applies Supabase migrations
- AWS Amplify builds `web/` root
- Remote DB: `npm run supabase:push-remote` when migrations added locally before CI

## 13. Documentation updates

When completing a roadmap chunk, update status in [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md).
