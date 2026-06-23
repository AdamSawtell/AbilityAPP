# AbilityVua — system build expectations

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

## 8. In-app help (every slice)

Every slice that adds or changes user-facing behaviour must ship **both** a user how-to guide and system setup guidance before push.

### User how-to guide

| Requirement | Location |
|-------------|----------|
| Article section with title, body, and **steps** or **bullets** | `web/src/lib/help/articles/*.ts` |
| Route still resolves (usually via existing prefix rule) | `web/src/lib/help/page-guides.ts` |
| Footer **How to use this page** link works on affected routes | Run `npm run page-guides:check` |

Add or update sections for new tabs, fields, panels, filters, save rules, and workflows. Use plain language and numbered steps where the user performs an action sequence.

### System setup guide

| Requirement | Location |
|-------------|----------|
| Checklist items for reference data and role grants | `web/src/lib/help/articles/module-setup-guides.ts` |
| Reference list values (if new dropdown) | `web/src/lib/reference-data.ts` + `/system/reference-data/<section>` |
| Setup hub page | `/system/setup/<section>` (via `web/src/lib/system/nav.ts`) |

Checklist must name: reference data lists to review, role windows to grant, and a **test record** step coordinators can repeat after go-live.

### Documentation in BUILD-PROGRESS

For each shipped slice, add rows to **User guides & system setup** in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md) and log delivery in **Guide delivery log**.

Run `npm run page-guides:check` after help changes (Tier 1).

## 8.1 Record documents (print, PDF, send)

Every record tab or detail view with print/PDF/send actions:

| Requirement | Location |
|-------------|----------|
| Shared UI at bottom of record content | `web/src/components/record-documents-section.tsx` |
| Process audit on print/send | `web/src/lib/document-print-audit.ts` |
| Help link map | `web/src/lib/record-document-help.ts` |
| Entity file + print history API | `web/src/app/api/documents/entity-history/route.ts` |
| Dev rule | `.cursor/rules/record-documents.mdc` |

Do **not** add loud print buttons to `AppShell` actions or inline delivery instruction panels. Link to how-to guides instead.

## 9. Payroll & NDIS boundaries (from scope)

| Responsibility | Owner |
|----------------|--------|
| Shift data, verification, timesheet approval | AbilityVua |
| SCHADS award interpretation, pay, STP, super | Keypay / Employment Hero / Xero (integration) |
| SCHADS **cost estimates** for planning/roster quotes | AbilityVua (estimate loadings only) |
| NDIS claims submission | AbilityVua + PRODA/gateway partner |
| Worker screening verification | Manual + expiry tracking (no public NDIS API) |

Do not implement full payroll engine in AbilityVua.

## 10. Integration pattern

External systems (PRODA, Keypay, Xero, HubSpot, etc.):

- Config in organisation settings (future) or env for now
- Server-side API routes; never expose secrets to client
- Idempotent sync + audit log of import/export
- Graceful degradation when integration not configured

## 11. Verification before handoff

Every slice must pass **all applicable tiers** before push. **Do not stop after build alone** when UI changed. **Do not push without Bugbot.** **Do not wait for the user** to say continue — after push, start the next slice in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md).

### Slice closure loop (agent default)

```
Implement → Tier 1 → Tier 2 localhost browser → Tier 3 Bugbot → log BUILD-PROGRESS → push → next slice
```

Command checklist: [.cursor/commands/test-before-handoff.md](../.cursor/commands/test-before-handoff.md).

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

### Tier 2 — Browser smoke test on localhost (agent, required for UI)

Run when the slice adds or changes pages, tabs, save flows, filters, or role-gated UI.

1. Start or reuse `cd web && npm run dev` — test on **localhost** before push (Amplify spot-check is optional after push).
2. Walk the **What you can test** steps for that slice in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md).
3. Confirm: page loads, save persists after refresh, audit footer visible, no console errors on the path tested.
4. Log result in BUILD-PROGRESS → **Browser verification log** (pass / fail + route + localhost port).

Use Cursor browser MCP or equivalent automation when available.

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

## 14. Entity linking (non-negotiable)

Operational records must connect to the right **client**, **employee**, **location**, and upstream documents. Do not ship orphan records that cannot be traced from the participant or worker profile.

### Required for every new record type

| Requirement | Location |
|-------------|----------|
| Foreign keys in Supabase (or explicit parent id fields) | `supabase/migrations/` |
| Typed id fields on the record | `web/src/lib/*.ts` |
| Picker or read-only link on detail/new forms | Record pages + `record-link.tsx` |
| Reverse panel on the parent record (client tab, employee tab, etc.) | `*-pages.tsx`, `client-view.tsx`, … |
| Save blocked when a required link is missing | `*-compliance.ts` or save handler |
| Task entity type when tasks can attach | `web/src/lib/task.ts`, `task-entities.ts` |
| Help article mentions how to link from both sides | `web/src/lib/help/articles/` |

### Link matrix (current)

| Record | Required links | Reverse UI | Compliance |
|--------|----------------|------------|------------|
| **Client** | enquiry (optional) | — | — |
| **Service agreement** | client, price list | Client → Service agreements tab | lifecycle validation |
| **Service booking** | client, service agreement (when funded) | Client → Service bookings tab | `booking-compliance.ts` |
| **Incident** | client | Client → Incidents tab | incident workflow |
| **Task** | entityType + entityId when related | parent Requests tab | — |
| **Location** | — | Client locations line table | — |
| **Employee** | — | — | — |
| **Timesheet / roster shift** (future) | employee, client and/or location, booking | employee + client tabs | Chunk 4+ |

When adding a slice, extend this matrix in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md) if the record type is new or links change.

### UI patterns

- **Detail header:** use `ClientRecordLink`, `EmployeeRecordLink`, `LocationRecordLink`, or module list links — not plain text ids.
- **Client Core tab group:** delivery documents (agreements, bookings) sit beside Support Plan so coordinators see funding and delivery in one place.
- **List columns:** show linked client (or employee) with a record link, not only document number.
- **New record:** pre-fill parent id when opened from a client tab (`?clientId=` or route context).
