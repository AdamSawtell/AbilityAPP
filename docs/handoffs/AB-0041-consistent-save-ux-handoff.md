# AB-0041 — Consistent save UX across line-item tables (handoff)

**Status:** Shipped (Phase 1 + Phase 2)  
**Commit:** _(filled on push)_  
**Backlog:** AB-0041 Consistent Save UX Across Line-Item Tables

## Summary

Line-item tables and page-level save bars now give clear feedback after save — dirty row counts, inline Save/Discard, green confirmation with optional link, and AB-0038 toast reinforcement. Goals and Progress Reviews no longer use the silent `PlanSaveBar` pattern.

## What shipped

| Area | Change |
|------|--------|
| Dirty tracking | `web/src/lib/use-dirty-tracking.ts` — row count vs reference snapshot |
| Inline save bar | `web/src/components/line-item-save-bar.tsx` — dirty / saving / saved / error states |
| LineItemTable | Optional `saveable`, `referenceRows`, `saveStatus`, `onSave`, `onDiscard`, confirmation props |
| Goals + reviews | `client-planning-panels.tsx` — inline save bar replaces `PlanSaveBar` |
| Page saves | `unsaved-changes-bar.tsx` — green confirmation mode, auto-dismiss 5s |
| Client record | `client-pages.tsx` — post-save confirmation with tab link + toast |

## Behaviour

- **Dirty:** Amber bar — `N goals changed` + Save / Discard
- **Saving:** Save button shows **Saving…** (disabled)
- **Saved:** Green bar — `Saved — N goals updated` + link to tab; toast fires; auto-dismiss after 5s
- **Error:** Red inline message; data retained; buttons re-enabled
- **Audit:** Support plan saves already call `persistRecordAudit` via `upsertSupportPlan` in data-store

## Phase 3 (deferred)

- `contract-view.tsx`, `employee-view.tsx` inline save bars
- Remaining `UnsavedChangesBar` consumers (board reporting, business partners, admin org, document templates)

## Verification

```text
npm run test:karen   # AB-0041 dirty tracking checks
npm run build
npm run page-guides:check
```

**Browser (TEST-069):**

1. Open a client → **Goals** tab → edit a goal row → amber save bar appears
2. Click **Save** → green confirmation + **Goals saved ✓** toast → data persists after refresh
3. Edit client **Alerts** tab → bottom **UnsavedChangesBar** → Save → green confirmation with tab link
