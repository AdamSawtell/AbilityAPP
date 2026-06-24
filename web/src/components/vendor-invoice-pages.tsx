"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatDisplayDate } from "@/lib/enquiry";
import { approveVendorInvoice, markVendorInvoicePaid } from "@/lib/vendor-invoice-workflow";
import { auditMetaFrom } from "@/lib/audit";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value || 0);
}

const statusTone: Record<string, string> = {
  Submitted: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
  Paid: "bg-sky-100 text-sky-900",
  Rejected: "bg-rose-100 text-rose-900",
};

function vendorLabel(vendors: { id: string; name: string; searchKey: string }[], id: string): string {
  const match = vendors.find((v) => v.id === id);
  return match ? `${match.searchKey} — ${match.name}` : id || "—";
}

export function VendorInvoiceListView() {
  const { vendorInvoices, businessPartners } = useData();

  const rows = useMemo(
    () => [...vendorInvoices].sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || "")),
    [vendorInvoices]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Agency vendor invoices submitted from the agency portal — approve for AP and mark paid when remitted.
      </p>
      {rows.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Invoice no.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/vendor-invoices/${row.id}`} className="font-medium text-[#b51266] hover:underline">
                      {row.documentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{vendorLabel(businessPartners, row.vendorBpId)}</td>
                  <td className="px-4 py-3">{row.invoiceNo}</td>
                  <td className="px-4 py-3">{formatDisplayDate(row.invoiceDate)}</td>
                  <td className="px-4 py-3">{formatMoney(row.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[row.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">No vendor invoices yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Vendors submit from the{" "}
            <Link href="/agency-portal/login" className="text-[#b51266] hover:underline">
              agency portal
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export function VendorInvoiceDetailView({ id }: { id: string }) {
  const {
    vendorInvoices,
    agencyTimesheets,
    agencyShiftRequests,
    businessPartners,
    upsertVendorInvoice,
    upsertAgencyShiftRequest,
  } = useData();
  const { session, canProcess } = useAuth();

  const invoice = vendorInvoices.find((v) => v.id === id);
  const timesheet = agencyTimesheets.find((t) => t.id === invoice?.agencyTimesheetId);
  const vendor = businessPartners.find((p) => p.id === invoice?.vendorBpId);
  const actor = session?.displayName || "SuperUser";
  const canApprove = canProcess("approve-vendor-invoice");
  const canPay = canProcess("mark-vendor-invoice-paid");

  if (!invoice) {
    return (
      <AppShell title="Vendor invoice" audit={{ moduleLabel: "Vendor invoices" }}>
        <p className="text-sm text-slate-600">Vendor invoice not found.</p>
      </AppShell>
    );
  }

  const record = invoice;

  async function openInvoiceDocument() {
    try {
      const res = await fetch(`/api/vendor-invoices/${record.id}/document`, { credentials: "include" });
      const data = (await res.json()) as { signedUrl?: string; error?: string };
      if (!res.ok || !data.signedUrl) return;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      // silent — document may be missing on legacy rows
    }
  }

  function handleApprove() {
    if (!timesheet) return;
    const result = approveVendorInvoice({
      invoice: record,
      timesheet,
      agencyShiftRequests,
      actor,
    });
    upsertVendorInvoice(result.invoice);
    for (const request of result.agencyShiftRequests) {
      if (request.vendorInvoiceRef === result.invoice.documentNo) {
        upsertAgencyShiftRequest(request);
      }
    }
  }

  function handlePaid() {
    const result = markVendorInvoicePaid({ invoice: record, agencyShiftRequests, actor });
    upsertVendorInvoice(result.invoice);
    for (const request of result.agencyShiftRequests) {
      if (request.vendorInvoiceRef === result.invoice.documentNo) {
        upsertAgencyShiftRequest(request);
      }
    }
  }

  return (
    <AppShell
      title={record.documentNo}
      subtitle="Agency vendor invoice"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Vendor invoices", href: "/vendor-invoices" },
        { label: record.documentNo },
      ]}
      audit={{ entityType: "vendor-invoice", entityId: record.id, meta: auditMetaFrom(record) }}
    >
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{vendor?.name ?? invoice.vendorBpId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor invoice no.</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{invoice.invoiceNo}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice date</p>
          <p className="mt-1 text-sm text-slate-900">{formatDisplayDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{formatMoney(invoice.amount)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-1 text-sm text-slate-900">{invoice.status}</p>
        </div>
        {timesheet ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agency timesheet</p>
            <p className="mt-1 text-sm">
              <Link href={`/agency-timesheets/${timesheet.id}`} className="text-[#b51266] hover:underline">
                {timesheet.documentNo}
              </Link>
            </p>
          </div>
        ) : null}
        {invoice.documentStoragePath?.trim() ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice document</p>
            <p className="mt-1 text-sm">
              <button
                type="button"
                onClick={openInvoiceDocument}
                className="font-medium text-[#b51266] hover:underline"
              >
                {invoice.documentFileName || "View invoice document"}
              </button>
            </p>
          </div>
        ) : null}
      </div>

      {invoice.notes ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{invoice.notes}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canApprove && invoice.status === "Submitted" ? (
          <button
            type="button"
            onClick={handleApprove}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Approve invoice
          </button>
        ) : null}
        {canPay && invoice.status === "Approved" ? (
          <button
            type="button"
            onClick={handlePaid}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Mark paid
          </button>
        ) : null}
      </div>
    </AppShell>
  );
}
