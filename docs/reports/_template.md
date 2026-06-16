# Report template

| Field | Value |
|-------|-------|
| **ID** | `report-id` |
| **Status** | Draft / Planned / Live |
| **Module** | Clients / Enquiries / … |
| **Max columns** | 20 |
| **Export formats** | CSV |

## Purpose

What business question does this report answer?

## Columns

List each column and its source field.

## Access

- Window: `reports`
- Report: `report-id`
- Parent module: `parent-module-key`

## Code

- Catalog: `web/src/lib/reports/catalog.ts`
- Runner: `web/src/lib/reports/runners/…`
