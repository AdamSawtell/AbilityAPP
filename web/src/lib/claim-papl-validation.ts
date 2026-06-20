import type { ClientRecord } from "@/lib/client";
import type { ClaimLine, ClaimRecord } from "@/lib/claim";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { getProductPrice } from "@/lib/product";
import type { ServiceBookingRecord } from "@/lib/service-booking";

const NDIS_ITEM_PATTERN = /^\d{2}_\d{3}_\d{4}_\d_\d$/;

export type ClaimValidationMode = "save" | "submit" | "gateway";

export type ClaimLineValidation = {
  status: "pass" | "warning" | "error";
  messages: string[];
};

export function isValidNdisSupportItem(code: string): boolean {
  return NDIS_ITEM_PATTERN.test(code.trim());
}

export function validateClaimLine(
  params: {
    line: Omit<ClaimLine, "validationStatus" | "validationMessage">;
    client: ClientRecord | undefined;
    product: ProductRecord | undefined;
    priceList: PriceListRecord | undefined;
    booking: ServiceBookingRecord | undefined;
  },
  mode: ClaimValidationMode = "save"
): ClaimLineValidation {
  const { line, client, product, priceList, booking } = params;
  const messages: string[] = [];
  let status: ClaimLineValidation["status"] = "pass";
  const strict = mode === "submit" || mode === "gateway";

  function error(message: string) {
    messages.push(message);
    status = "error";
  }

  function warn(message: string) {
    messages.push(message);
    if (status === "pass") status = "warning";
  }

  if (!line.quantity || line.quantity <= 0) {
    error("Quantity must be greater than zero.");
  }

  if (!line.productId?.trim()) {
    error("Product is required — link the shift to a service booking with a product line.");
  } else if (!product) {
    error("Product not found in catalog.");
  } else if (!product.active) {
    error("Product is inactive — choose an active NDIS support item.");
  } else if (!product.ndisSupportItem?.trim()) {
    if (strict) error("Product has no NDIS support item code.");
    else warn("Product has no NDIS support item code — add one before submitting to PRODA.");
  } else if (!isValidNdisSupportItem(product.ndisSupportItem)) {
    if (strict) error("NDIS support item code format is invalid for PAPL.");
    else warn("NDIS support item code format may be invalid for PAPL.");
  }

  if (line.ndisSupportItem?.trim() && !isValidNdisSupportItem(line.ndisSupportItem)) {
    if (strict) error("Line NDIS support item format is invalid for PAPL.");
    else warn("Line NDIS support item format may be invalid for PAPL.");
  }

  if (line.unitPrice <= 0) {
    error("Unit price must be greater than zero.");
  } else if (product && priceList) {
    const priceRow = getProductPrice(priceList, product.id);
    const limit = parseFloat(priceRow?.limitPrice ?? "0");
    if (limit > 0 && line.unitPrice > limit + 0.001) {
      error(`Unit price $${line.unitPrice.toFixed(2)} exceeds PAPL limit $${limit.toFixed(2)}.`);
    } else if (limit > 0 && line.unitPrice > parseFloat(priceRow?.standardPrice ?? "0") + 0.001) {
      warn(`Unit price is above standard PAPL rate ($${parseFloat(priceRow?.standardPrice ?? "0").toFixed(2)}).`);
    }
  }

  if (!client) {
    error("Client not found.");
  } else if (!client.fundingBodyNumber?.trim()) {
    if (strict) error("Client has no NDIS number — required before gateway submission.");
    else warn("Client has no NDIS number — required before gateway submission.");
  }

  if (!line.serviceBookingId?.trim()) {
    if (mode === "gateway") error("Service booking link is required for gateway submission.");
    else warn("No service booking linked — NDIS claims should trace to an active booking.");
  } else if (booking) {
    if (booking.documentStatus === "Cancelled") {
      error("Service booking is cancelled.");
    }
    const bookingLine = booking.lines.find((l) => l.productId === line.productId);
    if (bookingLine && !bookingLine.readyToClaim) {
      if (mode === "gateway") error("Booking line is not marked ready to claim.");
      else warn("Booking line is not marked ready to claim — review before submit.");
    }
  }

  if (!line.rosterShiftId?.trim()) {
    if (mode === "gateway") error("Roster shift link is required for gateway submission.");
    else warn("Line is not linked to a roster shift — verify service was delivered.");
  }

  if (!line.timesheetLineId?.trim() && mode === "gateway") {
    error("Timesheet line link is required for gateway submission.");
  }

  return { status, messages };
}

export function applyLineValidation(line: ClaimLine, validation: ClaimLineValidation): ClaimLine {
  return {
    ...line,
    validationStatus: validation.status,
    validationMessage: validation.messages.join(" "),
  };
}

export type ClaimValidationContext = {
  clients: ClientRecord[];
  serviceBookings: ServiceBookingRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
};

export function revalidateClaimRecord(
  record: ClaimRecord,
  ctx: ClaimValidationContext,
  mode: ClaimValidationMode = "save"
): ClaimRecord {
  const client = ctx.clients.find((c) => c.id === record.clientId);
  const lines = record.lines.map((line) => {
    const product = ctx.products.find((p) => p.id === line.productId);
    const booking = ctx.serviceBookings.find((b) => b.id === line.serviceBookingId);
    const priceList = ctx.priceLists.find((pl) => pl.id === product?.priceListId) ?? ctx.priceLists[0];
    const lineClient = ctx.clients.find((c) => c.id === line.clientId) ?? client;
    return applyLineValidation(
      line,
      validateClaimLine(
        { line, client: lineClient, product, priceList, booking },
        mode
      )
    );
  });
  return { ...record, lines };
}

export function claimHasBlockingErrors(lines: ClaimLine[]): boolean {
  return lines.some((line) => line.validationStatus === "error");
}

export function claimValidationSummary(lines: ClaimLine[]): {
  passCount: number;
  warningCount: number;
  errorCount: number;
  canSubmit: boolean;
  canGatewaySubmit: boolean;
} {
  const passCount = lines.filter((l) => l.validationStatus === "pass").length;
  const warningCount = lines.filter((l) => l.validationStatus === "warning").length;
  const errorCount = lines.filter((l) => l.validationStatus === "error").length;
  return {
    passCount,
    warningCount,
    errorCount,
    canSubmit: lines.length > 0 && errorCount === 0,
    canGatewaySubmit: lines.length > 0 && errorCount === 0 && warningCount === 0,
  };
}

export function claimSaveBlocked(
  before: ClaimRecord | undefined,
  after: ClaimRecord,
  ctx: ClaimValidationContext
): string | null {
  if (!after.lines.length) {
    return "Claim must have at least one line before saving.";
  }

  const validated = revalidateClaimRecord(after, ctx, "save");

  if (claimHasBlockingErrors(validated.lines)) {
    return "Fix PAPL validation errors before saving this claim.";
  }

  const wasSubmitted = before?.status === "Submitted" || before?.status === "Accepted";
  const nowSubmitted = after.status === "Submitted" || after.status === "Accepted";

  if (nowSubmitted && !wasSubmitted) {
    const submitCheck = revalidateClaimRecord(after, ctx, "submit");
    if (claimHasBlockingErrors(submitCheck.lines)) {
      return "Fix PAPL errors before marking this claim Submitted — use Submit to gateway when ready.";
    }
    if (!after.gatewayRef?.trim()) {
      return "Submit this claim through the NDIS gateway panel — manual Submitted status requires a gateway reference.";
    }
  }

  if (wasSubmitted && before) {
    const lockedFields: (keyof ClaimRecord)[] = [
      "clientId",
      "periodStart",
      "periodEnd",
      "planManagementType",
      "totalAmount",
      "gatewayStatus",
      "gatewayRef",
    ];
    for (const key of lockedFields) {
      if (String(before[key] ?? "") !== String(after[key] ?? "")) {
        return "Submitted claims are locked — only notes and rejection status can be edited.";
      }
    }
    if (JSON.stringify(before.lines) !== JSON.stringify(after.lines)) {
      return "Submitted claim lines cannot be edited.";
    }
  }

  return null;
}

export function claimGatewaySubmitBlocked(record: ClaimRecord, ctx: ClaimValidationContext): string | null {
  if (record.status !== "Draft") {
    return "Only Draft claims can be submitted to the gateway.";
  }
  if (!record.lines.length) {
    return "Claim has no lines to submit.";
  }
  const validated = revalidateClaimRecord(record, ctx, "gateway");
  if (claimHasBlockingErrors(validated.lines)) {
    return "Fix all PAPL validation errors before gateway submission.";
  }
  const summary = claimValidationSummary(validated.lines);
  if (!summary.canGatewaySubmit && summary.warningCount > 0) {
    return "Resolve PAPL warnings before gateway submission.";
  }
  return null;
}

export function claimRecordIsLocked(record: ClaimRecord): boolean {
  return record.status === "Submitted" || record.status === "Accepted";
}
