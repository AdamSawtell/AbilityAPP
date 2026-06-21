# Document & form platform — planning pack

**Status:** Draft for review  
**Author:** Product / engineering planning (June 2026)  
**Audience:** System operators, legal/compliance reviewers, build agents

## Why this pack exists

AbilityAPP already generates **HTML print views** for invoices and board reports, and stores **attachments** (incident evidence, credential files) in public Supabase buckets. It does **not** yet have:

- A reusable **document template** system
- **PDF export** suitable for email and archival
- **Process → template** assignment (e.g. which layout runs when a user prints an invoice)
- A **document registry** for generated files (batch invoices, signed agreements, HR letters)
- An **editor** for authorised users to maintain templates without code changes

This pack defines approach, Australian compliance requirements, a **core template pack**, and **implementation stages** before any large build starts.

## Documents in this pack

| # | File | Purpose |
|---|------|---------|
| 1 | [01-approach-and-architecture.md](./01-approach-and-architecture.md) | Platform shape, DMS decision, org brand kit, process binding, PDF strategy |
| 2 | [02-australian-compliance-research.md](./02-australian-compliance-research.md) | NDIS, ATO, Fair Work, SCHADS, privacy — per document type |
| 3 | [03-core-template-pack.md](./03-core-template-pack.md) | Seeded templates v1, merge fields, batch use cases |
| 4 | [04-implementation-stages.md](./04-implementation-stages.md) | Phased delivery, dependencies, System admin surfaces, verification |

## Executive recommendation (short)

| Question | Recommendation |
|----------|----------------|
| Build a document/form creator? | **Yes** — extend existing HTML print + board-report template patterns |
| Full enterprise DMS (SharePoint-class)? | **No for v1** — build a **Document Registry** (metadata + private storage + links to source records) |
| Separate bucket storage? | **Yes** — private `org-documents` bucket; templates in DB, generated PDFs in storage |
| Who manages it? | **System surface only** — templates, bindings, brand kit; app users consume via processes |
| PDF how? | **Stage 1:** print-quality HTML; **Stage 2:** server PDF API for batch/email/archive |
| Legal content in templates? | **Seed scaffolds only** — org must review with legal before production use |

## Relationship to roadmap

Cross-cuts multiple chunks:

| Chunk | Documents affected |
|-------|-------------------|
| 0 Enquiry | Web-to-lead acknowledgement, enquiry summary |
| 2 Service agreements | Agreement, schedule, variation, consent schedules |
| 6 Timesheets / HR | Employee contracts, letters, credential certificates |
| 7 Billing | Tax invoices, statements, remittance covers |
| 8 Reconciliation | Batch summaries, audit packs (extends board reporting) |

Add a **Chunk D (Document platform)** in [SCOPE-ROADMAP.md](../../SCOPE-ROADMAP.md) after review — see stage plan for slice order.

## Review checklist (for stakeholders)

Before Stage 1 build sign-off:

- [ ] Legal/compliance approves seeded clause scaffolds (not final legal text)
- [ ] Confirm bank/payment fields belong on org profile or separate “remittance” section
- [ ] Confirm PDF generation host (Amplify API + container vs Supabase Edge vs third-party)
- [ ] Confirm retention period for generated PDFs (align with System → Record retention)
- [ ] Confirm which processes get template pickers in v1 (invoice print minimum)
- [ ] Confirm batch invoice PDF = one PDF per invoice vs merged pack

## Existing code to extend (starting points)

| Pattern | Path |
|---------|------|
| Invoice HTML print | `web/src/lib/invoice-print.ts` |
| Board report print | `web/src/lib/board-report-print.ts` |
| DB-backed template + sections | `web/src/lib/board-report-template.ts`, `board_report_template` tables |
| Org branding fields | `web/src/lib/organization.ts` |
| Process catalog | `web/src/lib/access/catalog.ts` |
| File upload (public bucket) | `incident-evidence-upload.tsx`, `credential-evidence-upload.tsx` |
| Document viewer (URL iframe) | `web/src/components/my-workplace/document-viewer-modal.tsx` |
