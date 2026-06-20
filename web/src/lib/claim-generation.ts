import type { ClientRecord } from "@/lib/client";
import {
  applyLineValidation,
  validateClaimLine,
} from "@/lib/claim-papl-validation";
import {
  createClaim,
  emptyClaimLine,
  normalizeClaim,
  sumClaimLineAmount,
  type ClaimLine,
  type ClaimRecord,
} from "@/lib/claim";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { getProductPrice } from "@/lib/product";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import type { TimesheetLine, TimesheetRecord } from "@/lib/timesheet";
import { verifyTimesheet } from "@/lib/timesheet-verification";
import type { LocationRecord } from "@/lib/location";

export type ClaimGenerationPreviewRow = {
  clientId: string;
  lineCount: number;
  totalAmount: number;
  verifiedLineCount: number;
};

export type ClaimGenerationPreview = {
  periodStart: string;
  periodEnd: string;
  eligibleLineCount: number;
  alreadyClaimedCount: number;
  unverifiedSkippedCount: number;
  lockedClaimSkippedCount: number;
  rows: ClaimGenerationPreviewRow[];
};

export type ClaimGenerationResult = {
  created: ClaimRecord[];
  updated: ClaimRecord[];
  skippedAlreadyClaimed: number;
  skippedUnverified: number;
  skippedLockedClaim: number;
};

export type ClaimGenerationContext = {
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
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

export function linkedTimesheetLineIds(claims: ClaimRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const claim of claims) {
    for (const line of claim.lines) {
      if (line.timesheetLineId?.trim()) ids.add(line.timesheetLineId);
    }
  }
  return ids;
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

function planManagementForClient(client: ClientRecord | undefined): string {
  const funding = client?.fundingBody?.trim().toLowerCase() ?? "";
  if (funding.includes("self")) return "Self managed";
  if (funding.includes("plan")) return "Plan managed";
  return "Agency managed";
}

function buildClaimLine(params: {
  lineNo: number;
  timesheet: TimesheetRecord;
  tsLine: TimesheetLine;
  shift: RosterShiftRecord | undefined;
  client: ClientRecord | undefined;
  booking: ServiceBookingRecord | undefined;
  products: ProductRecord[];
  priceLists: PriceListRecord[];
}): ClaimLine {
  const { lineNo, timesheet, tsLine, shift, client, booking, products, priceLists } = params;
  const bookingLine = resolveBookingLine(booking, tsLine.shiftDate);
  const productId = bookingLine?.productId ?? "";
  const product = products.find((p) => p.id === productId);
  const unitPrice = bookingLine?.price
    ? parseFloat(bookingLine.price) || resolveProductPrice(productId, priceLists, products)
    : resolveProductPrice(productId, priceLists, products);
  const quantity = tsLine.hours ?? 0;
  const lineAmount = Math.round(quantity * unitPrice * 100) / 100;

  const draft = emptyClaimLine(lineNo);
  draft.id = `cll-${tsLine.id}`;
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
  draft.claimType = bookingLine?.claimType || "Standard";

  const validation = validateClaimLine({
    line: draft,
    client,
    product,
    priceList: priceLists.find((pl) => pl.id === product?.priceListId) ?? priceLists[0],
    booking,
  });
  return applyLineValidation(draft, validation);
}

type EligibleSourceLine = {
  timesheet: TimesheetRecord;
  tsLine: TimesheetLine;
  clientId: string;
};

function lockedClaimClientIds(
  claims: ClaimRecord[],
  periodStart: string,
  periodEnd: string
): Set<string> {
  return new Set(
    claims
      .filter(
        (c) =>
          c.periodStart === periodStart &&
          c.periodEnd === periodEnd &&
          c.status !== "Draft" &&
          c.clientId?.trim()
      )
      .map((c) => c.clientId)
  );
}

function collectEligibleLines(
  ctx: ClaimGenerationContext,
  periodStart: string,
  periodEnd: string
): {
  eligible: EligibleSourceLine[];
  alreadyClaimed: number;
  unverifiedSkipped: number;
  lockedClaimSkipped: number;
} {
  const linked = linkedTimesheetLineIds(ctx.claims);
  const lockedClients = lockedClaimClientIds(ctx.claims, periodStart, periodEnd);
  const eligible: EligibleSourceLine[] = [];
  let alreadyClaimed = 0;
  let unverifiedSkipped = 0;
  let lockedClaimSkipped = 0;

  for (const timesheet of ctx.timesheets) {
    if (timesheet.status !== "Approved") continue;
    const verification = verifyTimesheet(timesheet, ctx.rosterShifts, ctx.locations);
    const verifiedLineIds = new Set(
      verification.lines.filter((l) => l.status === "verified").map((l) => l.lineId)
    );

    for (const tsLine of timesheet.lines) {
      if (!lineInPeriod(tsLine, periodStart, periodEnd)) continue;
      if (!tsLine.clientId?.trim()) continue;
      if (lockedClients.has(tsLine.clientId)) {
        lockedClaimSkipped += 1;
        continue;
      }
      if (linked.has(tsLine.id)) {
        alreadyClaimed += 1;
        continue;
      }
      if (!verifiedLineIds.has(tsLine.id)) {
        unverifiedSkipped += 1;
        continue;
      }
      eligible.push({ timesheet, tsLine, clientId: tsLine.clientId });
    }
  }

  return { eligible, alreadyClaimed, unverifiedSkipped, lockedClaimSkipped };
}

export function previewClaimGeneration(
  ctx: ClaimGenerationContext,
  periodStart: string,
  periodEnd: string
): ClaimGenerationPreview {
  const { eligible, alreadyClaimed, unverifiedSkipped, lockedClaimSkipped } = collectEligibleLines(
    ctx,
    periodStart,
    periodEnd
  );
  const byClient = new Map<string, { lineCount: number; totalAmount: number }>();

  for (const row of eligible) {
    const client = ctx.clients.find((c) => c.id === row.clientId);
    const booking = ctx.serviceBookings.find((b) => b.id === row.tsLine.serviceBookingId);
    const shift = ctx.rosterShifts.find((s) => s.id === row.tsLine.rosterShiftId);
    const claimLine = buildClaimLine({
      lineNo: 1,
      timesheet: row.timesheet,
      tsLine: row.tsLine,
      shift,
      client,
      booking,
      products: ctx.products,
      priceLists: ctx.priceLists,
    });
    const stats = byClient.get(row.clientId) ?? { lineCount: 0, totalAmount: 0 };
    stats.lineCount += 1;
    stats.totalAmount = Math.round((stats.totalAmount + claimLine.lineAmount) * 100) / 100;
    byClient.set(row.clientId, stats);
  }

  const rows = [...byClient.entries()]
    .map(([clientId, stats]) => ({
      clientId,
      verifiedLineCount: stats.lineCount,
      lineCount: stats.lineCount,
      totalAmount: stats.totalAmount,
    }))
    .sort((a, b) => a.clientId.localeCompare(b.clientId));

  return {
    periodStart,
    periodEnd,
    eligibleLineCount: eligible.length,
    alreadyClaimedCount: alreadyClaimed,
    unverifiedSkippedCount: unverifiedSkipped,
    lockedClaimSkippedCount: lockedClaimSkipped,
    rows,
  };
}

function findDraftClaim(
  claims: ClaimRecord[],
  clientId: string,
  periodStart: string,
  periodEnd: string
): ClaimRecord | undefined {
  const claim = claims.find(
    (c) =>
      c.clientId === clientId &&
      c.periodStart === periodStart &&
      c.periodEnd === periodEnd
  );
  return claim?.status === "Draft" ? claim : undefined;
}

export function generateClaimsFromTimesheets(
  ctx: ClaimGenerationContext,
  periodStart: string,
  periodEnd: string,
  actorName = "SuperUser"
): ClaimGenerationResult {
  const { eligible, alreadyClaimed, unverifiedSkipped, lockedClaimSkipped } = collectEligibleLines(
    ctx,
    periodStart,
    periodEnd
  );
  const byClient = new Map<string, EligibleSourceLine[]>();

  for (const row of eligible) {
    const list = byClient.get(row.clientId) ?? [];
    list.push(row);
    byClient.set(row.clientId, list);
  }

  const created: ClaimRecord[] = [];
  const updated: ClaimRecord[] = [];
  let working = [...ctx.claims];

  for (const [clientId, sourceLines] of byClient) {
    const client = ctx.clients.find((c) => c.id === clientId);
    const existingDraft = findDraftClaim(working, clientId, periodStart, periodEnd);

    sourceLines.sort((a, b) =>
      `${a.tsLine.shiftDate}${a.tsLine.startTime}`.localeCompare(
        `${b.tsLine.shiftDate}${b.tsLine.startTime}`
      )
    );

    const startLineNo = existingDraft ? existingDraft.lines.length + 1 : 1;
    const newLines = sourceLines.map((row, index) => {
      const booking = ctx.serviceBookings.find((b) => b.id === row.tsLine.serviceBookingId);
      const shift = ctx.rosterShifts.find((s) => s.id === row.tsLine.rosterShiftId);
      return buildClaimLine({
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
      const next = normalizeClaim({
        ...existingDraft,
        lines: mergedLines,
        totalAmount: sumClaimLineAmount(mergedLines),
        updatedBy: actorName,
      });
      working = working.map((c) => (c.id === next.id ? next : c));
      updated.push(next);
      continue;
    }

    const next = createClaim(
      {
        clientId,
        periodStart,
        periodEnd,
        status: "Draft",
        planManagementType: planManagementForClient(client),
        totalAmount: sumClaimLineAmount(newLines),
        gatewayStatus: "Not submitted",
        gatewayRef: "",
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
    skippedAlreadyClaimed: alreadyClaimed,
    skippedUnverified: unverifiedSkipped,
    skippedLockedClaim: lockedClaimSkipped,
  };
}
