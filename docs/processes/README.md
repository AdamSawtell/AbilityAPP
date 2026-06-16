# Core processes

Business processes implemented in AbilityAPP. Each process has a numbered doc in this folder.

**Ask anytime:** "Tell me the processes" or "What does process X do?"  
Start here, then open the linked doc for full detail.

| # | ID | Name | Status | What it does |
|---|-----|------|--------|--------------|
| 1 | `enquiry-to-client` | Enquiry → Client | **Live** | Turns an enquiry into a new support receiver (client) record and marks the enquiry converted. |
| 2 | `assign-employee-credential` | Assign employee credential | **Live** | Add or update credentials assigned on an employee record. |
| 3 | `assign-location-client` | Assign client to location | **Live** | Link support receivers to a support location. |
| 4 | `assign-location-employee` | Assign employee to location | **Live** | Link staff to a support location. |
| 5 | `assign-location-product` | Assign product to location | **Live** | Link products and services offered at a support location. |
| 6 | `assign-task` | Assign task | **Live** | Create and assign a task on a record (user or role). |
| 7 | `action-task` | Action task | **Live** | Start, complete, or cancel tasks assigned to you or your role. |

## Status values

| Status | Meaning |
|--------|---------|
| **Live** | Built and in use |
| **Planned** | Agreed, not built yet |
| **Draft** | Being designed |

## Adding a process

1. Copy [`_template.md`](./_template.md) to `NN-short-name.md` (next number in sequence).
2. Add a row to the table above and an entry in [`processes.json`](./processes.json).
3. Register the process in `web/src/lib/access/catalog.ts` (`ACCESS_PROCESSES`).
4. If the process writes data, follow [`DATABASE-CHANGES.md`](../DATABASE-CHANGES.md).
5. Link the process from code comments where the orchestration lives.

## Related docs

- [DATABASE-CHANGES.md](../DATABASE-CHANGES.md) — schema rules for new features
- [SUPABASE-SETUP.md](../SUPABASE-SETUP.md) — database and deploy
- [ABILITYERP-USERS-ROLES.md](../ABILITYERP-USERS-ROLES.md) — role and process management
