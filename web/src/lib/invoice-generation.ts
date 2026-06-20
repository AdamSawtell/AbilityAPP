import {
  billingLinkedTimesheetLineIds,
  defaultInvoiceRecipient,
  isInvoiceManagedClient,
  planManagementForClient,
} from "@/lib/billing-plan-type";
import type { ClientRecord } from "@/lib/client";
import {
  applyLineValidation,
  validateClaimLine,
} from "@/lib/claim-papl-validation";
import type { ClaimLine } from "@/lib/claim";
import type { ClaimRecord } from "@/lib/claim";
import {
  createInvoice,
  emptyInvoiceLine,
  normalizeInvoice,
  sumInvoiceLineAmount,
  type InvoiceLine,
  type InvoiceRecord,
} from "@/lib/invoice";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { getProductPrice } from "@/lib/product";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import type { TimesheetLine, TimesheetRecord } from "@/lib/timesheet";
import { verifyTimesheet } from "@/lib/timesheet-verification";
import type { LocationRecord } from "@/lib/location";

export type InvoiceGenerationPreviewRow = {
  clientId: string;
  lineCount: number;
  totalAmount: number;
  planManagementType: string;
};

export type InvoiceGenerationPreview = {
  periodStart: string;
  periodEnd: string;
  eligibleLineCount: number;
  alreadyBilledCount: number;
  unverifiedSkippedCount: number;
  lockedInvoiceSkippedCount: number;
  agencyManagedSkippedCount: number;
  rows: InvoiceGenerationPreviewRow[];
};

export type InvoiceGenerationResult = {
  created: InvoiceRecord[];
  updated: InvoiceRecord[];
  skippedAlreadyBilled: number;
  skippedUnverified: number;
  skippedLockedInvoice: number;
  skippedAgencyManaged: number;
};

export type InvoiceGenerationContext = {
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  rosterShifts: RosterShiftRecord[];
  locations: LocationRecord[];
  clients: ClientRecord[];
  serviceBookings: ServiceBookingRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
};

function lineInPeriod(line: TimesheetLine, periodStart: string, periodEnd: string): boolean {
  return line.shiftDate >= periodStart && line.shiftDate <= periodEnd;
}

function resolveBookingLine(
  booking: ServiceBookingRecord | undefined,
  serviceDate: string
): ServiceBookingRecord["lines"][number] | undefined {
  if (!booking?.lines.length) return undefined;
  const inRange = booking.lines.filter((line) => {
    if (!line.productId?.trim()) return false;
    const start = line.startDate?.slice(0, 10) ?? "";
    const end = line.endDate?.slice(0, 10) ?? "";
    if (start && serviceDate < start) return false;
    if (end && serviceDate > end) return false;
    return true;
  });
  return inRange.find((l) => l.readyToClaim) ?? inRange[0] ?? booking.lines.find((l) => l.productId?.trim());
}

function resolveProductPrice(
  productId: string,
  priceLists: PriceListRecord[],
  products: ProductRecord[]
): number {
  const product = products.find((p) => p.id === productId);
  if (!product) return 0;
  const list = priceLists.find((pl) => pl.id === product.priceListId) ?? priceLists[0];
  const row = getProductPrice(list, productId);
  const price = parseFloat(row?.standardPrice ?? row?.listPrice ?? "0");
  return Number.isFinite(price) ? price : 0;
}

function supportCategoryForProduct(product: ProductRecord | undefined): string {
  if (!product) return "";
  return product.productCategory || "";
}

function buildInvoiceLine(params: {
  lineNo: number;
  timesheet: TimesheetRecord;
  tsLine: TimesheetLine;
  shift: RosterShiftRecord | undefined;
  client: ClientRecord | undefined;
  booking: ServiceBookingRecord | undefined;
  products: ProductRecord[];
  priceLists: PriceListRecord[];
}): InvoiceLine {
  const { lineNo, timesheet, tsLine, shift, client, booking, products, priceLists } = params;
  const bookingLine = resolveBookingLine(booking, tsLine.shiftDate);
  const productId = bookingLine?.productId ?? "";
  const product = products.find((p) => p.id === productId);
  const unitPrice = bookingLine?.price
    ? parseFloat(bookingLine.price) || resolveProductPrice(productId, priceLists, products)
    : resolveProductPrice(productId, priceLists, products);
  const quantity = tsLine.hours ?? 0;
  const lineAmount = Math.round(quantity * unitPrice * 100) / 100;

  const draft = emptyInvoiceLine(lineNo);
  draft.id = `inl-${tsLine.id}`;
  draft.timesheetId = timesheet.id;
  draft.timesheetLineId = tsLine.id;
  draft.rosterShiftId = tsLine.rosterShiftId;
  draft.clientId = tsLine.clientId;
  draft.employeeId = timesheet.employeeId;
  draft.serviceBookingId = tsLine.serviceBookingId;
  draft.productId = productId;
  draft.ndisSupportItem = product?.ndisSupportItem ?? "";
  draft.supportCategory = supportCategoryForProduct(product);
  draft.serviceDate = tsLine.shiftDate;
  draft.quantity = quantity;
  draft.unitPrice = unitPrice;
  draft.lineAmount = lineAmount;
  draft.lineDescription = product?.name ?? "";

  const claimShape: ClaimLine = {
    id: draft.id,
    lineNo: draft.lineNo,
    timesheetId: draft.timesheetId,
    timesheetLineId: draft.timesheetLineId,
    rosterShiftId: draft.rosterShiftId,
    clientId: draft.clientId,
    employeeId: draft.employeeId,
    serviceBookingId: draft.serviceBookingId,
    productId: draft.productId,
    ndisSupportItem: draft.ndisSupportItem,
    supportCategory: draft.supportCategory,
    serviceDate: draft.serviceDate,
    quantity: draft.quantity,
    unitPrice: draft.unitPrice,
    lineAmount: draft.lineAmount,
    claimType: bookingLine?.claimType || "Standard",
    validationStatus: draft.validationStatus,
    validationMessage: draft.validationMessage,
  };

  const validation = validateClaimLine({
    line: claimShape,
    client,
    product,
    priceList: priceLists.find((pl) => pl.id === product?.priceListId) ?? priceLists[0],
    booking,
  });
  const validated = applyLineValidation(claimShape, validation);
  draft.validationStatus = validated.validationStatus;
  draft.validationMessage = validated.validationMessage;
  return draft;
}

type EligibleSourceLine = {
  timesheet: TimesheetRecord;
  tsLine: TimesheetLine;
  clientId: string;
};

function lockedInvoiceClientIds(
  invoices: InvoiceRecord[],
  periodStart: string,
  periodEnd: string
): Set<string> {
  return new Set(
    invoices
      .filter(
        (inv) =>
          inv.periodStart === periodStart &&
          inv.periodEnd === periodEnd &&
          inv.status !== "Draft" &&
          inv.clientId?.trim()
      )
      .map((inv) => inv.clientId)
  );
}

function collectEligibleLines(
  ctx: InvoiceGenerationContext,
  periodStart: string,
  periodEnd: string
): {
  eligible: EligibleSourceLine[];
  alreadyBilled: number;
  unverifiedSkipped: number;
  lockedInvoiceSkipped: number;
  agencyManagedSkipped: number;
} {
  const linked = billingLinkedTimesheetLineIds(ctx.claims, ctx.invoices);
  const lockedClients = lockedInvoiceClientIds(ctx.invoices, periodStart, periodEnd);
  const eligible: EligibleSourceLine[] = [];
  let alreadyBilled = 0;
  let unverifiedSkipped = 0;
  let lockedInvoiceSkipped = 0;
  let agencyManagedSkipped = 0;

  for (const timesheet of ctx.timesheets) {
    if (timesheet.status !== "Approved") continue;
    const verification = verifyTimesheet(timesheet, ctx.rosterShifts, ctx.locations);
    const verifiedLineIds = new Set(
      verification.lines.filter((l) => l.status === "verified").map((l) => l.lineId)
    );

    for (const tsLine of timesheet.lines) {
      if (!lineInPeriod(tsLine, periodStart, periodEnd)) continue;
      if (!tsLine.clientId?.trim()) continue;
      const client = ctx.clients.find((c) => c.id === tsLine.clientId);
      if (!isInvoiceManagedClient(client)) {
        agencyManagedSkipped += 1;
        continue;
      }
      if (lockedClients.has(tsLine.clientId)) {
        lockedInvoiceSkipped += 1;
        continue;
      }
      if (linked.has(tsLine.id)) {
        alreadyBilled += 1;
        continue;
      }
      if (!verifiedLineIds.has(tsLine.id)) {
        unverifiedSkipped += 1;
        continue;
      }
      eligible.push({ timesheet, tsLine, clientId: tsLine.clientId });
    }
  }

  return { eligible, alreadyBilled, unverifiedSkipped, lockedInvoiceSkipped, agencyManagedSkipped };
}

export function previewInvoiceGeneration(
  ctx: InvoiceGenerationContext,
  periodStart: string,
  periodEnd: string
): InvoiceGenerationPreview {
  const { eligible, alreadyBilled, unverifiedSkipped, lockedInvoiceSkipped, agencyManagedSkipped } =
    collectEligibleLines(ctx, periodStart, periodEnd);
  const byClient = new Map<string, { lineCount: number; totalAmount: number; planManagementType: string }>();

  for (const row of eligible) {
    const client = ctx.clients.find((c) => c.id === row.clientId);
    const booking = ctx.serviceBookings.find((b) => b.id === row.tsLine.serviceBookingId);
    const shift = ctx.rosterShifts.find((s) => s.id === row.tsLine.rosterShiftId);
    const invoiceLine = buildInvoiceLine({
      lineNo: 1,
      timesheet: row.timesheet,
      tsLine: row.tsLine,
      shift,
      client,
      booking,
      products: ctx.products,
      priceLists: ctx.priceLists,
    });
    const stats = byClient.get(row.clientId) ?? {
      lineCount: 0,
      totalAmount: 0,
      planManagementType: planManagementForClient(client),
    };
    stats.lineCount += 1;
    stats.totalAmount = Math.round((stats.totalAmount + invoiceLine.lineAmount) * 100) / 100;
    byClient.set(row.clientId, stats);
  }

  const rows = [...byClient.entries()]
    .map(([clientId, stats]) => ({
      clientId,
      lineCount: stats.lineCount,
      totalAmount: stats.totalAmount,
      planManagementType: stats.planManagementType,
    }))
    .sort((a, b) => a.clientId.localeCompare(b.clientId));

  return {
    periodStart,
    periodEnd,
    eligibleLineCount: eligible.length,
    alreadyBilledCount: alreadyBilled,
    unverifiedSkippedCount: unverifiedSkipped,
    lockedInvoiceSkippedCount: lockedInvoiceSkipped,
    agencyManagedSkippedCount: agencyManagedSkipped,
    rows,
  };
}

function findDraftInvoice(
  invoices: InvoiceRecord[],
  clientId: string,
  periodStart: string,
  periodEnd: string
): InvoiceRecord | undefined {
  const invoice = invoices.find(
    (inv) =>
      inv.clientId === clientId &&
      inv.periodStart === periodStart &&
      inv.periodEnd === periodEnd
  );
  return invoice?.status === "Draft" ? invoice : undefined;
}

export function generateInvoicesFromTimesheets(
  ctx: InvoiceGenerationContext,
  periodStart: string,
  periodEnd: string,
  actorName = "SuperUser"
): InvoiceGenerationResult {
  const { eligible, alreadyBilled, unverifiedSkipped, lockedInvoiceSkipped, agencyManagedSkipped } =
    collectEligibleLines(ctx, periodStart, periodEnd);
  const byClient = new Map<string, EligibleSourceLine[]>();

  for (const row of eligible) {
    const list = byClient.get(row.clientId) ?? [];
    list.push(row);
    byClient.set(row.clientId, list);
  }

  const created: InvoiceRecord[] = [];
  const updated: InvoiceRecord[] = [];
  let working = [...ctx.invoices];

  for (const [clientId, sourceLines] of byClient) {
    const client = ctx.clients.find((c) => c.id === clientId);
    const planType = planManagementForClient(client);
    const recipient = defaultInvoiceRecipient(client, planType);
    const existingDraft = findDraftInvoice(working, clientId, periodStart, periodEnd);

    sourceLines.sort((a, b) =>
      `${a.tsLine.shiftDate}${a.tsLine.startTime}`.localeCompare(
        `${b.tsLine.shiftDate}${b.tsLine.startTime}`
      )
    );

    const startLineNo = existingDraft ? existingDraft.lines.length + 1 : 1;
    const newLines = sourceLines.map((row, index) => {
      const booking = ctx.serviceBookings.find((b) => b.id === row.tsLine.serviceBookingId);
      const shift = ctx.rosterShifts.find((s) => s.id === row.tsLine.rosterShiftId);
      return buildInvoiceLine({
        lineNo: startLineNo + index,
        timesheet: row.timesheet,
        tsLine: row.tsLine,
        shift,
        client,
        booking,
        products: ctx.products,
        priceLists: ctx.priceLists,
      });
    });

    if (existingDraft) {
      const mergedLines = [...existingDraft.lines, ...newLines];
      const next = normalizeInvoice({
        ...existingDraft,
        lines: mergedLines,
        totalAmount: sumInvoiceLineAmount(mergedLines),
        updatedBy: actorName,
      });
      working = working.map((inv) => (inv.id === next.id ? next : inv));
      updated.push(next);
      continue;
    }

    const due = new Date(`${periodEnd}T12:00:00`);
    due.setDate(due.getDate() + 14);

    const next = createInvoice(
      {
        clientId,
        periodStart,
        periodEnd,
        status: "Draft",
        planManagementType: planType,
        totalAmount: sumInvoiceLineAmount(newLines),
        invoiceTo: recipient.invoiceTo,
        invoiceToEmail: recipient.invoiceToEmail,
        dueDate: due.toISOString().slice(0, 10),
        sentAt: "",
        paymentStatus: "Unpaid",
        paidAmount: 0,
        paymentReference: "",
        notes: "",
        lines: newLines,
        createdBy: actorName,
        updatedBy: actorName,
      },
      working
    );
    working = [...working, next];
    created.push(next);
  }

  return {
    created,
    updated,
    skippedAlreadyBilled: alreadyBilled,
    skippedUnverified: unverifiedSkipped,
    skippedLockedInvoice: lockedInvoiceSkipped,
    skippedAgencyManaged: agencyManagedSkipped,
  };
}
