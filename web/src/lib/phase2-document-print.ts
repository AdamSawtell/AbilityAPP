import {
  DEFAULT_AUDIT_PACK_TEMPLATE_ID,
  DEFAULT_CLAIM_BATCH_TEMPLATE_ID,
  DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID,
  DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID,
  DEFAULT_SUPPORT_PLAN_TEMPLATE_ID,
  defaultAuditPackTemplate,
  defaultClaimBatchTemplate,
  defaultConsentScheduleTemplate,
  defaultIncidentNotificationTemplate,
  defaultSupportPlanTemplate,
  type DocumentTemplateRecord,
} from "@/lib/document-template";
import { openDocumentHtml, renderDocument } from "@/lib/document-render";
import type {
  AuditPackDocumentContext,
  ClaimBatchDocumentContext,
  ConsentScheduleDocumentContext,
  IncidentNotificationDocumentContext,
} from "@/lib/document-render-phase2";
import type { SupportPlanDocumentContext } from "@/lib/support-plan-print";

export type Phase2DocumentContext =
  | ClaimBatchDocumentContext
  | IncidentNotificationDocumentContext
  | AuditPackDocumentContext
  | ConsentScheduleDocumentContext
  | SupportPlanDocumentContext;

function resolvePhase2Class(ctx: Phase2DocumentContext): DocumentTemplateRecord["documentClass"] {
  if ("claim" in ctx) return "claim-batch-summary";
  if ("incident" in ctx) return "incident-notification-letter";
  if ("evaluation" in ctx) return "audit-pack-report";
  if ("plan" in ctx) return "support-plan";
  return "consent-schedule";
}

function defaultTemplateForClass(documentClass: DocumentTemplateRecord["documentClass"]): DocumentTemplateRecord {
  if (documentClass === "claim-batch-summary") return defaultClaimBatchTemplate();
  if (documentClass === "incident-notification-letter") return defaultIncidentNotificationTemplate();
  if (documentClass === "audit-pack-report") return defaultAuditPackTemplate();
  if (documentClass === "support-plan") return defaultSupportPlanTemplate();
  return defaultConsentScheduleTemplate();
}

export function exportPhase2DocumentHtml(
  ctx: Phase2DocumentContext,
  template?: DocumentTemplateRecord
): { html: string; templateId: string; documentClass: DocumentTemplateRecord["documentClass"] } | null {
  const resolved = template ?? defaultTemplateForClass(resolvePhase2Class(ctx));
  const result = renderDocument(resolved, ctx);
  if (result.blocked || !result.html) return null;
  return { html: result.html, templateId: resolved.id, documentClass: resolved.documentClass };
}

export function printPhase2Document(ctx: Phase2DocumentContext, template?: DocumentTemplateRecord): boolean {
  if (typeof window === "undefined") return false;
  try {
    const resolved = template ?? defaultTemplateForClass(resolvePhase2Class(ctx));
    const result = renderDocument(resolved, ctx, { autoPrint: true });
    if (result.blocked || !result.html) return false;
    return openDocumentHtml(result.html, { autoPrint: true });
  } catch {
    return false;
  }
}

export function defaultPhase2TemplateIds() {
  return {
    claimBatch: DEFAULT_CLAIM_BATCH_TEMPLATE_ID,
    incidentNotification: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID,
    auditPack: DEFAULT_AUDIT_PACK_TEMPLATE_ID,
    consentSchedule: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID,
    supportPlan: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID,
  };
}
