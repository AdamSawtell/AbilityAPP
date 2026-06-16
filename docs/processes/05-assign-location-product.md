# Process 5: Assign product to location

| | |
|---|---|
| **ID** | `assign-location-product` |
| **Status** | Live |
| **Module** | Locations → Products & services |

## Purpose

Define which products and services from the catalog are offered at a support location (SIL weekday, community participation, transport, etc.).

## Trigger

- User opens a location (`/locations/[id]`).
- Adds or edits rows on the **Products & services** tab when the role has this process.

## Outcome

| Record | Change |
|--------|--------|
| **Location** | `support_location_product` child rows added, updated, or removed |
| **Persist** | Location saved with product link lines |

## Steps

1. **Guard** — `canProcess("assign-location-product")` and window access to `location-products-and-services`.
2. **Select product** — Pick from active products in the catalog.
3. **Set details** — Active flag, valid from/to, notes.
4. **Save** — Location record persisted.

## Rules and constraints

- Requires parent window **Products & services** on the location record.
- Product picker shows active catalog items only.

## Code locations

| Role | File |
|------|------|
| UI | `web/src/components/location-view.tsx`, `web/src/components/location-pages.tsx` |
| Model | `web/src/lib/location.ts`, `web/src/lib/location-line-tables.ts` |
| Persist | `web/src/lib/supabase/data-api.ts`, `web/src/lib/supabase/location-mappers.ts` |

## Database

- **Write:** `support_location_product`
- **Read:** `product`, `support_location`

## Related processes

- [03-assign-location-client.md](./03-assign-location-client.md) — clients receiving services at the location

Process visibility is controlled per role in **Admin → Roles**.
