"use client";

import { useMemo } from "react";
import { useReferenceData } from "@/lib/config-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LineItemTable } from "@/components/line-item-table";
import { ClientRecordLink, EmployeeRecordLink, ProductRecordLink } from "@/components/record-link";
import { allowedDetailTabsFromGroups, resolveDetailWindowKey } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { RecordIncidentsPanel } from "@/components/record-incidents-panel";
import { RecordPhotoPanel } from "@/components/record-photo-panel";
import {
  locationActivityTableConfig,
  locationAlertTableConfig,
  locationClientLinkTableConfig,
  locationEmployeeLinkTableConfig,
  locationProductLinkTableConfig,
} from "@/lib/location-line-tables";
import {
  locationContactFields,
  locationOverviewFields,
  locationTabGroups,
  type LocationRecord,
} from "@/lib/location";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const fieldLabels: Partial<Record<keyof LocationRecord, string>> = {
  searchKey: "Search key",
  name: "Name",
  description: "Description",
  locationType: "Location type",
  status: "Status",
  capacity: "Capacity",
  validFrom: "Valid from",
  validTo: "Valid to",
  address1: "Address line 1",
  address2: "Address line 2",
  address3: "Address line 3",
  city: "City",
  state: "State",
  postcode: "Postcode",
  country: "Country",
  phone: "Phone",
  mobile: "Mobile",
  email: "Email",
  accessNotes: "Access notes",
  pictureUrl: "Photo URL",
};

function Field({
  label,
  fieldKey,
  location,
  onChange,
  getOptions,
  readOnly = false,
}: {
  label: string;
  fieldKey: keyof LocationRecord;
  location: LocationRecord;
  onChange: (key: keyof LocationRecord, value: string) => void;
  getOptions: (key: string) => string[];
  readOnly?: boolean;
}) {
  const value = String(location[fieldKey] ?? "");
  const isTextarea = fieldKey === "description" || fieldKey === "accessNotes";

  if (readOnly) {
    return (
      <div className={`block ${isTextarea ? "sm:col-span-2" : ""}`}>
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <p className="whitespace-pre-wrap text-sm text-slate-900">{value.trim() || "—"}</p>
      </div>
    );
  }

  if (fieldKey === "locationType") {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <select className={inputClass} value={value} onChange={(e) => onChange(fieldKey, e.target.value)}>
          {getOptions("locationType").map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (fieldKey === "status") {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <select className={inputClass} value={value} onChange={(e) => onChange(fieldKey, e.target.value)}>
          {getOptions("locationStatus").map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (isTextarea) {
    return (
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      </label>
    );
  }

  if (fieldKey === "validFrom" || fieldKey === "validTo") {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <input
          type="date"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <input className={inputClass} value={value} onChange={(e) => onChange(fieldKey, e.target.value)} />
    </label>
  );
}

function FieldGrid({
  keys,
  location,
  onChange,
  getOptions,
  readOnly = false,
}: {
  keys: (keyof LocationRecord)[];
  location: LocationRecord;
  onChange: (key: keyof LocationRecord, value: string) => void;
  getOptions: (key: string) => string[];
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {keys.map((key) => (
        <Field
          key={key}
          label={fieldLabels[key] ?? key}
          fieldKey={key}
          location={location}
          onChange={onChange}
          getOptions={getOptions}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function tabCount(location: LocationRecord, tab: string): number | null {
  if (tab === "Alerts") return location.alerts.length;
  if (tab === "Clients") return location.clientLinks.length;
  if (tab === "Employees") return location.employeeLinks.length;
  if (tab === "Products & services") return location.productLinks.length;
  if (tab === "Activity") return location.activities.length;
  if (tab === "Incidents") return null;
  return null;
}

export function LocationTabbedView({
  location,
  onChange,
  onAlertsChange,
  onClientLinksChange,
  onEmployeeLinksChange,
  onProductLinksChange,
  onActivitiesChange,
}: {
  location: LocationRecord;
  onChange: (key: keyof LocationRecord, value: string) => void;
  onAlertsChange: (rows: LocationRecord["alerts"]) => void;
  onClientLinksChange: (rows: LocationRecord["clientLinks"]) => void;
  onEmployeeLinksChange: (rows: LocationRecord["employeeLinks"]) => void;
  onProductLinksChange: (rows: LocationRecord["productLinks"]) => void;
  onActivitiesChange: (rows: LocationRecord["activities"]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow, canWriteWindow, canProcess } = useAuth();
  const { clients, employees, products } = useData();
  const { getOptions } = useReferenceData();

  const referenceDropdowns = useMemo(
    () => ({
      locationType: getOptions("locationType"),
      locationStatus: getOptions("locationStatus"),
      locationClientRole: getOptions("locationClientRole"),
      locationEmployeeRole: getOptions("locationEmployeeRole"),
      locationAlertType: getOptions("locationAlertType"),
      locationActivityType: getOptions("locationActivityType"),
      showAsAlert: getOptions("showAsAlert"),
      yesNo: getOptions("yesNo"),
    }),
    [getOptions]
  );

  const clientDropdowns = useMemo(
    () => ({
      ...referenceDropdowns,
      clientId: clients.map((c) => c.id),
      employeeId: employees.map((e) => e.id),
      productId: products.filter((p) => p.active).map((p) => p.id),
    }),
    [clients, employees, products, referenceDropdowns]
  );

  const allowedTabs = allowedDetailTabsFromGroups("locations", locationTabGroups, session?.windowKeys ?? []);
  const defaultTab = allowedTabs[0] ?? "Overview";
  const requestedTab = searchParams.get("tab") ?? defaultTab;
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;

  const visibleGroups = locationTabGroups
    .map((group) => ({ ...group, tabs: group.tabs.filter((tab) => allowedTabs.includes(tab)) }))
    .filter((group) => group.tabs.length > 0);

  const optionLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const c of clients) labels[c.id] = `${c.searchKey} — ${c.name}`;
    for (const e of employees) labels[e.id] = `${e.searchKey} — ${e.name}`;
    for (const p of products) labels[p.id] = `${p.searchKey} — ${p.name}`;
    return labels;
  }, [clients, employees, products]);

  const canAssignClient = canProcess("assign-location-client");
  const canAssignEmployee = canProcess("assign-location-employee");
  const canAssignProduct = canProcess("assign-location-product");

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function canWriteLocationTab(tab: string) {
    const key = resolveDetailWindowKey("locations", tab);
    return key ? canWriteWindow(key) : false;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="hidden shrink-0 lg:block lg:w-52 xl:w-56">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const count = tabCount(location, tab);
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">{tab}</span>
                      {count !== null && count > 0 ? (
                        <span className="shrink-0 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap gap-2 lg:hidden">
          {allowedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeTab === tab ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && canWindow("location-overview") ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Overview</h3>
            <p className="mt-1 text-sm text-slate-500">Core site details for this support location.</p>
            <div className="mt-4">
              <FieldGrid
                keys={locationOverviewFields}
                location={location}
                onChange={onChange}
                getOptions={getOptions}
                readOnly={!canWriteLocationTab("Overview")}
              />
            </div>
          </div>
        ) : null}

        {activeTab === "Contact & address" && canWindow("location-contact-and-address") ? (
          <div className="space-y-4">
            {canWriteLocationTab("Contact & address") ? (
              <RecordPhotoPanel
                pictureUrl={location.pictureUrl}
                onChange={(url) => onChange("pictureUrl", url)}
                description="Site image for rosters, bookings, and staff orientation."
              />
            ) : location.pictureUrl ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <img src={location.pictureUrl} alt="" className="max-h-40 rounded-lg object-cover" />
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Contact & address</h3>
              <p className="mt-1 text-sm text-slate-500">Where the site is and how to reach on-site staff.</p>
              <div className="mt-4">
                <FieldGrid
                  keys={locationContactFields}
                  location={location}
                  onChange={onChange}
                  getOptions={getOptions}
                  readOnly={!canWriteLocationTab("Contact & address")}
                />
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "Alerts" && canWindow("location-alerts") ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
              <p className="text-sm text-slate-500">
                Safety, access, and operational alerts shown to staff working at this location.
              </p>
            </div>
            <LineItemTable
              config={locationAlertTableConfig}
              rows={location.alerts}
              onChange={onAlertsChange}
              dropdowns={referenceDropdowns}
              readOnly={!canWriteLocationTab("Alerts")}
            />
          </div>
        ) : null}

        {activeTab === "Clients" && canWindow("location-clients") ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Clients</h3>
                <p className="text-sm text-slate-500">Support receivers linked to this location (one location, many clients).</p>
              </div>
              {!canAssignClient || !canWriteLocationTab("Clients") ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">View only</span>
              ) : null}
            </div>
            <LineItemTable
              config={locationClientLinkTableConfig}
              rows={location.clientLinks}
              onChange={canAssignClient && canWriteLocationTab("Clients") ? onClientLinksChange : () => {}}
              dropdowns={clientDropdowns}
              optionLabels={optionLabels}
              readOnly={!canWriteLocationTab("Clients")}
            />
            {location.clientLinks.length > 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                {location.clientLinks.map((link) => {
                  const client = clients.find((c) => c.id === link.clientId);
                  if (!client) return null;
                  return (
                    <p key={link.id} className="text-slate-600">
                      <ClientRecordLink
                        id={client.id}
                        searchKey={client.searchKey}
                        name={client.name}
                        className="font-medium text-[#b51266] hover:underline"
                      />{" "}
                      — {link.assignmentRole}
                      {link.primaryAssignment === "Yes" ? " (primary)" : ""}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "Employees" && canWindow("location-employees") ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Employees</h3>
                <p className="text-sm text-slate-500">Staff assigned to work at this location (one location, many employees).</p>
              </div>
              {!canAssignEmployee || !canWriteLocationTab("Employees") ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">View only</span>
              ) : null}
            </div>
            <LineItemTable
              config={locationEmployeeLinkTableConfig}
              rows={location.employeeLinks}
              onChange={canAssignEmployee && canWriteLocationTab("Employees") ? onEmployeeLinksChange : () => {}}
              dropdowns={clientDropdowns}
              optionLabels={optionLabels}
              readOnly={!canWriteLocationTab("Employees")}
            />
            {location.employeeLinks.length > 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                {location.employeeLinks.map((link) => {
                  const employee = employees.find((e) => e.id === link.employeeId);
                  if (!employee) return null;
                  return (
                    <p key={link.id} className="text-slate-600">
                      <EmployeeRecordLink
                        id={employee.id}
                        searchKey={employee.searchKey}
                        name={employee.name}
                        className="font-medium text-[#b51266] hover:underline"
                      />{" "}
                      — {link.assignmentRole}
                      {link.primaryAssignment === "Yes" ? " (primary)" : ""}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "Incidents" && canWindow("location-incidents") ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Incidents</h3>
              <p className="text-sm text-slate-500">Incident reports linked to this location.</p>
            </div>
            <RecordIncidentsPanel
              locationId={location.id}
              entityLabel={`${location.searchKey} — ${location.name}`}
            />
          </div>
        ) : null}

        {activeTab === "Products & services" && canWindow("location-products-and-services") ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Products & services</h3>
                <p className="text-sm text-slate-500">
                  NDIS products and services delivered at this location. Pulled from the product catalog.
                </p>
              </div>
              {!canAssignProduct || !canWriteLocationTab("Products & services") ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">View only</span>
              ) : null}
            </div>
            <LineItemTable
              config={locationProductLinkTableConfig}
              rows={location.productLinks}
              onChange={canAssignProduct && canWriteLocationTab("Products & services") ? onProductLinksChange : () => {}}
              dropdowns={clientDropdowns}
              optionLabels={optionLabels}
              readOnly={!canWriteLocationTab("Products & services")}
            />
            {location.productLinks.length > 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                {location.productLinks.map((link) => {
                  const product = products.find((p) => p.id === link.productId);
                  if (!product) return null;
                  return (
                    <p key={link.id} className="text-slate-600">
                      <ProductRecordLink
                        id={product.id}
                        searchKey={product.searchKey}
                        name={product.name}
                        className="font-medium text-[#b51266] hover:underline"
                      />{" "}
                      — {product.productCategory}
                      {link.active === "Yes" ? "" : " (inactive)"}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "Activity" && canWindow("location-activity") ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
              <p className="mt-1 text-sm text-slate-600">
                Log visits, maintenance, and operational notes for this location.
              </p>
            </div>
            <LineItemTable
              config={locationActivityTableConfig}
              rows={location.activities}
              onChange={onActivitiesChange}
              dropdowns={referenceDropdowns}
              readOnly={!canWriteLocationTab("Activity")}
            />
          </div>
        ) : null}

        {allowedTabs.length === 0 ? (
          <p className="text-sm text-slate-500">You do not have access to any tabs on this location record.</p>
        ) : null}
      </div>
    </div>
  );
}
