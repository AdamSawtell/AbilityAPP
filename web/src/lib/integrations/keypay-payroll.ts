import type { PayrollExportRow } from "@/lib/timesheet-payroll-export";

/** Keypay Payroll AU API v2 — https://api.yourpayroll.com.au/api/v2 */
const DEFAULT_KEYPAY_BASE_URL = "https://api.yourpayroll.com.au/api/v2";

export type KeypayTimesheetLine = {
  employeeNumber: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  shiftType: string;
  costCentre: string;
  notes: string;
  externalRef: string;
};

export type KeypayExportPayload = {
  batchRef: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  lineCount: number;
  lines: KeypayTimesheetLine[];
};

export type KeypayPublicStatus = {
  available: boolean;
  mode: "live" | "dry-run" | "disabled";
  businessId: string;
  message: string;
};

export type KeypayExportResponse =
  | {
      ok: true;
      batchRef: string;
      payRunRef: string;
      lineCount: number;
      dryRun: boolean;
    }
  | { ok: false; message: string };

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function keypayApiKey(): string {
  return process.env.KEYPAY_API_KEY?.trim() ?? "";
}

export function keypayBusinessId(): string {
  return process.env.KEYPAY_BUSINESS_ID?.trim() ?? "";
}

export function keypayBaseUrl(): string {
  return process.env.KEYPAY_API_BASE_URL?.trim() || DEFAULT_KEYPAY_BASE_URL;
}

export function keypayDryRunEnabled(): boolean {
  return envFlag("KEYPAY_DRY_RUN");
}

export function keypayLiveConfigured(): boolean {
  return Boolean(keypayApiKey() && keypayBusinessId());
}

export function getKeypayPublicStatus(): KeypayPublicStatus {
  if (keypayDryRunEnabled()) {
    return {
      available: true,
      mode: "dry-run",
      businessId: keypayBusinessId(),
      message: keypayLiveConfigured()
        ? "Dry run — export is validated but not sent to Keypay (KEYPAY_DRY_RUN overrides live credentials)."
        : "Dry run — export payload is validated but not sent to Keypay.",
    };
  }
  if (keypayLiveConfigured()) {
    return {
      available: true,
      mode: "live",
      businessId: keypayBusinessId(),
      message: "Keypay API credentials configured — exports post to your payroll business.",
    };
  }
  return {
    available: false,
    mode: "disabled",
    businessId: "",
    message: "Set KEYPAY_API_KEY and KEYPAY_BUSINESS_ID, or KEYPAY_DRY_RUN=true for testing.",
  };
}

export function payrollRowsToKeypayPayload(rows: PayrollExportRow[], batchRef: string): KeypayExportPayload {
  const periods = rows.flatMap((r) => [r.payPeriodStart, r.payPeriodEnd].filter(Boolean));
  const payPeriodStart = periods.length ? periods.sort()[0] : "";
  const payPeriodEnd = periods.length ? periods.sort().at(-1) ?? "" : "";

  const lines: KeypayTimesheetLine[] = rows.map((row) => ({
    employeeNumber: row.employeeNumber,
    workDate: row.workDate,
    startTime: row.startTime,
    endTime: row.endTime,
    hours: Number.parseFloat(row.hours) || 0,
    shiftType: row.shiftType,
    costCentre: row.costCentre,
    notes: row.lineNotes,
    externalRef: `${row.timesheetDocument}-${row.workDate}-${row.startTime}`,
  }));

  return {
    batchRef,
    payPeriodStart,
    payPeriodEnd,
    lineCount: lines.length,
    lines,
  };
}

function keypayBasicAuthHeader(): string {
  const key = keypayApiKey();
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

function isoDateTime(workDate: string, time: string): string {
  const date = workDate.slice(0, 10);
  const part = time.slice(0, 5);
  return `${date}T${part}:00`;
}

/** POST one AuIndividualTimesheetLineModel per line (Keypay AU v2). */
async function postKeypayTimesheetLine(
  businessId: string,
  line: KeypayTimesheetLine
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const startTime = isoDateTime(line.workDate, line.startTime);
  let endDate = line.workDate.slice(0, 10);
  const startMins = Number.parseInt(line.startTime.slice(0, 2), 10) * 60 + Number.parseInt(line.startTime.slice(3, 5), 10);
  const endMins = Number.parseInt(line.endTime.slice(0, 2), 10) * 60 + Number.parseInt(line.endTime.slice(3, 5), 10);
  if (endMins <= startMins) {
    const d = new Date(`${endDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    endDate = d.toISOString().slice(0, 10);
  }
  const endTime = isoDateTime(endDate, line.endTime);

  const url = `${keypayBaseUrl().replace(/\/$/, "")}/business/${businessId}/timesheet`;
  const body = {
    employeeId: line.employeeNumber,
    startTime,
    endTime,
    units: line.hours,
    workType: line.shiftType,
    location: line.costCentre,
    notes: line.notes,
    externalReference: line.externalRef,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: keypayBasicAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: { id?: string | number; message?: string } = {};
  try {
    parsed = text ? (JSON.parse(text) as typeof parsed) : {};
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const detail = parsed.message || text.slice(0, 200) || res.statusText;
    return { ok: false, message: `Keypay API error (${res.status}): ${detail}` };
  }

  return { ok: true, id: String(parsed.id ?? line.externalRef) };
}

/** POST earnings-style timesheet lines to Keypay (or dry-run). */
export async function exportPayloadToKeypay(payload: KeypayExportPayload): Promise<KeypayExportResponse> {
  if (!payload.lines.length) {
    return { ok: false, message: "No timesheet lines to export." };
  }

  const status = getKeypayPublicStatus();
  if (!status.available) {
    return { ok: false, message: status.message };
  }

  if (status.mode === "dry-run") {
    return {
      ok: true,
      batchRef: payload.batchRef,
      payRunRef: `DRY-${payload.batchRef}`,
      lineCount: payload.lineCount,
      dryRun: true,
    };
  }

  const businessId = keypayBusinessId();
  const postedIds: string[] = [];
  for (const line of payload.lines) {
    const result = await postKeypayTimesheetLine(businessId, line);
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    postedIds.push(result.id);
  }

  return {
    ok: true,
    batchRef: payload.batchRef,
    payRunRef: postedIds[0] || payload.batchRef,
    lineCount: payload.lineCount,
    dryRun: false,
  };
}
