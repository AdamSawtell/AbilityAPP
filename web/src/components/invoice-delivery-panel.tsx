"use client";

import Link from "next/link";
import type { InvoiceDeliveryHandoff } from "@/lib/invoice-plan-manager-delivery";

export function InvoiceDeliveryPanel({
  handoff,
  registryDocumentNo,
  invoiceStatus,
}: {
  handoff: InvoiceDeliveryHandoff;
  registryDocumentNo?: string;
  invoiceStatus: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Plan manager delivery</h2>
      <p className="mt-1 text-sm text-slate-600">
        Issue invoice registers HTML in AbilityAPP. Save as PDF from print, then hand off to the plan manager using your
        organisation&apos;s secure channel — AbilityAPP does not send outbound email.
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Recipient</dt>
          <dd className="mt-0.5 text-slate-900">{handoff.recipientName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
          <dd className="mt-0.5 text-slate-900">{handoff.recipientEmail || "Not set — add on client Billing tab"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Delivery method</dt>
          <dd className="mt-0.5 text-slate-900">{handoff.deliveryMethod}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan manager</dt>
          <dd className="mt-0.5 text-slate-900">
            {handoff.planManagerPartnerId ? (
              <Link href={`/business-partners/${handoff.planManagerPartnerId}`} className="text-[#b51266] hover:underline">
                {handoff.planManagerName || handoff.planManagerPartnerId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        {handoff.instructions.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Save as PDF</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {handoff.printPdfSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {handoff.mailtoUrl && invoiceStatus === "Sent" ? (
          <a
            href={handoff.mailtoUrl}
            className="rounded-lg border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
          >
            Open email draft
          </a>
        ) : null}
        <Link
          href="/system/admin/document-registry"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          Document registry
        </Link>
      </div>

      {registryDocumentNo ? (
        <p className="mt-3 text-xs text-emerald-800">Registry reference: {registryDocumentNo}</p>
      ) : null}
    </section>
  );
}
