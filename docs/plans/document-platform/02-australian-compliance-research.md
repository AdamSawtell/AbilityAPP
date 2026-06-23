# 02 — Australian compliance research

**Purpose:** Inform template required fields, labels, and validation rules.  
**Disclaimer:** This is product research, not legal advice. Seeded templates must be reviewed by the organisation’s legal and finance advisers before production use.

Sources consulted: [ATO — How to invoice](https://business.gov.au/finance/payments-and-invoicing/how-to-invoice), NDIS provider invoicing guidance (plan managers / NDIA operational bulletins), Fair Work Ombudsman materials, SCHADS Award summaries, NDIS Code of Conduct and provider practice standards.

---

## Cross-cutting rules (all outbound documents)

| Rule | Requirement |
|------|-------------|
| Date format | Australian convention **DD/MM/YYYY** on customer-facing documents |
| Currency | **AUD**; two decimal places for money |
| Business identity | Trading name + **ABN** on invoices and formal letters |
| NDIS provider | Registration number where claiming NDIS-funded supports |
| Privacy | Avoid unnecessary participant/clinical detail; align with Privacy Act 1988 and NDIS Practice Standards (confidentiality) |
| Record keeping | Generated PDFs retained per org retention policy (tax: generally 5 years; employment: 7 years for pay records) |
| Accessibility | Prefer readable fonts (11pt+ body), sufficient contrast; PDF/A optional for long-term archive (Stage 4+) |

---

## Document class: Tax invoice (NDIS participant / plan-managed)

### Regulatory basis

- **ATO:** Tax invoice requirements when GST registered ([business.gov.au](https://business.gov.au/finance/payments-and-invoicing/how-to-invoice))
- **NDIS:** Plan managers and NDIA reject incomplete invoices — support item codes, service dates, participant identifiers

### Title rules

| GST status | Document title |
|------------|----------------|
| GST registered, taxable supply | **Tax Invoice** |
| GST-free (most core NDIS supports) | **Invoice** (not “Tax Invoice”) |
| Not registered for GST | **Invoice** + statement “Not registered for GST” or “No GST” |

Most disability support services are **GST-free**; template must still show ABN and GST line ($0.00 or “GST-free under NDIS pricing arrangements”).

### Mandatory fields (template validation)

**Provider (header — org brand kit):**

- Business / trading name (as registered)
- ABN (11 digits)
- Business address
- Phone and email
- Bank details: BSB, account number, account name (required for plan manager payment)
- Remittance advice email (recommended)

**Participant / bill-to:**

- Participant **full legal name**
- **NDIS number** (9 digits)
- Address when required (e.g. SDA-related supports)
- Invoice addressed to correct party (participant, nominee, guardian — per service agreement)

**Invoice metadata:**

- Unique **invoice number** (never reused per participant)
- **Invoice date** (date of issue)
- **Date(s) of service** — prefer **individual dates per line**, not bulk date ranges (plan manager rejection reason)

**Line items (each row):**

- NDIS **support item number** (current Support Catalogue)
- Description of support
- **Claim type** where not face-to-face (travel, non-face-to-face, cancellation, report writing, etc.)
- Quantity (hours/units/items)
- Unit rate (must not exceed NDIS price limit for registered arrangements)
- Line total

**Totals:**

- Subtotal, GST amount (even if $0.00), **total payable**
- One participant per invoice (multiple support lines allowed)

### Common rejection reasons (build into validation hints)

- Missing support item code
- Date range instead of service dates
- Wrong participant name vs plan
- Rate above price limit
- Missing ABN or bank details
- GST shown incorrectly on GST-free supports

### AbilityVua mapping

Merge from: `invoice`, `invoice_line`, `client`, `organization`, product/NDIS code on lines.

Existing reference: `web/src/lib/invoice-print.ts` — migrate field list to template schema.

---

## Document class: Service agreement (NDIS)

### Regulatory / practice basis

- NDIS **Terms of Business** for providers and participant service agreements
- **PAPL** (Provider Assessment and Performance Literature) alignment for registered providers
- Consent and privacy schedules
- Schedule of supports linked to plan/budget

### Typical structure (template pack)

1. Cover / title page
2. Parties (provider legal entity + participant and/or nominee)
3. Definitions
4. Services and schedule of supports (line table from agreement)
5. Fees, billing, and cancellation
6. Rights and responsibilities
7. Privacy, consent, information sharing
8. Incidents, complaints, and feedback
9. Term, variation, termination
10. Signatures (integrate with existing e-sign panel)

### Mandatory merge fields

- Provider legal name, ABN, NDIS registration
- Participant name, NDIS number, date of birth (if org policy)
- Nominee/guardian details when applicable
- Agreement number, start/finish dates
- Schedule lines: support category, item descriptor, quantity, rate, frequency
- Emergency contacts (optional schedule)

### Compliance notes

- **Legal review mandatory** — seed “scaffold” clauses only
- Version agreements when NDIS pricing or terms change (template versioning)
- Store signed PDF in document registry linked to `service_agreement` record

---

## Document class: Service agreement variation

Shorter document referencing original agreement number, describing changes (schedule lines, dates, fees), and re-sign block. Same header/footer as agreement pack.

---

## Document class: Employee employment contract (SCHADS)

### Regulatory basis

- **Fair Work Act 2009** — National Employment Standards
- **SCHADS Award** — classifications, penalties, allowances, shift rules
- **NDIS Code of Conduct** for disability support workers
- Fair Work Information Statement must be provided to employees

### Employment types (separate templates)

| Template | When |
|----------|------|
| Casual employment agreement | Most frontline support workers |
| Permanent part-time | Supervisors, coordinators |
| Permanent full-time | Corporate roles (may fall outside SCHADS — separate template) |

### Typical sections (commercial templates in market)

- Offer and position title
- SCHADS classification level and stream
- Duties and location of work
- Hours / casual loading / penalty rates reference to Award
- Leave (N/A or limited for casual)
- Probation
- NDIS Code of Conduct, confidentiality, WHS
- Vehicle use and reimbursement (if applicable)
- Client visit record-keeping obligations
- Secondary employment / conflict of interest
- Non-solicitation (jurisdiction-sensitive — legal review)
- Termination and notice
- Dispute resolution
- Attachment: Fair Work Information Statement (link or embedded PDF)

### Mandatory merge fields

- Employer legal name, ABN, address
- Employee name, address, commencement date
- Classification level, pay point (reference only — payroll system interprets SCHADS)
- Position title, reports-to
- Contract version date

### Compliance notes

- AbilityVua **does not** calculate SCHADS pay — contract references Award + Fair Work, consistent with architecture decision in scope
- Generated contract PDF stored in registry **and** `employee_document` line reference
- **7-year** retention for employment records

---

## Document class: HR letters

Lower risk but standardised:

| Letter | Key fields |
|--------|------------|
| Offer of employment | Role, start date, conditions summary |
| Probation outcome | Dates, outcome |
| Credential expiry reminder | Credential type, expiry (merge from employee) |

---

## Document class: Participant statements

Periodic statement of supports delivered (non-tax): participant, period, summary of services — useful for transparency and audit. Not a tax invoice.

---

## Document class: Claim / remittance batch summary

Internal or plan-manager-facing summary of batch claim submission — links to PRODA/gateway batch id when Chunk 7 ships. Org header; table of claims and totals.

---

## Document class: Incident / compliance letters

Template for participant/family notification (non-clinical wording), regulator correspondence scaffolds — **high legal sensitivity**; optional in pack v1.2.

---

## Document class: Enquiry acknowledgement

Short letter/email body: enquiry received, reference number, next steps, privacy notice — supports Chunk 0.

---

## Validation matrix (for engine)

| Document class | Hard fail if missing | Warn if missing |
|----------------|---------------------|-----------------|
| `tax-invoice-ndis` | ABN, invoice no, participant name, NDIS no, line codes, service dates, totals | Bank details, remittance email |
| `service-agreement` | Parties, agreement no, schedule ≥1 line | Nominee block when client has guardian |
| `hr-contract-casual` | Employer, employee, role, commencement, classification ref | FWIS attachment link |
| `participant-statement` | Participant, period, lines | — |

---

## GST decision helper (org setting)

Organisation profile flag:

- `gstRegistered`: boolean
- `defaultGstTreatment`: gst-free | taxable (per line override on invoice)

Template chooses title and GST block from org setting + line data.

---

## References for implementers

| Topic | URL |
|-------|-----|
| ATO invoicing | https://business.gov.au/finance/payments-and-invoicing/how-to-invoice |
| Fair Work pay guides | https://www.fairwork.gov.au |
| NDIS Support Catalogue | https://www.ndis.gov.au (annual July update) |
| NDIS Code of Conduct | https://www.ndiscommission.gov.au |
