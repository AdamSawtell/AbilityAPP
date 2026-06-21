# Scope documents

## Master reference

**Title:** AbilityAPP — Complete Operational Workflow & Requirements Scope  
**Date:** 19 June 2026  
**Author:** Riley, Head of Research  

**Original file (user machine):**  
`AbilityAPP _ Complete Operational Workflow _ Requirements Scope.docx`

Keep the `.docx` as the legal/product authority. This repo holds structured extracts and the [implementation roadmap](../SCOPE-ROADMAP.md).

## Repository copies

| File | Purpose |
|------|---------|
| [../SCOPE-ROADMAP.md](../SCOPE-ROADMAP.md) | Phased backlog, status, next work packages |
| [../plans/document-platform/README.md](../plans/document-platform/README.md) | Document/form creator — approach, compliance, core pack, stages (draft for review) |
| [_extract.txt](./_extract.txt) | Plain-text extract for search (encoding may be imperfect) |

To refresh the extract from the docx (Windows, with Word installed):

```powershell
$doc = "C:\Users\AdamSawtell\Downloads\AbilityAPP _ Complete Operational Workflow _ Requirements Scope.docx"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$d = $word.Documents.Open($doc)
$d.Content.Text | Set-Content "docs\scope\_extract.txt" -Encoding UTF8
$d.Close(); $word.Quit()
```

## End-to-end flow (from scope)

```
Enquiry → Client → Service Agreement → Service Booking → Service Planning
    → Master Roster → Current Roster → Service Complete → Timesheet
    → Billing & Claiming → Employee Payment (payroll integration) → Reconciliation
```

## Prioritised chunks (summary)

| Chunk | Name |
|-------|------|
| 0 | Enquiry & CRM + client portal |
| 1 | Client & plan management |
| 2 | Service agreements (e-sign, PAPL) |
| 3 | Service bookings (NDIS compliance) |
| 4 | Rostering (master + current + mobile) |
| 5 | Service planning & utilisation |
| 6 | Timesheets, HR compliance, payroll export |
| 7 | Billing & claiming |
| 8 | Reconciliation & reporting |

Full detail: scope doc Sections STAGE 0–11 and "Prioritised Development Chunks".

## Architecture decisions (do not reverse without approval)

1. **No SCHADS payroll engine in AbilityAPP** — export verified timesheets; Keypay / EH / Xero interprets award.
2. **SCHADS-aware cost prediction only** — for quoting, planning, roster cost views.
3. **NDIS claims via PRODA or approved gateway** — not direct until Digital Partnership approved.
4. **Worker screening** — manual verification + expiry tracking (no public NDIS API).

## Related workspace research

- NDIS Incident Management — Requirements Scope (prior research)
- NDIS Service Agreements & Bookings — Requirements Scope (PART A referenced in master doc)
- Top 5 NDIS Software Providers — Feature Lists

When those PDFs/documents are added to this folder, link them here.
