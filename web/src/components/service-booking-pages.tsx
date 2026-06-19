"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { ClientRecordLink, ProductRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { auditMetaFrom } from "@/lib/audit";
import { useData } from "@/lib/data-store";
import {
  emptyBookingLine,
  formatServiceBookingDate,
  normalizeServiceBooking,
  serviceBookingDropdowns,
  serviceBookingTabs,
  sumLineAmounts,
  type ServiceBookingLine,
  type ServiceBookingRecord,
} from "@/lib/service-booking";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const lineConfig: GenericTableConfig<ServiceBookingLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "manualHold", label: "Manual hold", type: "checkbox" },
    { key: "readyToClaim", label: "Ready to claim", type: "checkbox" },
    { key: "orderedQuantity", label: "Ordered qty", type: "text", className: "w-20" },
    { key: "quantityInvoiced", label: "Qty invoiced", type: "text", className: "w-20" },
    { key: "datePromised", label: "Date promised", type: "date" },
    { key: "productId", label: "Product", type: "select", optionsKey: "productId" },
    { key: "claimType", label: "Claim type", type: "select", optionsKey: "claimType" },
    { key: "useTimeBasedQuantity", label: "Time based", type: "checkbox" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "uom", label: "UOM", type: "select", optionsKey: "uom" },
    { key: "price", label: "Price", type: "text", className: "w-24" },
    { key: "lineAmount", label: "Line amount", type: "text", className: "w-24" },
  ],
  emptyRow: (lineNo) => emptyBookingLine(lineNo),
  addLabel: "Add service booking line",
  emptyMessage: "No lines yet. Add products and service periods for this booking.",
};

const statusTone: Record<string, string> = {
  Drafted: "bg-slate-100 text-slate-700",
  "In progress": "bg-amber-100 text-amber-900",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
};

export function ServiceBookingListView() {
  const { serviceBookings, clients } = useData();
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    const sorted = [...serviceBookings].sort((a, b) => (b.datePromised || "").localeCompare(a.datePromised || ""));
    if (!statusFilter) return sorted;
    return sorted.filter((r) => r.documentStatus === statusFilter);
  }, [serviceBookings, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">
          Document status{" "}
          <select
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {serviceBookingDropdowns.documentStatus.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Link
          href="/service-bookings/new"
          className="ml-auto inline-flex rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          New service booking
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Document no.</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Business partner</th>
              <th className="px-4 py-3">Date promised</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Lines</th>
              <th className="px-4 py-3">Grand total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((booking) => {
              const client = clients.find((c) => c.id === booking.clientId);
              return (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/service-bookings/${booking.id}`} className="text-[#b51266] hover:underline">
                      {booking.documentNo}
                    </Link>
                    {booking.bookingGeneratorRef ? (
                      <p className="text-xs font-normal text-slate-500">{booking.bookingGeneratorRef}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{booking.description || "—"}</td>
                  <td className="px-4 py-3">
                    {client ? (
                      <ClientRecordLink
                        id={client.id}
                        searchKey={client.searchKey}
                        name={client.name}
                        className="text-slate-700 hover:underline"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{formatServiceBookingDate(booking.datePromised)}</td>
                  <td className="px-4 py-3">
                    {formatServiceBookingDate(booking.startDate)} – {formatServiceBookingDate(booking.endDate)}
                  </td>
                  <td className="px-4 py-3">{booking.lines.length}</td>
                  <td className="px-4 py-3">${booking.grandTotal}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[booking.documentStatus] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {booking.documentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No service bookings match this filter.</p>
        ) : null}
      </div>
    </div>
  );
}

export function ServiceBookingDetailView({ id }: { id: string }) {
  const { serviceBookings, clients, products, serviceAgreements, upsertServiceBooking } = useData();
  const stored = serviceBookings.find((r) => r.id === id);
  const [draft, setDraft] = useState<ServiceBookingRecord | null>(null);
  const [tab, setTab] = useState<(typeof serviceBookingTabs)[number]>("Overview");
  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);

  const client = record ? clients.find((c) => c.id === record.clientId) : null;
  const productLabels = Object.fromEntries(products.map((p) => [p.id, `${p.searchKey} — ${p.name}`]));
  const lineDropdowns = {
    productId: products.map((p) => p.id),
    claimType: serviceBookingDropdowns.claimType,
    uom: serviceBookingDropdowns.uom,
  };

  if (!record) {
    return (
      <AppShell title="Service booking not found" audit={{ moduleLabel: "Service bookings" }}>
        <Link href="/service-bookings" className="text-[#b51266] hover:underline">
          Back to service bookings
        </Link>
      </AppShell>
    );
  }

  function onChange<K extends keyof ServiceBookingRecord>(key: K, value: ServiceBookingRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    const next = { ...base, [key]: value, updatedBy: "SuperUser" };
    if (key === "lines") {
      const lines = value as ServiceBookingLine[];
      const grandTotal = sumLineAmounts(lines);
      next.totalLines = grandTotal;
      next.grandTotal = grandTotal;
    }
    setDraft(normalizeServiceBooking(next));
  }

  function save() {
    if (!draft) return;
    upsertServiceBooking(draft);
    setDraft(null);
  }

  return (
    <>
      <AppShell
        title={`Service booking ${record.documentNo}`}
        subtitle={`${record.description || "Service booking"} · ${record.documentStatus}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Service bookings", href: "/service-bookings" },
          { label: record.documentNo },
        ]}
        actions={
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">
              {record.lines.length} lines · ${record.grandTotal} AUD
            </span>
            {client ? (
              <Link
                href={`/clients/${client.id}`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                View client
              </Link>
            ) : null}
          </div>
        }
        audit={{
          entityType: "service-booking",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="mb-4 flex gap-1 border-b border-slate-200">
          {serviceBookingTabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t
                  ? "border-[#d4147a] text-[#b51266]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "Lines" ? "Service booking line" : t}
            </button>
          ))}
        </div>

        {tab === "Overview" ? (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Document no.</span>
                <input className={inputClass} value={record.documentNo} readOnly />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Organization</span>
                <input
                  className={inputClass}
                  value={record.organization}
                  onChange={(e) => onChange("organization", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Description</span>
                <input
                  className={inputClass}
                  value={record.description}
                  onChange={(e) => onChange("description", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Target document type</span>
                <select
                  className={inputClass}
                  value={record.targetDocumentType}
                  onChange={(e) => onChange("targetDocumentType", e.target.value)}
                >
                  {serviceBookingDropdowns.targetDocumentType.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={record.isTemplate}
                  onChange={(e) => onChange("isTemplate", e.target.checked)}
                />
                <span className="text-sm text-slate-700">Is template</span>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Ready to claim rule</span>
                <select
                  className={inputClass}
                  value={record.readyToClaimRule}
                  onChange={(e) => onChange("readyToClaimRule", e.target.value)}
                >
                  {serviceBookingDropdowns.readyToClaimRule.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={record.programOfSupports}
                  onChange={(e) => onChange("programOfSupports", e.target.checked)}
                />
                <span className="text-sm text-slate-700">Program of supports</span>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Date ordered</span>
                <input
                  className={inputClass}
                  type="date"
                  value={record.dateOrdered}
                  onChange={(e) => onChange("dateOrdered", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Date promised</span>
                <input
                  className={inputClass}
                  type="date"
                  value={record.datePromised}
                  onChange={(e) => onChange("datePromised", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Start date</span>
                <input
                  className={inputClass}
                  type="date"
                  value={record.startDate}
                  onChange={(e) => onChange("startDate", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">End date</span>
                <input
                  className={inputClass}
                  type="date"
                  value={record.endDate}
                  onChange={(e) => onChange("endDate", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Business partner</span>
                <select
                  className={inputClass}
                  value={record.clientId}
                  onChange={(e) => onChange("clientId", e.target.value)}
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.searchKey} — {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Invoice partner</span>
                <input
                  className={inputClass}
                  value={record.invoicePartner}
                  onChange={(e) => onChange("invoicePartner", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Service agreement</span>
                <select
                  className={inputClass}
                  value={record.serviceAgreementId}
                  onChange={(e) => onChange("serviceAgreementId", e.target.value)}
                >
                  <option value="">None</option>
                  {serviceAgreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.searchKey} — {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Booking generator</span>
                <input
                  className={inputClass}
                  value={record.bookingGeneratorRef}
                  onChange={(e) => onChange("bookingGeneratorRef", e.target.value)}
                  placeholder="e.g. BERN_SIL"
                />
              </label>
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Total lines</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">${record.totalLines}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Grand total</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">${record.grandTotal}</p>
              </div>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Document status</span>
                <select
                  className={inputClass}
                  value={record.documentStatus}
                  onChange={(e) => onChange("documentStatus", e.target.value)}
                >
                  {serviceBookingDropdowns.documentStatus.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-sm text-slate-600">
                {client ? (
                  <p>
                    Client:{" "}
                    <ClientRecordLink
                      id={client.id}
                      searchKey={client.searchKey}
                      name={client.name}
                      className="font-medium text-[#b51266] hover:underline"
                    />
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <LineItemTable
            config={lineConfig}
            rows={record.lines}
            onChange={(lines) => onChange("lines", lines)}
            dropdowns={lineDropdowns}
            optionLabels={productLabels}
          />
        )}
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={save} onDiscard={() => setDraft(null)} />
    </>
  );
}

export function ServiceBookingNewView() {
  const router = useRouter();
  const { clients, serviceAgreements, addServiceBooking } = useData();
  const [clientId, setClientId] = useState("bp-bern");
  const [description, setDescription] = useState("Part 1");
  const [dateOrdered, setDateOrdered] = useState("2025-10-01");
  const [datePromised, setDatePromised] = useState("2025-10-12");
  const [startDate, setStartDate] = useState("2025-09-29");
  const [endDate, setEndDate] = useState("2025-10-12");

  function create() {
    const created = addServiceBooking({
      id: "",
      documentNo: "",
      organization: "AbilityAPP",
      description,
      targetDocumentType: "Service Booking - Standard",
      isTemplate: false,
      readyToClaimRule: "Manual Tick",
      programOfSupports: false,
      dateOrdered,
      datePromised,
      startDate,
      endDate,
      clientId,
      invoicePartner: "NDIS - National Disability Insurance Scheme",
      serviceAgreementId: serviceAgreements.find((a) => a.clientId === clientId)?.id ?? "",
      bookingGeneratorRef: "BERN_SIL",
      totalLines: "0",
      grandTotal: "0",
      documentStatus: "Drafted",
      createdBy: "SuperUser",
      updatedBy: "SuperUser",
      lines: [],
    });
    router.push(`/service-bookings/${created.id}`);
  }

  return (
    <AppShell
      title="New service booking"
      subtitle="Create a service booking document with header dates and line items."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Service bookings", href: "/service-bookings" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Service bookings" }}
      actions={
        <button
          type="button"
          onClick={create}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Create booking
        </button>
      }
    >
      <div className="grid max-w-3xl gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Description</span>
          <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Business partner</span>
          <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.searchKey} — {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Date ordered</span>
          <input className={inputClass} type="date" value={dateOrdered} onChange={(e) => setDateOrdered(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Date promised</span>
          <input className={inputClass} type="date" value={datePromised} onChange={(e) => setDatePromised(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Start date</span>
          <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">End date</span>
          <input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        After creating the booking, open the <strong>Service booking line</strong> tab to add products, periods, and amounts.
      </p>
    </AppShell>
  );
}
