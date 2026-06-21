# 04 — Implementation stages

Phased delivery to limit risk. Each stage ends with verification per [BUILD-EXPECTATIONS.md](../../BUILD-EXPECTATIONS.md) and updates [BUILD-PROGRESS.md](../../BUILD-PROGRESS.md).

**Estimated total:** 6 stages over ~8–12 agent slices (depends on PDF host decision).

---

## Stage 0 — Foundation (schema + brand kit)

**Goal:** Data model, org brand extensions, merge field registry, no user-facing editor yet.

### Deliverables

| Item | Detail |
|------|--------|
| Migration | `app_document_template`, `_block`, `_field`, `app_process_document_binding`, `app_generated_document` |
| Storage | Private bucket `org-documents`; optional `org-assets` for logo upload |
| Org profile | Bank/remittance fields, footer text, GST registered flag, logo upload |
| Lib | `document-template.ts`, `document-merge-fields.ts`, `document-render-html.ts` |
| Seed | One proof template `dtax-invoice-ndis-v1` blocks JSON (no UI editor) |
| Access | System windows: `admin-document-templates` (read), `admin-document-registry` (read) |

### Verification

- Org saves bank fields with audit trail
- Logo uploads to private bucket; signed URL renders in test HTML
- Migration applies to remote Supabase

### Dependencies

None — can start immediately.

---

## Stage 1 — Invoice template + process binding

**Goal:** Replace hard-coded invoice print with template engine; single print works.

### Deliverables

| Item | Detail |
|------|--------|
| Render | `renderDocument(processId, entityType, entityId, templateId?)` |
| Migrate | Port `invoice-print.ts` layout → `dtax-invoice-ndis-v1` seed blocks |
| UI | Invoice detail: Print dialog with template picker (default from binding) |
| Process | `print-invoice` in catalog; binding seed |
| Validation | Fail render with clear errors if mandatory invoice fields missing |
| Audit | Log render events; `persistRecordAudit` unchanged on invoice save |

### Verification

- Print invoice matches current output (field parity checklist)
- Template picker shows only published invoice-class templates
- NDIS mandatory field validation messages shown in UI when blocked

### Dependencies

Stage 0.

---

## Stage 2 — Template editor (System)

**Goal:** Authorised users edit templates without code deploy.

### Deliverables

| Item | Detail |
|------|--------|
| UI | `/system/admin/document-templates` — list, edit blocks, preview, publish |
| Editor | Block list reorder; rich-text for clause blocks; merge field picker |
| Preview | Sample record selector (reuse task-automation preview pattern) |
| Help | System guide + module setup checklist |
| Access | Write on `admin-document-templates` for system admin |

### Verification

- Edit title block → preview updates
- Publish creates version; draft not visible in app picker
- Audit footer on all SystemShell pages

### Dependencies

Stage 1 (render engine stable).

---

## Stage 3 — PDF export + document registry

**Goal:** Download PDF; store generated copy; private storage.

### Deliverables

| Item | Detail |
|------|--------|
| API | `POST /api/documents/render-pdf` — HTML → PDF bytes |
| Registry | Write `app_generated_document` + upload on each PDF generation |
| UI | “Download PDF” + “Save to registry” (default on) |
| Download | Signed URL with expiry |
| System UI | `/system/admin/document-registry` — search, filter by entity, re-download |

### PDF host decision (pick one before slice starts)

| Option | Notes |
|--------|-------|
| A. Supabase Edge + chromium | Keeps data in Supabase region |
| B. Amplify container + Playwright | Fits existing AWS deploy |
| C. Third-party API | Fastest; data processing agreement required |

### Verification

- PDF opens in Adobe Reader; ABN and totals readable
- Registry row links to source invoice; audit shows generator
- Non-authorised role cannot access signed URL

### Dependencies

Stage 1; PDF host provisioned.

---

## Stage 4 — Batch invoices + bindings admin

**Goal:** Month-end batch PDF generation; admin manages process → template map.

### Deliverables

| Item | Detail |
|------|--------|
| Process | `batch-print-invoices` on invoices list / financial close |
| Batch job | Server-side loop; progress; ZIP download |
| Registry | Shared `batch_id` on all rows |
| UI | `/system/admin/document-bindings` or tab on templates admin |
| UI | Invoice list multi-select → Batch print |

### Verification

- Batch of 10 test invoices → ZIP with 10 PDFs + 10 registry rows
- Binding change updates default template without code deploy

### Dependencies

Stage 3.

---

## Stage 5 — Service agreement pack

**Goal:** Printable agreement PDF; link to e-sign.

### Deliverables

| Item | Detail |
|------|--------|
| Templates | `dagreement-ndis-v1`, `dagreement-variation-v1` seeded scaffolds |
| Process | `print-service-agreement`, `print-agreement-variation` |
| UI | Service agreement detail print/preview |
| E-sign | Signed PDF stored in registry on completion |
| Chunk 2 | Aligns with service agreement lifecycle roadmap |

### Verification

- Schedule lines render from agreement line table
- Signature block shows captured e-sign image
- Legal disclaimer shown on scaffold templates

### Dependencies

Stage 2–3; service agreement record stable.

---

## Stage 6 — HR contract pack + employee delivery

**Goal:** Generate employment contracts; surface in My workplace.

### Deliverables

| Item | Detail |
|------|--------|
| Templates | Casual + part-time SCHADS scaffolds |
| Process | `print-employee-contract`, `print-employee-letter` |
| UI | Employee record → HR tab → Generate contract |
| Registry | PDF + `employee_document` line auto-created |
| My workplace | Contracts tab reads registry + uploaded docs |

### Verification

- Generated contract visible in My workplace after publish
- Employee document line persists after refresh
- 7-year retention tag on HR document class

### Dependencies

Stage 5 pattern proven; employee record complete.

---

## Stage 7 — Extended pack (optional)

| Item | Priority |
|------|----------|
| Enquiry acknowledgement | Chunk 0 |
| Participant statement batch | Client reporting |
| Remittance cover sheet | Chunk 7 billing |
| Board report template migration | Unify with document platform |
| Email send hook (`send-invoice`) | Integration slice |
| Custom template clone (duplicate + edit) | Operator self-service |

---

## Cross-cutting tasks (every stage)

- [ ] `AuditEntityType` for template + generated document
- [ ] `audit-diff.ts` field labels
- [ ] `catalog.ts` windows + processes
- [ ] `docs/processes/*.md` + `processes.json`
- [ ] Regenerate `seed-access.sql`
- [ ] Help articles + `page-guides.ts`
- [ ] `module-setup-guides.ts` checklist items

---

## Suggested first slice (after review approval)

**WP-D.0 — Stage 0 + Stage 1 combined minimal path:**

1. Schema + org bank fields + merge registry
2. Seed `dtax-invoice-ndis-v1`
3. Render engine + invoice print migration
4. `print-invoice` process + binding
5. Build + browser smoke on invoice print

This proves the architecture before investing in editor and PDF infra.

---

## Open questions for stakeholder review

| # | Question | Impact |
|---|----------|--------|
| 1 | PDF host: Edge vs Amplify vs vendor? | Stage 3 timeline |
| 2 | Batch: ZIP vs merged single PDF? | Batch job design |
| 3 | Legal: who signs off scaffold templates? | Go-live gate |
| 4 | Include GST invoice variant in v1 pack? | Second seed template |
| 5 | Email invoices in scope for 2026? | Stage 7 vs separate project |
| 6 | Migrate board reporting to same engine? | Stage 7 — reduces duplication |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Invoice print parity | 100% field coverage vs current `invoice-print.ts` |
| Template change without deploy | Publish new template version in System |
| Batch 50 invoices | < 2 minutes server time (PDF host dependent) |
| Registry retrieval | Authorised user re-downloads in ≤ 3 clicks |
| Compliance validation | Block render when NDIS mandatory fields missing |
