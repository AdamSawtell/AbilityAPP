# Core reference documents

**Keep these up to date.** They are the canonical description of what AbilityAPP does and where it lives in the UI.

Agents and developers must update them in the same slice as code changes — see [.cursor/rules/core-reference-docs.mdc](../../.cursor/rules/core-reference-docs.mdc).

| Document | Purpose | Audience |
|----------|---------|----------|
| [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) | What each function does and the outcomes it produces | Reviewers, auditors, stakeholders |
| [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) | Sidebar windows, routes, window keys, and record tabs — by function | Developers, BA, access admins, reviewers |

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

## Related docs (not in this folder)

- [BUILD-PROGRESS.md](../BUILD-PROGRESS.md) — what shipped and test steps  
- [SCOPE-ROADMAP.md](../SCOPE-ROADMAP.md) — phased backlog  
- [testing/HAPPY-PATH-E2E-MATRIX.md](../testing/HAPPY-PATH-E2E-MATRIX.md) — E2E verification  
- [testing/UAT-INDEX.md](../testing/UAT-INDEX.md) — full window/process UAT catalogue  

## Legacy path

`docs/SYSTEM-FUNCTION-GUIDE.md` redirects here for bookmarks and old GitHub links.
