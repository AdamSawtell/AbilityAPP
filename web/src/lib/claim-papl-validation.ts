import type { ClientRecord } from "@/lib/client";
import type { ClaimLine } from "@/lib/claim";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { getProductPrice } from "@/lib/product";
import type { ServiceBookingRecord } from "@/lib/service-booking";

const NDIS_ITEM_PATTERN = /^\d{2}_\d{3}_\d{4}_\d_\d$/;

export type ClaimLineValidation = {
  status: "pass" | "warning" | "error";
  messages: string[];
};

export function isValidNdisSupportItem(code: string): boolean {
  return NDIS_ITEM_PATTERN.test(code.trim());
}

export function validateClaimLine(params: {
  line: Omit<ClaimLine, "validationStatus" | "validationMessage">;
  client: ClientRecord | undefined;
  product: ProductRecord | undefined;
  priceList: PriceListRecord | undefined;
  booking: ServiceBookingRecord | undefined;
}): ClaimLineValidation {
  const { line, client, product, priceList, booking } = params;
  const messages: string[] = [];
  let status: ClaimLineValidation["status"] = "pass";

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
    warn("Product has no NDIS support item code — add one before submitting to PRODA.");
  } else if (!isValidNdisSupportItem(product.ndisSupportItem)) {
    warn("NDIS support item code format may be invalid for PAPL.");
  }

  if (!line.ndisSupportItem?.trim() && product?.ndisSupportItem) {
    // filled during generation
  } else if (line.ndisSupportItem?.trim() && !isValidNdisSupportItem(line.ndisSupportItem)) {
    warn("Line NDIS support item format may be invalid for PAPL.");
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
    warn("Client has no NDIS number — required before gateway submission.");
  }

  if (!line.serviceBookingId?.trim()) {
    warn("No service booking linked — NDIS claims should trace to an active booking.");
  } else if (booking) {
    if (booking.documentStatus === "Cancelled") {
      error("Service booking is cancelled.");
    }
    const bookingLine = booking.lines.find((l) => l.productId === line.productId);
    if (bookingLine && !bookingLine.readyToClaim) {
      warn("Booking line is not marked ready to claim — review before submit.");
    }
  }

  if (!line.rosterShiftId?.trim()) {
    warn("Line is not linked to a roster shift — verify service was delivered.");
  }

  return { status, messages };
}

export function applyLineValidation(
  line: ClaimLine,
  validation: ClaimLineValidation
): ClaimLine {
  return {
    ...line,
    validationStatus: validation.status,
    validationMessage: validation.messages.join(" "),
  };
}

export function claimHasBlockingErrors(lines: ClaimLine[]): boolean {
  return lines.some((line) => line.validationStatus === "error");
}

export function claimValidationSummary(lines: ClaimLine[]): {
  passCount: number;
  warningCount: number;
  errorCount: number;
  canSubmit: boolean;
} {
  const passCount = lines.filter((l) => l.validationStatus === "pass").length;
  const warningCount = lines.filter((l) => l.validationStatus === "warning").length;
  const errorCount = lines.filter((l) => l.validationStatus === "error").length;
  return {
    passCount,
    warningCount,
    errorCount,
    canSubmit: lines.length > 0 && errorCount === 0,
  };
}
