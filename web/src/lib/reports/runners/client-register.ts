import type { ClientRecord } from "@/lib/client";
import type { ReportResult } from "@/lib/reports/types";

type ClientColumn = {
  id: string;
  label: string;
  getValue: (row: ClientRecord) => string;
};

export const CLIENT_REGISTER_COLUMNS: ClientColumn[] = [
  { id: "searchKey", label: "Search key", getValue: (r) => r.searchKey },
  { id: "name", label: "Name", getValue: (r) => r.name },
  { id: "firstName", label: "First name", getValue: (r) => r.firstName },
  { id: "lastName", label: "Last name", getValue: (r) => r.lastName },
  { id: "preferredName", label: "Preferred name", getValue: (r) => r.preferredName },
  { id: "status", label: "Status", getValue: (r) => r.status },
  { id: "email", label: "Email", getValue: (r) => r.email },
  { id: "phone", label: "Phone", getValue: (r) => r.phone },
  { id: "birthday", label: "Birthday", getValue: (r) => r.birthday },
  { id: "gender", label: "Gender", getValue: (r) => r.gender },
  { id: "livingArrangement", label: "Living arrangement", getValue: (r) => r.livingArrangement },
  { id: "fundingBody", label: "Funding body", getValue: (r) => r.fundingBody },
  { id: "fundingBodyNumber", label: "Funding body number", getValue: (r) => r.fundingBodyNumber },
  { id: "dateSupportCommencement", label: "Support commenced", getValue: (r) => r.dateSupportCommencement },
  { id: "dateSupportCeased", label: "Support ceased", getValue: (r) => r.dateSupportCeased },
  { id: "disability", label: "Disability", getValue: (r) => r.disability },
  { id: "riskAlerts", label: "Risk alerts", getValue: (r) => r.riskAlerts },
  { id: "salesRepresentative", label: "Sales representative", getValue: (r) => r.salesRepresentative },
  { id: "alertCount", label: "Alert count", getValue: (r) => String(r.alerts.length) },
  { id: "locationCount", label: "Location count", getValue: (r) => String(r.locations.length) },
];

export function buildClientRegisterReport(clients: ClientRecord[]): ReportResult {
  const rows = [...clients]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((client) => {
      const flat: Record<string, string> = {};
      for (const col of CLIENT_REGISTER_COLUMNS) {
        flat[col.id] = col.getValue(client);
      }
      return flat;
    });

  return {
    columns: CLIENT_REGISTER_COLUMNS.map(({ id, label }) => ({ id, label })),
    rows,
  };
}
