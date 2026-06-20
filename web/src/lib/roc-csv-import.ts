import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import {
  createRosterOfCare,
  emptyRosterOfCareLine,
  normalizeRosterOfCare,
  type RosterOfCareRecord,
} from "@/lib/roster-of-care";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";

const DAY_ALIASES: Record<string, number> = {
  mon: 0,
  monday: 0,
  tue: 1,
  tues: 1,
  tuesday: 1,
  wed: 2,
  wednesday: 2,
  thu: 3,
  thur: 3,
  thurs: 3,
  thursday: 3,
  fri: 4,
  friday: 4,
  sat: 5,
  saturday: 5,
  sun: 6,
  sunday: 6,
};

export type RocCsvInputRow = {
  clientSearchKey: string;
  day: string;
  startTime: string;
  endTime: string;
  supportType: string;
  locationSearchKey: string;
  workerRequirement: string;
  notes: string;
};

export const ROC_CSV_HEADERS = [
  "client_search_key",
  "day",
  "start_time",
  "end_time",
  "support_type",
  "location_search_key",
  "worker_requirement",
  "notes",
] as const;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseWeekday(value: string): number | null {
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (key in DAY_ALIASES) return DAY_ALIASES[key];
  const n = Number(key);
  if (Number.isInteger(n) && n >= 0 && n <= 6) return n;
  if (Number.isInteger(n) && n >= 1 && n <= 7) return n - 1;
  return null;
}

export function parseRocCsv(text: string): { ok: true; rows: RocCsvInputRow[] } | { ok: false; errors: string[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return { ok: false, errors: ["CSV is empty."] };

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const required = ["client_search_key", "day", "start_time", "end_time"];
  for (const col of required) {
    if (!header.includes(col)) {
      return { ok: false, errors: [`Missing required column: ${col}`] };
    }
  }

  const index = (name: string) => header.indexOf(name);
  const rows: RocCsvInputRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const clientSearchKey = cells[index("client_search_key")] ?? "";
    if (!clientSearchKey.trim()) {
      errors.push(`Row ${i + 1}: client_search_key is required.`);
      continue;
    }
    rows.push({
      clientSearchKey,
      day: cells[index("day")] ?? "",
      startTime: cells[index("start_time")] ?? "",
      endTime: cells[index("end_time")] ?? "",
      supportType: cells[index("support_type")] ?? "Standard",
      locationSearchKey: cells[index("location_search_key")] ?? "",
      workerRequirement: cells[index("worker_requirement")] ?? "",
      notes: cells[index("notes")] ?? "",
    });
  }

  if (!rows.length) return { ok: false, errors: errors.length ? errors : ["No data rows found."] };
  if (errors.length) return { ok: false, errors };
  return { ok: true, rows };
}

export function buildRosterOfCaresFromCsv(
  rows: RocCsvInputRow[],
  clients: ClientRecord[],
  locations: LocationRecord[],
  existing: RosterOfCareRecord[],
  updatedBy: string
): { ok: true; records: RosterOfCareRecord[] } | { ok: false; errors: string[] } {
  const clientByKey = new Map(clients.map((c) => [c.searchKey.toLowerCase(), c]));
  const locationByKey = new Map(locations.map((l) => [l.searchKey.toLowerCase(), l]));
  const errors: string[] = [];
  const grouped = new Map<string, RocCsvInputRow[]>();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const client = clientByKey.get(row.clientSearchKey.trim().toLowerCase());
    if (!client) {
      errors.push(`Row ${i + 2}: client ${row.clientSearchKey} not found.`);
      continue;
    }
    const weekday = parseWeekday(row.day);
    if (weekday == null) {
      errors.push(`Row ${i + 2}: day "${row.day}" is not valid (use Mon–Sun or 0–6).`);
      continue;
    }
    const startTime = normalizeTime(row.startTime);
    const endTime = normalizeTime(row.endTime);
    if (!startTime || !endTime) {
      errors.push(`Row ${i + 2}: start_time and end_time must be HH:MM.`);
      continue;
    }
    const locationKey = row.locationSearchKey.trim();
    const location = locationKey ? locationByKey.get(locationKey.toLowerCase()) : undefined;
    if (locationKey && !location) {
      errors.push(`Row ${i + 2}: location ${row.locationSearchKey} not found.`);
      continue;
    }
    const list = grouped.get(client.id) ?? [];
    list.push({ ...row, day: String(weekday), startTime, endTime });
    grouped.set(client.id, list);
  }

  if (errors.length) return { ok: false, errors };

  const records: RosterOfCareRecord[] = [];
  for (const [clientId, clientRows] of grouped) {
    const client = clients.find((c) => c.id === clientId)!;
    const prior =
      existing.find((r) => r.clientId === clientId && r.status === "Active") ??
      existing.find((r) => r.clientId === clientId && r.status === "Draft");
    const base =
      prior ??
      createRosterOfCare(
        {
          clientId,
          name: `${client.searchKey} weekly RoC`,
          source: "CSV import",
          status: "Active",
          createdBy: updatedBy,
          updatedBy,
        },
        existing
      );

    const lines = clientRows.map((row, index) => {
      return {
        ...emptyRosterOfCareLine(index + 1, Number(row.day)),
        startTime: row.startTime,
        endTime: row.endTime,
        supportType: row.supportType.trim() || "Standard",
        locationId:
          (row.locationSearchKey.trim()
            ? locationByKey.get(row.locationSearchKey.trim().toLowerCase())?.id
            : undefined) ?? "",
        workerRequirement: row.workerRequirement.trim(),
        notes: row.notes.trim(),
      };
    });

    records.push(
      normalizeRosterOfCare({
        ...base,
        source: "CSV import",
        updatedBy,
        lines,
      })
    );
  }

  if (!records.length) return { ok: false, errors: ["No roster of care records could be built."] };
  return { ok: true, records };
}

export function generateRosterOfCareFromAgreement(
  agreement: ServiceAgreementRecord,
  client: ClientRecord,
  locations: LocationRecord[],
  existing: RosterOfCareRecord[],
  updatedBy: string,
  primaryLocationId = ""
): RosterOfCareRecord {
  const locationId =
    primaryLocationId ||
    locations.find((l) => l.clientLinks?.some((link) => link.clientId === client.id))?.id ||
    locations[0]?.id ||
    "";

  const lines = agreement.lines.map((line, index) => {
    const isSil = line.registrationGroup.toLowerCase().includes("independent living");
    const supportType = isSil ? "Active overnight" : "Standard";
    const startTime = isSil ? "22:00" : "09:00";
    const endTime = isSil ? "06:00" : "15:00";
    const weekday = index % 5;
    return {
      ...emptyRosterOfCareLine(index + 1, weekday),
      startTime,
      endTime,
      supportType,
      locationId,
      serviceAgreementLineId: line.id,
      workerRequirement: isSil ? "Overnight support worker" : "Support worker",
      notes: line.name || line.description,
    };
  });

  const draftPrior = existing.find((r) => r.clientId === client.id && r.status === "Draft");
  const base =
    draftPrior ??
    createRosterOfCare(
      {
        clientId: client.id,
        name: `${client.searchKey} — ${agreement.searchKey}`,
        serviceAgreementId: agreement.id,
        source: "Generated",
        status: "Draft",
        createdBy: updatedBy,
        updatedBy,
      },
      existing
    );

  return normalizeRosterOfCare({
    ...base,
    serviceAgreementId: agreement.id,
    source: "Generated",
    status: "Draft",
    updatedBy,
    lines: lines.length ? lines : [emptyRosterOfCareLine(1)],
  });
}
