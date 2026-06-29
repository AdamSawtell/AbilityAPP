# AB-0038 — Save Confirmation Toast — implementation handoff

**Date:** 2026-06-29  
**Status:** Shipped (Phase 1 + Phase 2)  
**Backlog:** AB-0038  
**Downstream:** AB-0041 (line-item table save UX) will import `@/lib/toast`

## Summary

Green success toasts now appear top-right after successful saves and submits. They auto-dismiss after 3 seconds, use a shared toast id so rapid saves replace rather than stack, and do not block interaction.

## Architecture

| Item | Path |
|------|------|
| Toast API | `web/src/lib/toast.ts` — `showSuccessToast(message)`, `SAVE_TOAST_MESSAGES`, `SAVE_SUCCESS_TOAST_ID` |
| Toaster UI | `web/src/components/success-toaster.tsx` — Sonner, emerald styling, top-right |
| Root mount | `web/src/app/layout.tsx` |
| Dependency | `sonner` (added to `web/package.json`) |

## Wired surfaces

### Phase 1 (frontline / high traffic)

| Screen | Message |
|--------|---------|
| My availability | Availability saved ✓ |
| Roster shift editor | Shift saved ✓ |
| My timesheets submit | Timesheet submitted ✓ |
| Timesheets (coordinator save/submit/approve) | Saved ✓ / Timesheet submitted ✓ / Timesheet approved ✓ |
| Client record save | Client saved ✓ |
| New client | Client saved ✓ |
| AI activity prepare save | Activity note saved ✓ |
| My leave submit | Leave request submitted ✓ |

### Phase 2 (settings, staff, documents, records)

| Screen | Message |
|--------|---------|
| Organisation profile | Settings saved ✓ |
| Availability hours policy (system) | Settings saved ✓ |
| Shift check-in monitoring | Settings saved ✓ |
| Incident management SLA | Settings saved ✓ |
| Buddy shift pay policy | Settings saved ✓ |
| Employee system access | Settings saved ✓ |
| Location record | Location saved ✓ |
| Employee record | Staff saved ✓ |
| Incident evidence upload | Document uploaded ✓ |
| All other record detail saves (enquiry, incident, contract, product, price list, service agreement, business partner, fleet, maintenance, agency worker, claim) | Saved ✓ |

Inline success text (emerald paragraphs) is unchanged — toast is additive secondary feedback per AB-0041 pairing.

## Usage for AB-0041

```typescript
import { showSuccessToast } from "@/lib/toast";

showSuccessToast("2 goals saved ✓");
```

## Acceptance criteria

- [x] `showSuccessToast(message)` utility using Sonner
- [x] Green top-right toast, checkmark, 3s auto-dismiss
- [x] Non-modal; shared id prevents stacking
- [x] Error handling unchanged (inline errors only)
- [x] Unit export checks in `npm run test:karen`

## Test plan

1. **Unit:** `npm run test:karen` — AB-0038 export checks
2. **Build:** `npm run build`, `npm run page-guides:check`
3. **Browser smoke (Tier 2):**
   - My availability → Save → green toast top-right
   - Client record → Save changes bar → Client saved ✓
   - Roster → create/edit shift → Shift saved ✓
   - My timesheets → Submit → Timesheet submitted ✓
   - AI chat → Save activity → Activity note saved ✓

## Out of scope (unchanged)

- Error toasts
- Undo actions
- Load/read confirmations
- Removing inline “Saved” labels (AB-0041)
