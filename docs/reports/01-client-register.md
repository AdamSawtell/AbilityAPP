# Client register

| Field | Value |
|-------|-------|
| **ID** | `client-register` |
| **Status** | Live |
| **Module** | Clients |
| **Max columns** | 20 |
| **Export formats** | CSV |

## Purpose

Export and review a tabular list of support receiver (client) records for operational reporting, audits, and data extracts.

## Columns

1. Search key  
2. Name  
3. First name  
4. Last name  
5. Preferred name  
6. Status  
7. Email  
8. Phone  
9. Birthday  
10. Gender  
11. Living arrangement  
12. Funding body  
13. Funding body number  
14. Support commenced  
15. Support ceased  
16. Disability  
17. Risk alerts  
18. Sales representative  
19. Alert count  
20. Location count  

## Access

- Window: `reports`
- Report: `client-register`
- Parent module: `clients`

## Code

- Catalog: `web/src/lib/reports/catalog.ts`
- Runner: `web/src/lib/reports/runners/client-register.ts`
