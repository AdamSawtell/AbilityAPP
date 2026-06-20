"use client";

import { useState } from "react";
import { SignatureCapturePad } from "@/components/signature-capture-pad";
import {
  AGREEMENT_SIGNER_ROLES,
  applyAgreementSignature,
  hasAgreementSignature,
  type AgreementSignerRole,
} from "@/lib/service-agreement-esign";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function ServiceAgreementEsignPanel({
  record,
  readOnly,
  onApply,
}: {
  record: ServiceAgreementRecord;
  readOnly?: boolean;
  onApply: (next: ServiceAgreementRecord) => void;
}) {
  const [signerName, setSignerName] = useState(record.signerName || "");
  const [signerRole, setSignerRole] = useState<AgreementSignerRole>(
    (AGREEMENT_SIGNER_ROLES.includes(record.signerRole as AgreementSignerRole)
      ? record.signerRole
      : "Participant") as AgreementSignerRole
  );
  const [signatureImage, setSignatureImage] = useState("");
  const [error, setError] = useState("");

  const captured = hasAgreementSignature(record);

  function captureToDraft() {
    setError("");
    if (!signerName.trim()) {
      setError("Enter the signer's printed name.");
      return;
    }
    if (!signatureImage.trim()) {
      setError("Draw a signature before applying.");
      return;
    }
    onApply(
      applyAgreementSignature(record, {
        signerName,
        signerRole,
        signatureImage,
      })
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Participant e-sign</h3>
          <p className="mt-1 text-sm text-slate-600">
            Capture an in-app signature when the participant or nominee agrees to the schedule of supports. Applying
            sets the signed date and moves Draft or Sent agreements to Signed.
          </p>
        </div>
        {captured ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
            Signature on file
          </span>
        ) : null}
      </div>

      {captured ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Signer</p>
            <p className="mt-1 text-sm text-slate-900">
              {record.signerName} · {record.signerRole || "Participant"}
            </p>
            {record.signatureCapturedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                Captured {new Date(record.signatureCapturedAt).toLocaleString("en-AU")}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={record.signatureImage} alt="Captured signature" className="max-h-28 w-full object-contain" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Printed name</span>
              <input
                className={inputClass}
                value={signerName}
                disabled={readOnly}
                onChange={(e) => setSignerName(e.target.value)}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Signer role</span>
              <select
                className={inputClass}
                value={signerRole}
                disabled={readOnly}
                onChange={(e) => setSignerRole(e.target.value as AgreementSignerRole)}
              >
                {AGREEMENT_SIGNER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <SignatureCapturePad disabled={readOnly} onChange={setSignatureImage} />
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            type="button"
            disabled={readOnly}
            onClick={captureToDraft}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply signature to agreement
          </button>
        </div>
      )}
    </div>
  );
}
