import type { ClientRecord } from "@/lib/client";
import type { ReportResult } from "@/lib/reports/types";
import { buildClientRegisterReport } from "@/lib/reports/runners/client-register";

export type ReportDataContext = {
  clients: ClientRecord[];
};

export function runReport(reportId: string, ctx: ReportDataContext): ReportResult | null {
  switch (reportId) {
    case "client-register":
      return buildClientRegisterReport(ctx.clients);
    default:
      return null;
  }
}
