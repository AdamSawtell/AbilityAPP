# Process 3: Assign client to location

| | |
|---|---|
| **ID** | `assign-location-client` |
| **Status** | Live |
| **Module** | Locations → Clients |

## Purpose

Link support receivers to a support location (SIL house, day program, etc.) with assignment role, primary flag, and valid dates.

## Trigger

- User opens a location (`/locations/[id]`).
- Adds or edits rows on the **Clients** tab when the role has this process.

## Outcome

| Record | Change |
|--------|--------|
| **Location** | `support_location_client` child rows added, updated, or removed |
| **Persist** | Location saved with normalized client link lines |

## Steps

1. **Guard** — `canProcess("assign-location-client")` and window access to `location-clients`.
2. **Select client** — Pick from active support receivers in the data store.
3. **Set assignment** — Role, primary assignment, valid from/to, notes.
4. **Save** — Location record persisted.

## Rules and constraints

- Requires parent window **Clients** on the location record.
- Client picker uses existing client catalog.

## Code locations

| Role | File |
|------|------|
| UI | `web/src/components/location-view.tsx`, `web/src/components/location-pages.tsx` |
| Model | `web/src/lib/location.ts`, `web/src/lib/location-line-tables.ts` |
| Persist | `web/src/lib/supabase/data-api.ts`, `web/src/lib/supabase/location-mappers.ts` |

## Database

- **Write:** `support_location_client`
- **Read:** `client`, `support_location`

## Related processes

- [04-assign-location-employee.md](./04-assign-location-employee.md) — staff at the same location
- [05-assign-location-product.md](./05-assign-location-product.md) — services offered at the location

Process visibility is controlled per role in **Admin → Roles**.
