# AB-0039 — Breadcrumb navigation (handoff)

**Status:** Shipped (Phase 1 + Phase 2)  
**Commit:** `bdc2156`  
**Backlog:** AB-0039 Breadcrumb Navigation

## Summary

Added auto-derived breadcrumb navigation on every `AppShell` and `SystemShell` page. A reusable `<Breadcrumbs>` component renders below the workspace tab bar and above the page title. Parent segments link back; the current page is plain text. Dynamic record IDs resolve to names from the data store; record tabs append a segment from `?tab=`.

## What shipped

| Area | Change |
|------|--------|
| UI | `web/src/components/ui/breadcrumbs.tsx` — `>` separators, truncation + tooltip, subtle strip styling |
| Route map | `web/src/lib/breadcrumbs/route-labels.ts` — labels from `ACCESS_WINDOWS`, system nav, reports catalog |
| Builder | `web/src/lib/breadcrumbs/build-breadcrumbs.ts` — pathname + searchParams → trail |
| Entity labels | `web/src/lib/breadcrumbs/entity-resolvers.ts` — client, employee, location, invoice, etc. |
| Hook | `web/src/lib/breadcrumbs/use-auto-breadcrumbs.ts` — used in workspace + system shells |
| Shells | `workspace-chrome.tsx`, `system-shell.tsx` — auto breadcrumbs when `breadcrumbs` prop omitted |

## Behaviour

- **Explicit override:** Pages that pass `breadcrumbs={...}` to `AppShell` keep their custom trail (backward compatible).
- **Auto default:** Pages without a prop (e.g. Home, Rostering) get a trail from the current URL.
- **My workplace:** `/my/availability` → `Home > My workplace > My availability`
- **Record detail:** `/clients/{id}` → `Home > Clients > {name}`; `?tab=Activity` adds **Activity**
- **Tasks scope:** `/tasks?scope=assigned-to-me` → `Home > Tasks > Assigned to me`

## Verification

```text
npm run test:karen   # AB-0039 segment checks
npm run build
npm run page-guides:check
```

**Browser (TEST-068):**

1. `/` — breadcrumb shows **Home** only
2. `/my/availability` — **Home > My workplace > My availability**; click **My workplace** → `/my`
3. Open a client → name in trail; switch to Activity tab → **Activity** segment appears
4. Sidebar navigation still works; no duplicate trails on pages with explicit breadcrumbs

## Deferred / follow-up

- Portal shells (`PortalShell`) — separate layout; not in scope
- Remove redundant manual `breadcrumbs={...}` props over time (optional cleanup)
