# AB-0037 — Empty State Pages — implementation handoff

**Date:** 2026-06-30  
**Status:** Shipped (Phase 1)  
**Backlog:** AB-0037

## Summary

Friendly empty states replace plain "No data" text across list views and key My workplace screens. Each state shows an inline SVG icon, heading, short message, and contextual CTA. Search/filter zero-results use a separate `no-results` variant with **Clear filters**.

## Architecture

| Item | Path |
|------|------|
| Component | `web/src/components/ui/empty-state.tsx` — `EmptyState`, `EmptyStateRow`, `emptyStateIcons` |
| Icons | Inline SVG (no lucide dependency — repo has no icon library) |
| Table helper | `EmptyStateRow` — full-width `<tr><td>` wrapper for list tables |

## Phase 1 coverage

| Screen | Variant | CTA |
|--------|---------|-----|
| Clients list | empty / no-results | Add client / Clear filters |
| Locations list | empty / no-results | Add location / Clear filters |
| Employees list | empty / no-results | Add staff / Clear filters |
| Enquiries list | empty / no-results | Add enquiry / Clear filters |
| Service bookings list | empty / no-results | Add booking / Clear filters |
| Service agreements list | empty / no-results | Add agreement / Clear filters |
| Business partners list | empty / no-results | Add partner / Clear filters |
| My Shifts | empty / filtered empty | View open shifts |
| My Timesheets | empty | View my shifts |
| My Leave requests | empty | (message only — form above) |
| Admin Timesheets register | empty | Generate timesheets |
| Rostering week view | empty | Create shift (when editor access) |

## Acceptance criteria

- [x] `<EmptyState>` with `variant` `'empty' | 'no-results'`
- [x] Top 8+ screens with module-specific CTAs
- [x] List searches show `no-results` + Clear filters
- [x] Empty states only after data resolves (skeletons unchanged from AB-0036)
- [x] Pages with data unchanged

## Test plan

1. **Unit:** `npm run test:karen` — AB-0037 export checks
2. **Build:** `npm run build`, `npm run page-guides:check`
3. **Browser:** TEST-067 in `docs/testing/TEST-RUNBOOKS.md`

## Phase 2 (deferred)

- Remaining sub-tabs and admin registers (reports, documents, notifications)
- `variant='permission'` (explicitly out of scope per backlog non-goals)
