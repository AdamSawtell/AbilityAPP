# Core processes

Business processes implemented in AbilityAPP. Each process has a numbered doc in this folder.

**Ask anytime:** “Tell me the processes” or “What does process X do?”  
Start here, then open the linked doc for full detail.

| # | ID | Name | Status | What it does |
|---|-----|------|--------|--------------|
| 1 | `enquiry-to-client` | Enquiry → Client | **Live** | Turns an enquiry into a new support receiver (client) record and marks the enquiry converted. |

## Status values

| Status | Meaning |
|--------|---------|
| **Live** | Built and in use |
| **Planned** | Agreed, not built yet |
| **Draft** | Being designed |

## Adding a process

1. Copy [`_template.md`](./_template.md) to `NN-short-name.md` (next number in sequence).
2. Add a row to the table above and an entry in [`processes.json`](./processes.json).
3. If the process writes data, follow [`DATABASE-CHANGES.md`](../DATABASE-CHANGES.md).
4. Link the process from code comments where the orchestration lives.

## Related docs

- [DATABASE-CHANGES.md](../DATABASE-CHANGES.md) — schema rules for new features
- [SUPABASE-SETUP.md](../SUPABASE-SETUP.md) — database and deploy
