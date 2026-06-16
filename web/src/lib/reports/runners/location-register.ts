import type { LocationRecord } from "@/lib/location";
import type { ReportResult } from "@/lib/reports/types";

type LocationColumn = {
  id: string;
  label: string;
  getValue: (row: LocationRecord) => string;
};

export const LOCATION_REGISTER_COLUMNS: LocationColumn[] = [
  { id: "searchKey", label: "Search key", getValue: (r) => r.searchKey },
  { id: "name", label: "Name", getValue: (r) => r.name },
  { id: "locationType", label: "Location type", getValue: (r) => r.locationType },
  { id: "status", label: "Status", getValue: (r) => r.status },
  { id: "address1", label: "Address", getValue: (r) => r.address1 },
  { id: "city", label: "City", getValue: (r) => r.city },
  { id: "state", label: "State", getValue: (r) => r.state },
  { id: "postcode", label: "Postcode", getValue: (r) => r.postcode },
  { id: "phone", label: "Phone", getValue: (r) => r.phone },
  { id: "email", label: "Email", getValue: (r) => r.email },
  { id: "capacity", label: "Capacity", getValue: (r) => r.capacity },
  { id: "validFrom", label: "Valid from", getValue: (r) => r.validFrom },
  { id: "validTo", label: "Valid to", getValue: (r) => r.validTo },
  { id: "clientCount", label: "Client count", getValue: (r) => String(r.clientLinks.length) },
  { id: "employeeCount", label: "Staff count", getValue: (r) => String(r.employeeLinks.length) },
  { id: "productCount", label: "Service count", getValue: (r) => String(r.productLinks.length) },
  { id: "alertCount", label: "Alert count", getValue: (r) => String(r.alerts.length) },
  { id: "accessNotes", label: "Access notes", getValue: (r) => r.accessNotes },
  { id: "description", label: "Description", getValue: (r) => r.description },
  { id: "createdBy", label: "Created by", getValue: (r) => r.createdBy },
];

export function buildLocationRegisterReport(locations: LocationRecord[]): ReportResult {
  const rows = [...locations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((location) => {
      const flat: Record<string, string> = {};
      for (const col of LOCATION_REGISTER_COLUMNS) {
        flat[col.id] = col.getValue(location);
      }
      return flat;
    });

  return {
    columns: LOCATION_REGISTER_COLUMNS.map(({ id, label }) => ({ id, label })),
    rows,
  };
}
