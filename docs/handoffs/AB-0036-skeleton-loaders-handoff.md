# AB-0036 — Skeleton Loaders — implementation handoff

**Date:** 2026-06-30  
**Status:** Shipped (Phase 1 + Phase 2)  
**Backlog:** AB-0036

## Summary

Grey pulsing skeleton placeholders now appear during initial app/data load and on key async page fetches, replacing blank screens and plain "Loading…" text.

## Architecture

| Item | Path |
|------|------|
| Base primitives | `web/src/components/ui/skeleton.tsx` — `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable` |
| Layout skeletons | `web/src/components/ui/page-skeletons.tsx` — route-specific + content-only variants |
| Theme token | `--muted` / `bg-muted` in `web/src/app/globals.css` |
| Route resolver | `routePageSkeleton(pathname)` |
| Accessibility | Skeleton routes include `role="status"` text for screen readers while visual blocks stay `aria-hidden` |

## Phase 1 coverage

| Route / surface | Skeleton |
|-----------------|----------|
| Auth session hydrate | `routePageSkeleton` via `AuthGate` |
| Data store hydrate | `routePageSkeleton` via `DataProvider` |
| Dashboard `/` | `DashboardPageSkeleton` |
| My workplace `/my` | `MyWorkplacePageSkeleton` + hub content skeleton on API fetch |
| My availability | `MyAvailabilityPageSkeleton` |
| My profile | `MyProfilePageSkeleton` |
| My shifts `/my/shifts` | `MyShiftsPageSkeleton` |
| Clients list `/clients` | `RecordListPageSkeleton` |
| Client detail (Suspense) | `ClientDetailSkeleton` |
| Locations list `/locations` | `RecordListPageSkeleton` |
| Location detail (Suspense) | `ClientDetailSkeleton` |
| Rostering `/rostering` | `RosteringPageSkeleton` |

## Acceptance criteria

- [x] `<Skeleton>` in `web/src/components/ui/skeleton.tsx` with `animate-pulse` + `bg-muted`
- [x] Top 5 routes show layout-matching skeletons during data fetch
- [x] No new animation libraries
- [x] Error handling unchanged (skeleton replaced by error text when fetch fails)

## Test plan

1. **Unit:** `npm run test:karen` — AB-0036 export checks
2. **Build:** `npm run build`, `npm run page-guides:check`
3. **Browser:** Hard refresh `/`, `/clients`, `/locations`, `/my`, `/rostering` — grey placeholders before content

## Bugbot remediation

- My workplace hub tiles remain available if `/api/my` fails, but no longer overlap the loading skeleton.
- Rostering communication stays mounted while the hub summary loads.
- Availability uses row-only placeholders inside the existing form, avoiding duplicate form chrome.
- Portal/agency portal hydration uses neutral portal skeletons instead of staff workspace chrome.
- Route skeletons include accessible loading status text.

## Phase 2 coverage (2026-06-30)

| Surface | Skeleton |
|---------|----------|
| Record detail fallbacks | `ClientDetailSkeleton` on incident, contract, enquiry, employee, business partner, client new |
| Admin settings | `SettingsFormSkeleton` on time/date, leave, shift check-in, availability hours, document email/templates |
| Admin tables | `SkeletonTable` / `TableRowsSkeleton` on AI agents, document registry, session audit |
| Process investigation modal | `SkeletonCard` + `SkeletonText` overlay |
| Portal guards | `PortalGuardSkeleton` on participant + agency portal session check |
| Portal auth Suspense | `PortalPageSkeleton` |
| Agency portal lists | `SkeletonTable` on requests, timesheets, invoices; `ClientDetailSkeleton` on request detail |
| Task / new record Suspense | `ClientDetailSkeleton` on tasks, enquiries/new, incidents/new, agency-workers/new |
| Config hydrate | `GenericPageSkeleton` in ReferenceDataProvider |
| Inline async | `InlineListSkeleton` on AI chat agents, record documents saved files + print log |
| Extended routes | `routePageSkeleton` for employees, incidents, enquiries, tasks, contracts, business partners |

## Phase 2 (complete)

- ~~Remaining admin/async panels still using inline "Loading…"~~ — done
- ~~Modal/overlay skeletons~~ — process investigation modal done
- Refetch skeletons (FR-006 — may be noisy) — intentionally deferred; button labels like "Loading…" on save/digest actions remain as inline button state, not page loaders

## Usage

```tsx
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { RecordListPageSkeleton } from "@/components/ui/page-skeletons";

if (loading) return <SkeletonTable rows={6} columns={4} />;
```
