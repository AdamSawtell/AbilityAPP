# 03 — Core template pack (v1)

Seeded templates for first release. Each ships **inactive** or marked **scaffold — legal review required** until the organisation publishes.

Naming convention: `dt-{class}-{variant}` (document template).

---

## Pack overview

| ID | Name | Document class | Primary process | Batch? |
|----|------|----------------|-----------------|--------|
| `dtax-invoice-ndis-v1` | NDIS participant invoice | `tax-invoice-ndis` | `print-invoice` | Yes |
| `dtax-invoice-ndis-gst-v1` | NDIS tax invoice (GST) | `tax-invoice-ndis-gst` | `print-invoice` | Yes |
| `dagreement-ndis-v1` | NDIS service agreement | `service-agreement` | `print-service-agreement` | No |
| `dagreement-variation-v1` | Agreement variation | `service-agreement-variation` | `print-agreement-variation` | No |
| `dhr-contract-casual-v1` | Casual employment agreement (SCHADS) | `hr-contract-casual` | `print-employee-contract` | No |
| `dhr-contract-pt-v1` | Part-time employment agreement (SCHADS) | `hr-contract-pt` | `print-employee-contract` | No |
| `dhr-offer-v1` | Offer of employment | `hr-letter-offer` | `print-employee-letter` | No |
| `dparticipant-statement-v1` | Participant service statement | `participant-statement` | `print-participant-statement` | Yes |
| `denquiry-ack-v1` | Enquiry acknowledgement | `enquiry-letter` | `print-enquiry-acknowledgement` | No |
| `dremittance-cover-v1` | Invoice remittance advice cover | `remittance-cover` | `print-invoice` | Yes |

**Phase 1.5 (after invoice/agreement):** claim batch summary, board report migration, incident notification scaffold.

---

## Standard layout (all templates)

Every template includes these blocks in order:

```
┌─────────────────────────────────────────┐
│  ORG HEADER (locked)                    │
│  Logo · Trading name · ABN · NDIS reg   │
│  Address · phone · email                │
├─────────────────────────────────────────┤
│  DOCUMENT TITLE (editable per template) │
├─────────────────────────────────────────┤
│  BODY BLOCKS (template-specific)        │
│  …                                      │
├─────────────────────────────────────────┤
│  ORG FOOTER (locked)                    │
│  Payment terms · GST notice · complaints│
│  Page {{page}} of {{pages}}             │
└─────────────────────────────────────────┘
```

Footer default text (org-overridable):

> {{org.tradingName}} · ABN {{org.abn}} · {{org.phone}} · {{org.email}}  
> Privacy: We handle personal information in accordance with the Privacy Act 1988 and NDIS Practice Standards.

---

## Template detail: `dtax-invoice-ndis-v1`

**Replaces:** hard-coded `buildInvoicePrintHtml` (after migration).

### Blocks

| Order | Block | Content |
|-------|-------|---------|
| 1 | `org-header` | Standard |
| 2 | `title` | `Invoice` or `Tax Invoice` from org GST setting |
| 3 | `parties` | Bill-to: `{{invoice.invoiceTo}}`, participant NDIS no, address |
| 4 | `metadata` | Invoice no `{{invoice.documentNo}}`, date `{{invoice.invoiceDate}}`, due date |
| 5 | `line-table` | Columns: service date, description, NDIS code, claim type, qty, rate, amount |
| 6 | `totals` | Subtotal, GST, total, “GST-free under NDIS arrangements” when applicable |
| 7 | `payment` | Bank BSB, account, account name, remittance email |
| 8 | `notes` | `{{invoice.notes}}` |
| 9 | `org-footer` | Standard |

### Required merge fields

`invoice.*`, `client.name`, `client.ndisNumber`, `invoice_line.*`, `org.abn`, `org.bankBsb`, `org.bankAccount`, `org.bankAccountName`

### Batch behaviour

- **Batch print invoices:** one PDF per invoice; ZIP download; registry entries share `batch_id`
- Filter: finalised invoices only (not draft)
- Progress UI: “Generating 12 of 48…”

---

## Template detail: `dagreement-ndis-v1`

### Blocks

| Order | Block | Notes |
|-------|-------|-------|
| 1 | `org-header` | Standard |
| 2 | `title` | Service Agreement |
| 3 | `parties` | Provider + participant (+ nominee if present) |
| 4 | `metadata` | Agreement no, dates, plan reference |
| 5 | `rich-text` | Terms scaffold (seed — legal review) |
| 6 | `line-table` | Schedule of supports from agreement lines |
| 7 | `rich-text` | Privacy & consent scaffold |
| 8 | `signature` | Participant + provider signatories; e-sign image merge |
| 9 | `org-footer` | Standard |

Integrates with existing `service-agreement-esign.ts` signature capture.

---

## Template detail: `dhr-contract-casual-v1`

### Blocks

| Order | Block | Notes |
|-------|-------|-------|
| 1 | `org-header` | Standard |
| 2 | `title` | Casual Employment Agreement |
| 3 | `parties` | Employer + employee |
| 4 | `metadata` | Commencement date, classification reference |
| 5–12 | `rich-text` | SCHADS-aware clause scaffolds (seed) |
| 13 | `signature` | Employee + employer authorised signatory |
| 14 | `org-footer` | Standard |

On generate: create registry PDF + optional `employee_document` line with `documentType: Employment contract`.

---

## Merge field registry (shared)

Extend per entity — register in `web/src/lib/document-merge-fields.ts` (proposed).

### Organisation (`org.*`)

`tradingName`, `legalName`, `abn`, `ndisRegistrationNumber`, `address`, `phone`, `email`, `website`, `bankBsb`, `bankAccount`, `bankAccountName`, `remittanceEmail`, `footerText`

### Invoice (`invoice.*`)

`documentNo`, `invoiceDate`, `dueDate`, `invoiceTo`, `invoiceToEmail`, `periodStart`, `periodEnd`, `subtotal`, `gstAmount`, `total`, `notes`, `gstLabel`

### Invoice line (`invoice_line.*`)

`serviceDate`, `description`, `ndisCode`, `claimType`, `quantity`, `unitRate`, `lineTotal`

### Client (`client.*`)

`name`, `searchKey`, `ndisNumber`, `billingAddress`, `nomineeName`

### Service agreement (`agreement.*`)

`documentNo`, `name`, `startDate`, `finishDate`, `status`, `participantName`

### Employee (`employee.*`)

`name`, `searchKey`, `jobTitle`, `classification`, `commencementDate`, `reportsToName`, `address`

---

## Process bindings (default seed)

| process_id | entity_type | default_template_id |
|------------|-------------|---------------------|
| `print-invoice` | invoice | `dtax-invoice-ndis-v1` |
| `batch-print-invoices` | invoice | `dtax-invoice-ndis-v1` |
| `print-service-agreement` | service-agreement | `dagreement-ndis-v1` |
| `print-agreement-variation` | service-agreement | `dagreement-variation-v1` |
| `print-employee-contract` | employee | `dhr-contract-casual-v1` |
| `print-employee-letter` | employee | `dhr-offer-v1` |
| `print-enquiry-acknowledgement` | enquiry | `denquiry-ack-v1` |

New processes registered in `catalog.ts` with `parentWindowKey` pointing to parent module.

---

## Modern design standards (visual)

- **Typography:** System UI stack or Inter; 11pt body, 14–18pt headings
- **Colour:** Org primary accent for headings only; body black/dark grey on white (print-safe)
- **Tables:** Zebra optional; clear column headers; right-align money
- **Whitespace:** A4 margins 20mm; avoid edge-to-edge on home-printed invoices
- **Logo:** Max height 48px in header; SVG or PNG with transparent background
- **Accessibility:** Minimum 4.5:1 contrast for body text

Preview uses same CSS as PDF render for WYSIWYG fidelity.

---

## Template lifecycle

| Status | Meaning |
|--------|---------|
| Draft | Editable; not selectable in production binding |
| Published | Active; can be bound to processes |
| Archived | Superseded; existing generated docs retain reference |
| Scaffold | Seeded; requires org legal sign-off before Publish |

Version increment on Publish; generated documents store `template_version`.
