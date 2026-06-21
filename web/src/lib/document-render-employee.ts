import type { EmployeeRecord } from "@/lib/employee";
import { escapeDocumentHtml, wrapDocumentHtml } from "@/lib/document-brand";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import { organizationDisplayName, type OrganizationRecord } from "@/lib/organization";

export type EmployeeDocumentContext = {
  employee: EmployeeRecord;
  managerName: string;
  organization: OrganizationRecord;
};

function formatPrintDate(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function employeeDisplayName(employee: EmployeeRecord): string {
  return [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim() || employee.name?.trim() || employee.searchKey;
}

function partiesBlock(ctx: EmployeeDocumentContext): string {
  const { employee, organization } = ctx;
  const employer = organizationDisplayName(organization);
  const worker = employeeDisplayName(employee);

  return `<div class="parties-grid">
    <div class="panel">
      <h3>Employer</h3>
      <p class="party-name">${escapeDocumentHtml(employer)}</p>
      ${organization.abn?.trim() ? `<p>ABN ${escapeDocumentHtml(organization.abn.trim())}</p>` : ""}
    </div>
    <div class="panel">
      <h3>Employee</h3>
      <p class="party-name">${escapeDocumentHtml(worker)}</p>
      <p>${escapeDocumentHtml(employee.searchKey)}</p>
      ${employee.email?.trim() ? `<p>${escapeDocumentHtml(employee.email.trim())}</p>` : ""}
    </div>
  </div>`;
}

function richTextBlocks(template: DocumentTemplateRecord): string {
  return template.blocks
    .filter((block) => block.blockType === "rich-text" && block.contentHtml.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(
      (block) =>
        `<section class="rich-text"><h3>${escapeDocumentHtml(block.label || "Terms")}</h3>${block.contentHtml}</section>`
    )
    .join("");
}

function signatureBlock(): string {
  return `<section class="signatures">
    <h3>Signatures</h3>
    <div class="sig-grid">
      <div class="sig-box">
        <p class="sig-label">Employee</p>
        <div class="sig-line"></div>
        <p class="sig-name">—</p>
        <p class="sig-meta">Date —</p>
      </div>
      <div class="sig-box">
        <p class="sig-label">Employer authorised signatory</p>
        <div class="sig-line"></div>
        <p class="sig-name">—</p>
        <p class="sig-meta">Date —</p>
      </div>
    </div>
  </section>`;
}

function employeeBodyStyles(): string {
  return `
  .scaffold-notice {
    margin-bottom: 20px;
    padding: 12px 14px;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    background: #fffbeb;
    color: #92400e;
    font-size: 11px;
  }
  .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .panel { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; }
  .panel h3 { margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
  .party-name { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 6px !important; }
  .panel p { margin: 0 0 4px; }
  .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin-bottom: 20px; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
  .meta-grid p { margin: 0; }
  .label { color: #64748b; }
  .rich-text { margin-bottom: 20px; }
  .rich-text h3 { margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #111827; }
  .rich-text p { margin: 0 0 8px; color: #334155; }
  .signatures h3 { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #111827; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .sig-box { min-height: 120px; }
  .sig-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px !important; }
  .sig-line { border-bottom: 1px solid #94a3b8; height: 64px; margin-bottom: 8px; }
  .sig-name { font-weight: 600; margin-bottom: 4px !important; }
  .sig-meta { font-size: 11px; color: #64748b; }
  .doc-meta .doc-no { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
`;
}

export function buildEmployeeDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: EmployeeDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { employee, managerName, organization } = ctx;
  const titleBlock = template.titleText?.trim() || "Employment Agreement";
  const titleUpper = titleBlock.toUpperCase();

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml(titleUpper)}</h2>
    <p class="doc-no">${escapeDocumentHtml(employee.searchKey)}</p>
    <p><span class="label">Employee no.</span> ${escapeDocumentHtml(employee.employeeNumber || "—")}</p>
  </div>`;

  const bodyHtml = `<style>${employeeBodyStyles()}</style>
  <div class="scaffold-notice">
    Template scaffold — customise employment terms in System → Document templates before relying on this document for compliance.
  </div>
  ${partiesBlock(ctx)}
  <div class="meta-grid">
    <p><span class="label">Job title</span> ${escapeDocumentHtml(employee.jobTitle || "—")}</p>
    <p><span class="label">Employment type</span> ${escapeDocumentHtml(employee.employmentType || "—")}</p>
    <p><span class="label">Commencement date</span> ${escapeDocumentHtml(formatPrintDate(employee.startDate))}</p>
    <p><span class="label">Department</span> ${escapeDocumentHtml(employee.department || "—")}</p>
    <p><span class="label">Reports to</span> ${escapeDocumentHtml(managerName || "—")}</p>
    <p><span class="label">Standard hours / week</span> ${escapeDocumentHtml(employee.standardHoursPerWeek || "—")}</p>
  </div>
  ${richTextBlocks(template)}
  ${signatureBlock()}`;

  return wrapDocumentHtml({
    title: `${employee.searchKey} — ${titleBlock}`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}
