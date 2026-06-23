# Core reference documents

**Keep these up to date.** They are the canonical description of what AbilityAPP does, how records connect, who can do what, and where it lives in the UI.

Agents and developers must update them in the same slice as code changes — see [.cursor/rules/core-reference-docs.mdc](../../.cursor/rules/core-reference-docs.mdc).

| Document | Purpose | Audience |
|----------|---------|----------|
| [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) | What each function does and the outcomes it produces | Reviewers, auditors, stakeholders |
| [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) | Sidebar windows, routes, window keys, and record tabs — by function | Developers, BA, access admins, reviewers |
| [PROCESSES-AND-WORKFLOWS.md](./PROCESSES-AND-WORKFLOWS.md) | Process triggers, preconditions, steps, and save workflows | Developers, BA, access admins |
| [ENTITY-AND-DATA-MODEL.md](./ENTITY-AND-DATA-MODEL.md) | Record links, child line tables, spine, compliance on save | Developers, BA, data reviewers |
| [ROLES-AND-ACCESS.md](./ROLES-AND-ACCESS.md) | Personas, roles, and grants by function area (not every window key) | Access admins, BA, reviewers |

## How the guides fit together

```
SYSTEM-FUNCTION-GUIDE  →  what / why (outcomes)
WINDOWS-AND-TABS       →  where (routes, keys)
PROCESSES-AND-WORKFLOWS → how (actions, side effects)
ENTITY-AND-DATA-MODEL  →  what links to what (data spine)
ROLES-AND-ACCESS       →  who (personas × functions)
```

## Code source of truth

When the docs and code disagree, **fix both** in the same change:

| Concern | Code |
|---------|------|
| All windows and processes | `web/src/lib/access/catalog.ts` |
| Record tab → window key mapping | `web/src/lib/access/detail-windows.ts` |
| Client tab groups | `web/src/lib/client.ts` (`clientTabGroups`, `clientTabs`) |
| Employee tab groups | `web/src/lib/employee.ts` (`employeeTabGroups`) |
| Enquiry / incident / location tabs | `web/src/lib/enquiry.ts`, `incident.ts`, `location.ts` |
| System navigation | `web/src/lib/system/nav.ts` |
| Role grants (demo) | `supabase/seed-access.sql` |
| Entity mappers and child tables | `web/src/lib/supabase/mappers.ts`, `data-api.ts` |
| Numbered processes | `docs/processes/processes.json`, `docs/processes/*.md` |
| Save compliance | `web/src/lib/*-compliance.ts`, `*-lifecycle.ts` |

## Related docs (not in this folder)

- [BUILD-PROGRESS.md](../BUILD-PROGRESS.md) — what shipped and test steps  
- [SCOPE-ROADMAP.md](../SCOPE-ROADMAP.md) — phased backlog  
- [testing/HAPPY-PATH-E2E-MATRIX.md](../testing/HAPPY-PATH-E2E-MATRIX.md) — E2E verification  
- [testing/UAT-INDEX.md](../testing/UAT-INDEX.md) — full window/process UAT catalogue  

## Legacy path

`docs/SYSTEM-FUNCTION-GUIDE.md` redirects here for bookmarks and old GitHub links.
