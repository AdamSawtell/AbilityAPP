# Process 1: Enquiry → Client

| | |
|---|---|
| **ID** | `enquiry-to-client` |
| **Status** | Live |
| **Module** | Enquiries → Clients (Support received) |

## Purpose

Move someone from **intake** (enquiry) to a **support receiver** (client) when the organisation decides to proceed. The enquiry stays in the system for audit; the client becomes the working record for care and services.

## Trigger

- User opens an enquiry (`/enquiries/[id]`).
- Clicks **Convert to client** (only when the enquiry is not already converted and there are no unsaved changes).

## Outcome

| Record | Change |
|--------|--------|
| **Client** | New row created (`client` + optional `client_alert` from enquiry notes) |
| **Enquiry** | Status → `4_Converted`; outcome text notes the conversion date and client search key |
| **Navigation** | User is sent to `/clients/{id}` |

## Steps

1. **Guard** — If a client already exists for this `enquiryId`, return that client (no duplicate).
2. **Search key** — Build a short unique key from first + last name (e.g. `Samuel` + `Ryan` → `SamR`). Append a number if the key is taken.
3. **Client shell** — Create client with:
   - `id`: `bp-{searchKey}` (lowercase)
   - `businessPartnerGroup`: Support Receiver
   - `status`: `1_Prospect`
   - `enquiryId`: linked to source enquiry
   - Fields copied from enquiry: name, contact, funding, disability, services, etc.
   - `dateSupportCommencement`: today
   - If enquiry has a description → one **alert** row (“Enquiry notes”)
4. **Enquiry update** — Set status `4_Converted` and outcome message if empty.
5. **Persist** — Save enquiry and client to Supabase (or localStorage when DB not configured).
6. **Redirect** — Open the new client record.

## Field mapping (enquiry → client)

| Enquiry | Client |
|---------|--------|
| `firstName`, `lastName` | `firstName`, `lastName`, `name`, `preferredName` |
| `email`, `phone` | `email`, `phone` |
| `birthday`, `gender` | `birthday`, `gender` |
| `fundingBody`, `disability`, `services` | same |
| `additionalDisabilityInformation` | same |
| `thirdPartyConsent` | `consentAlertList` as `Consent-{value}` |
| `description` | `client_alert` (if present) |
| `createdBy` | `createdBy` |

Empty client fields after conversion: locations, activity, funding body number, PACE date, living arrangement, etc. User fills these on the client record.

## Rules and constraints

- Cannot convert with **unsaved** enquiry edits (must save first).
- Button shows **Converted** when status starts with `4_` or a linked client exists.
- Search keys must be unique across all clients.

## Code locations

| Role | File |
|------|------|
| UI button | `web/src/components/enquiry-pages.tsx` |
| Orchestration hook | `web/src/lib/data-store.tsx` → `useConvertEnquiry()` |
| Conversion logic | `web/src/lib/convert.ts` → `convertEnquiryToClient()` |
| Client defaults | `web/src/lib/client.ts` → `emptyClientFromEnquiry()` |

## Database

- **Read:** `enquiry`, `client`
- **Write:** `enquiry` (status, outcome), `client`, `client_alert` (optional)

No separate process table; state is on the enquiry and client rows.

## Related processes

- None yet. Future candidates: service agreement from client, support plan activation, service booking from agreement.

Process visibility is controlled per role in **Admin → Roles**. See [ABILITYERP-USERS-ROLES.md](../ABILITYERP-USERS-ROLES.md).
