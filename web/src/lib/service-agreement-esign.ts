import { localDateIso } from "@/lib/booking-cancellation";
import { applyLifecycleStatusChange } from "@/lib/service-agreement-lifecycle";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";

export const AGREEMENT_SIGNER_ROLES = [
  "Participant",
  "Guardian",
  "Nominee",
  "Provider representative",
] as const;

export type AgreementSignerRole = (typeof AGREEMENT_SIGNER_ROLES)[number];

export type AgreementEsignInput = {
  signerName: string;
  signerRole: AgreementSignerRole;
  signatureImage: string;
  capturedAt?: string;
};

export function hasAgreementSignature(record: ServiceAgreementRecord): boolean {
  return Boolean(record.signatureImage?.trim());
}

export function applyAgreementSignature(
  record: ServiceAgreementRecord,
  input: AgreementEsignInput
): ServiceAgreementRecord {
  const capturedAt = input.capturedAt?.trim() || new Date().toISOString();
  const today = localDateIso();
  let next: ServiceAgreementRecord = {
    ...record,
    signerName: input.signerName.trim(),
    signerRole: input.signerRole,
    signatureImage: input.signatureImage.trim(),
    signatureCapturedAt: capturedAt,
    signedAt: record.signedAt?.trim() || today,
  };

  if (!next.sentAt?.trim() && (next.status === "Draft" || next.status === "Sent")) {
    next = applyLifecycleStatusChange(next, "Sent");
  }
  if (next.status === "Draft" || next.status === "Sent") {
    next = applyLifecycleStatusChange(next, "Signed");
  }

  return next;
}

export function clearAgreementSignature(record: ServiceAgreementRecord): ServiceAgreementRecord {
  return {
    ...record,
    signerName: "",
    signerRole: "",
    signatureImage: "",
    signatureCapturedAt: "",
  };
}
