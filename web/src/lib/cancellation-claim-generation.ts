import { isAgencyManagedClient } from "@/lib/billing-plan-type";
import { evaluateCancellationPolicy } from "@/lib/booking-cancellation";
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
import type { ClientRecord } from "@/lib/client";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import type { ServiceBookingRecord } from "@/lib/service-booking";

export type CancellationClaimPreviewRow = {
  bookingId: string;
  documentNo: string;
  clientId: string;
  claimableAmount: number;
  claimablePercent: number;
  summary: string;
};

export type CancellationClaimPreview = {
  eligibleCount: number;
  totalClaimable: number;
  alreadyLinkedCount: number;
  rows: CancellationClaimPreviewRow[];
};

export type CancellationClaimResult = {
  created: ClaimRecord[];
  updated: ClaimRecord[];
  skippedAlreadyLinked: number;
  skippedNotClaimable: number;
};

export type CancellationClaimContext = {
  serviceBookings: ServiceBookingRecord[];
  claims: ClaimRecord[];
  clients: ClientRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
};

function bookingAlreadyOnClaim(bookingId: string, claims: ClaimRecord[]): boolean {
  return claims.some((claim) =>
    claim.lines.some((line) => line.serviceBookingId === bookingId && line.claimType === "Cancellation")
  );
}

function cancelledBookingsEligible(bookings: ServiceBookingRecord[]): ServiceBookingRecord[] {
  return bookings.filter((booking) => booking.documentStatus === "Cancelled" && booking.clientId?.trim());
}

export function previewCancellationClaims(ctx: CancellationClaimContext): CancellationClaimPreview {
  const rows: CancellationClaimPreviewRow[] = [];
  let alreadyLinkedCount = 0;

  for (const booking of cancelledBookingsEligible(ctx.serviceBookings)) {
    if (bookingAlreadyOnClaim(booking.id, ctx.claims)) {
      alreadyLinkedCount += 1;
      continue;
    }
    const client = ctx.clients.find((c) => c.id === booking.clientId);
    if (!isAgencyManagedClient(client)) continue;
    const policy = evaluateCancellationPolicy(booking);
    if (!policy || policy.claimableAmount <= 0) continue;
    rows.push({
      bookingId: booking.id,
      documentNo: booking.documentNo,
      clientId: booking.clientId,
      claimableAmount: policy.claimableAmount,
      claimablePercent: policy.claimablePercent,
      summary: policy.summary,
    });
  }

  return {
    eligibleCount: rows.length,
    totalClaimable: Math.round(rows.reduce((sum, row) => sum + row.claimableAmount, 0) * 100) / 100,
    alreadyLinkedCount,
    rows: rows.sort((a, b) => b.claimableAmount - a.claimableAmount),
  };
}

function buildCancellationClaimLine(
  booking: ServiceBookingRecord,
  lineNo: number,
  claimableAmount: number,
  products: ProductRecord[],
  priceLists: PriceListRecord[],
  client: ClientRecord | undefined
): ClaimLine {
  const bookingLine = booking.lines.find((line) => line.productId?.trim()) ?? booking.lines[0];
  const product = products.find((p) => p.id === bookingLine?.productId);
  const draft = emptyClaimLine(lineNo);
  draft.id = `cll-cancel-${booking.id}`;
  draft.serviceBookingId = booking.id;
  draft.clientId = booking.clientId;
  draft.productId = bookingLine?.productId ?? "";
  draft.ndisSupportItem = product?.ndisSupportItem ?? "";
  draft.supportCategory = product?.productCategory ?? "";
  draft.serviceDate = booking.cancelledAt?.slice(0, 10) || booking.startDate?.slice(0, 10) || "";
  draft.quantity = 1;
  draft.unitPrice = claimableAmount;
  draft.lineAmount = claimableAmount;
  draft.claimType = "Cancellation";

  const validation = validateClaimLine({
    line: draft,
    client,
    product,
    priceList: priceLists.find((pl) => pl.id === product?.priceListId) ?? priceLists[0],
    booking,
  });
  return applyLineValidation(draft, validation);
}

export function generateCancellationClaims(
  ctx: CancellationClaimContext,
  actor: string,
  existingClaims: ClaimRecord[]
): CancellationClaimResult {
  const preview = previewCancellationClaims(ctx);
  const created: ClaimRecord[] = [];
  const updated: ClaimRecord[] = [];
  let skippedAlreadyLinked = preview.alreadyLinkedCount;
  let working = [...existingClaims];

  for (const row of preview.rows) {
    const booking = ctx.serviceBookings.find((b) => b.id === row.bookingId);
    if (!booking) continue;
    const client = ctx.clients.find((c) => c.id === booking.clientId);
    const periodStart = booking.cancelledAt?.slice(0, 10) || booking.startDate || "";
    const periodEnd = periodStart;

    const existingDraft = working.find(
      (claim) =>
        claim.clientId === booking.clientId &&
        claim.periodStart === periodStart &&
        claim.periodEnd === periodEnd &&
        claim.status === "Draft"
    );

    if (existingDraft?.lines.some((line) => line.serviceBookingId === booking.id)) {
      skippedAlreadyLinked += 1;
      continue;
    }

    const startLineNo = existingDraft ? existingDraft.lines.length + 1 : 1;
    const claimLine = buildCancellationClaimLine(
      booking,
      startLineNo,
      row.claimableAmount,
      ctx.products,
      ctx.priceLists,
      client
    );

    if (existingDraft) {
      const mergedLines = [...existingDraft.lines, claimLine];
      const next = normalizeClaim({
        ...existingDraft,
        lines: mergedLines,
        totalAmount: sumClaimLineAmount(mergedLines),
        updatedBy: actor,
        notes: existingDraft.notes || "Includes cancellation claim lines.",
      });
      working = working.map((c) => (c.id === next.id ? next : c));
      const updatedIndex = updated.findIndex((c) => c.id === next.id);
      if (updatedIndex >= 0) {
        updated[updatedIndex] = next;
      } else {
        updated.push(next);
      }
      continue;
    }

    const next = createClaim(
      {
        clientId: booking.clientId,
        periodStart,
        periodEnd,
        status: "Draft",
        planManagementType: "Agency managed",
        totalAmount: sumClaimLineAmount([claimLine]),
        notes: `Cancellation claim for booking ${booking.documentNo}.`,
        lines: [claimLine],
        createdBy: actor,
        updatedBy: actor,
      },
      working
    );
    working.push(next);
    created.push(next);
  }

  const skippedNotClaimable =
    cancelledBookingsEligible(ctx.serviceBookings).length - preview.eligibleCount - skippedAlreadyLinked;

  return { created, updated, skippedAlreadyLinked, skippedNotClaimable };
}
