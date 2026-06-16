# Process 4: Assign employee to location

| | |
|---|---|
| **ID** | `assign-location-employee` |
| **Status** | Live |
| **Module** | Locations → Employees |

## Purpose

Link staff to a support location with assignment role (site manager, support worker, etc.), primary flag, and valid dates.

## Trigger

- User opens a location (`/locations/[id]`).
- Adds or edits rows on the **Employees** tab when the role has this process.

## Outcome

| Record | Change |
|--------|--------|
| **Location** | `support_location_employee` child rows added, updated, or removed |
| **Persist** | Location saved with normalized employee link lines |

## Steps

1. **Guard** — `canProcess("assign-location-employee")` and window access to `location-employees`.
2. **Select employee** — Pick from employee Business Partners.
3. **Set assignment** — Role, primary assignment, valid from/to, notes.
4. **Save** — Location record persisted.

## Rules and constraints

- Requires parent window **Employees** on the location record.

## Code locations

| Role | File |
|------|------|
| UI | `web/src/components/location-view.tsx`, `web/src/components/location-pages.tsx` |
| Model | `web/src/lib/location.ts`, `web/src/lib/location-line-tables.ts` |
| Persist | `web/src/lib/supabase/data-api.ts`, `web/src/lib/supabase/location-mappers.ts` |

## Database

- **Write:** `support_location_employee`
- **Read:** `employee`, `support_location`

## Related processes

- [03-assign-location-client.md](./03-assign-location-client.md) — clients at the same location

Process visibility is controlled per role in **Admin → Roles**.
