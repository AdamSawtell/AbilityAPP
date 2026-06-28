import type { ClaimRecord } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";
import type { InvoiceRecord } from "@/lib/invoice";
import { ndisImportHandoffRows } from "@/lib/ndis-price-import-engine";
import type { NdisPriceImportBatch, NdisPriceImportRow } from "@/lib/ndis-price-import";
import type { MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";
import {
  type PriceUpdateApplyStatus,
  type PriceUpdateClassification,
  type PriceUpdateDecision,
  type PriceUpdateEntityType,
  type PriceUpdateImpact,
  type PriceUpdateRun,
} from "@/lib/price-update";
import type { ProductRecord } from "@/lib/product";
import { getProductPrice, type PriceListRecord } from "@/lib/product";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import { sumPlannedAmounts } from "@/lib/service-agreement";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import type { TaskRecord } from "@/lib/task";

export type PriceChangeItem = {
  supportItemNumber: string;
  productId: string;
  region: string;
  oldPrice: number | null;
  newPrice: number | null;
  effectiveStart: string;
  effectiveEnd: string;
  priceType: string;
  quoteRequired: boolean;
  noSpecifiedPrice: boolean;
};

export type PriceUpdateAnalysisContext = {
  batch: NdisPriceImportBatch;
  importRows: NdisPriceImportRow[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  serviceBookings: ServiceBookingRecord[];
  clients: ClientRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  actorName: string;
};

function newId(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseMoney(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/[$,]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceDelta(oldPrice: number | null, newPrice: number | null) {
  if (oldPrice == null || newPrice == null) return { deltaAmount: null, deltaPercent: null };
  const deltaAmount = Number((newPrice - oldPrice).toFixed(4));
  const deltaPercent = oldPrice !== 0 ? Number(((deltaAmount / oldPrice) * 100).toFixed(2)) : null;
  return { deltaAmount, deltaPercent };
}

function isoOnOrAfter(date: string, effectiveStart: string): boolean {
  if (!date?.trim() || !effectiveStart?.trim()) return true;
  return date.slice(0, 10) >= effectiveStart.slice(0, 10);
}

function isoBefore(date: string, effectiveStart: string): boolean {
  if (!date?.trim() || !effectiveStart?.trim()) return false;
  return date.slice(0, 10) < effectiveStart.slice(0, 10);
}

function clientRegion(_client: ClientRecord | undefined): string {
  // Assumption: no Remote/Very Remote flag on client yet — default National and flag ambiguous in UI copy.
  return "National";
}

function productById(products: ProductRecord[], productId: string): ProductRecord | undefined {
  return products.find((product) => product.id === productId);
}

function clientById(clients: ClientRecord[], clientId: string): ClientRecord | undefined {
  return clients.find((client) => client.id === clientId);
}

function clientLabel(client: ClientRecord | undefined): string {
  if (!client) return "";
  return `${client.searchKey} — ${client.name}`;
}

export function buildPriceChangesFromImport(
  importRows: NdisPriceImportRow[],
  products: ProductRecord[],
  priceLists: PriceListRecord[],
  region = "National"
): PriceChangeItem[] {
  const handoff = ndisImportHandoffRows(importRows);
  const byKey = new Map<string, PriceChangeItem>();

  for (const row of handoff) {
    const normalized = row.normalized;
    if (!normalized?.supportItemNumber.trim()) continue;
    const rowRegion = normalized.region?.trim() || region;
    if (rowRegion !== region && rowRegion !== "National" && region !== "National") continue;

    const productId =
      row.matchedProductId ||
      products.find((product) => (product.ndisSupportItem ?? "").trim() === normalized.supportItemNumber.trim())?.id ||
      "";
    if (!productId) continue;

    const product = productById(products, productId);
    const list = priceLists.find((entry) => entry.id === product?.priceListId);
    const existingLine = getProductPrice(list, productId, {
      serviceDate: normalized.effectiveStart,
      region: rowRegion,
    });
    const oldPrice = normalized.previousPrice ?? parseMoney(existingLine?.listPrice) ?? parseMoney(row.matchedPriceLineId ? existingLine?.listPrice : null);
    const newPrice = normalized.price;
    const key = `${normalized.supportItemNumber}|${rowRegion}|${normalized.effectiveStart}`;
    const existing = byKey.get(key);
    if (existing && existing.newPrice === newPrice && existing.oldPrice === oldPrice) continue;

    if (oldPrice != null && newPrice != null && oldPrice === newPrice && normalized.action === "unchanged") continue;

    byKey.set(key, {
      supportItemNumber: normalized.supportItemNumber,
      productId,
      region: rowRegion,
      oldPrice,
      newPrice,
      effectiveStart: normalized.effectiveStart,
      effectiveEnd: normalized.effectiveEnd,
      priceType: normalized.priceType,
      quoteRequired: normalized.quoteRequired,
      noSpecifiedPrice: normalized.noSpecifiedPrice,
    });
  }

  return [...byKey.values()];
}

function classifyAgreement(status: string): PriceUpdateClassification {
  const key = status.trim();
  if (["Expired", "Terminated", "Cancelled"].includes(key)) return "protected";
  if (key === "Draft") return "safe_auto_update";
  if (key === "Sent") return "review_required";
  if (["Signed", "Active", "Expiring"].includes(key)) return "consent_required";
  return "review_required";
}

function classifyBooking(status: string, lineEndDate: string, effectiveStart: string): PriceUpdateClassification {
  if (["Completed", "Cancelled"].includes(status)) return "protected";
  if (isoBefore(lineEndDate, effectiveStart)) return "no_action";
  if (status === "Drafted") return "safe_auto_update";
  if (status === "In progress") return "review_required";
  return "review_required";
}

function classifyClaim(status: string, serviceDate: string, effectiveStart: string): PriceUpdateClassification {
  if (["Submitted", "Accepted", "Rejected"].includes(status)) return "protected";
  if (isoBefore(serviceDate, effectiveStart)) return "protected";
  return "review_required";
}

function classifyInvoice(status: string): PriceUpdateClassification {
  if (["Sent", "Paid", "Void"].includes(status)) return "protected";
  return "review_required";
}

function classifyMonthlyPlan(status: string, planMonth: string, effectiveStart: string): PriceUpdateClassification {
  if (["Approved", "Closed"].includes(status)) return "protected";
  const monthStart = `${planMonth}-01`;
  if (isoBefore(monthStart, effectiveStart)) return "protected";
  if (status === "Draft") return "safe_auto_update";
  return "review_required";
}

function classifyPlanBudget(): PriceUpdateClassification {
  return "review_required";
}

function recommendedActionFor(classification: PriceUpdateClassification, entityType: PriceUpdateEntityType): string {
  if (classification === "safe_auto_update") return "Update rate from effective date after confirmation";
  if (classification === "consent_required") return "Create variation task and record participant consent evidence before apply";
  if (classification === "review_required" && entityType === "plan-budget") {
    return "Review projected spend — funding totals are not changed automatically";
  }
  if (classification === "review_required") return "Review and approve before apply";
  if (classification === "protected") return "No mutation — historical or locked record";
  if (classification === "no_action") return "Service dates before effective start — no price change";
  return "Resolve blocker before apply";
}

function baseImpact(
  runId: string,
  entityType: PriceUpdateEntityType,
  entityId: string,
  entityLineId: string,
  clientId: string,
  clientName: string,
  productId: string,
  change: PriceChangeItem,
  recordLabel: string,
  recordStatus: string,
  classification: PriceUpdateClassification
): PriceUpdateImpact {
  const { deltaAmount, deltaPercent } = priceDelta(change.oldPrice, change.newPrice);
  return {
    id: newId("pui"),
    runId,
    entityType,
    entityId,
    entityLineId,
    clientId,
    clientName,
    productId,
    supportItemNumber: change.supportItemNumber,
    region: change.region,
    recordLabel,
    recordStatus,
    oldPrice: change.oldPrice,
    newPrice: change.newPrice,
    deltaAmount,
    deltaPercent,
    effectiveStart: change.effectiveStart,
    classification,
    recommendedAction: recommendedActionFor(classification, entityType),
    decision: "pending",
    decisionReason: "",
    approvedBy: "",
    approvedAt: "",
    evidenceRef: "",
    applyStatus: classification === "protected" || classification === "no_action" ? "protected" : "pending",
    applyMessage: "",
    taskId: "",
  };
}

function changeForProduct(changes: PriceChangeItem[], productId: string, region: string): PriceChangeItem | undefined {
  return (
    changes.find((change) => change.productId === productId && change.region === region) ||
    changes.find((change) => change.productId === productId && change.region === "National")
  );
}

function pricesDiffer(oldPrice: number | null, newPrice: number | null): boolean {
  if (oldPrice == null || newPrice == null) return oldPrice !== newPrice;
  return Math.abs(oldPrice - newPrice) > 0.001;
}

export function analysePriceUpdateRun(
  run: PriceUpdateRun,
  context: PriceUpdateAnalysisContext
): { run: PriceUpdateRun; impacts: PriceUpdateImpact[] } {
  const region = clientRegion(undefined);
  const changes = buildPriceChangesFromImport(context.importRows, context.products, context.priceLists, region);
  const effectiveStart =
    run.effectiveStart ||
    changes.map((change) => change.effectiveStart).filter(Boolean).sort()[0] ||
    context.batch.guideYear === "2026-27"
      ? "2026-07-01"
      : "2025-07-01";

  const impacts: PriceUpdateImpact[] = [];
  let scanned = 0;

  for (const agreement of context.serviceAgreements) {
    const client = clientById(context.clients, agreement.clientId);
    for (const line of agreement.lines) {
      scanned += 1;
      const change = changeForProduct(changes, line.productId, region);
      if (!change) continue;
      const current = parseMoney(line.plannedPrice);
      if (!pricesDiffer(current, change.newPrice)) continue;
      const classification = classifyAgreement(agreement.status);
      impacts.push(
        baseImpact(
          run.id,
          "service-agreement",
          agreement.id,
          line.id,
          agreement.clientId,
          clientLabel(client),
          line.productId,
          { ...change, oldPrice: current ?? change.oldPrice },
          `${agreement.searchKey} — ${line.name || line.description}`,
          agreement.status,
          classification
        )
      );
    }
  }

  for (const booking of context.serviceBookings) {
    const client = clientById(context.clients, booking.clientId);
    for (const line of booking.lines) {
      scanned += 1;
      const change = changeForProduct(changes, line.productId, region);
      if (!change) continue;
      const current = parseMoney(line.price);
      if (!pricesDiffer(current, change.newPrice)) continue;
      const classification = classifyBooking(booking.documentStatus, line.endDate || booking.endDate, effectiveStart);
      if (classification === "no_action") continue;
      impacts.push(
        baseImpact(
          run.id,
          "service-booking",
          booking.id,
          line.id,
          booking.clientId,
          clientLabel(client),
          line.productId,
          { ...change, oldPrice: current ?? change.oldPrice },
          `${booking.documentNo} — line ${line.lineNo}`,
          booking.documentStatus,
          classification
        )
      );
    }
  }

  for (const client of context.clients) {
    for (const budget of client.planBudgets ?? []) {
      scanned += 1;
      const change = changes.find(
        (entry) => entry.supportItemNumber.trim() === (budget.ndisLineItemRef ?? "").trim()
      );
      if (!change) continue;
      const classification = classifyPlanBudget();
      impacts.push(
        baseImpact(
          run.id,
          "plan-budget",
          client.id,
          budget.id,
          client.id,
          clientLabel(client),
          change.productId,
          change,
          `${client.searchKey} plan budget — ${budget.supportCategory}`,
          "Current",
          classification
        )
      );
    }
  }

  for (const plan of context.monthlyServicePlans) {
    const client = clientById(context.clients, plan.clientId);
    for (const line of plan.lines) {
      scanned += 1;
      const budget = client?.planBudgets?.find((row) => row.id === line.planBudgetLineId);
      const supportItem = budget?.ndisLineItemRef ?? "";
      const change = changes.find((entry) => entry.supportItemNumber.trim() === supportItem.trim());
      if (!change) continue;
      const current = line.plannedAmount;
      const projected = line.plannedHours > 0 && change.newPrice != null ? line.plannedHours * change.newPrice : current;
      if (!pricesDiffer(current, projected)) continue;
      const classification = classifyMonthlyPlan(plan.status, plan.planMonth, effectiveStart);
      impacts.push(
        baseImpact(
          run.id,
          "monthly-service-plan",
          plan.id,
          line.id,
          plan.clientId,
          clientLabel(client),
          change.productId,
          { ...change, oldPrice: current, newPrice: projected },
          `${formatPlanMonth(plan.planMonth)} — ${line.description || line.supportCategory}`,
          plan.status,
          classification
        )
      );
    }
  }

  for (const claim of context.claims) {
    const client = clientById(context.clients, claim.clientId);
    for (const line of claim.lines) {
      scanned += 1;
      const change = changeForProduct(changes, line.productId, region);
      if (!change) continue;
      if (!pricesDiffer(line.unitPrice, change.newPrice)) continue;
      const classification = classifyClaim(claim.status, line.serviceDate, effectiveStart);
      impacts.push(
        baseImpact(
          run.id,
          "claim",
          claim.id,
          line.id,
          claim.clientId,
          clientLabel(client),
          line.productId,
          { ...change, oldPrice: line.unitPrice },
          `${claim.documentNo} — ${line.serviceDate}`,
          claim.status,
          classification
        )
      );
    }
  }

  for (const invoice of context.invoices) {
    const client = clientById(context.clients, invoice.clientId);
    for (const line of invoice.lines) {
      scanned += 1;
      const change = changeForProduct(changes, line.productId, region);
      if (!change) continue;
      if (!pricesDiffer(line.unitPrice, change.newPrice)) continue;
      const classification = classifyInvoice(invoice.status);
      impacts.push(
        baseImpact(
          run.id,
          "invoice",
          invoice.id,
          line.id,
          invoice.clientId,
          clientLabel(client),
          line.productId,
          { ...change, oldPrice: line.unitPrice },
          `${invoice.documentNo} — line ${line.lineNo}`,
          invoice.status,
          classification
        )
      );
    }
  }

  const counts = summarizeImpacts(impacts);
  const nextRun: PriceUpdateRun = {
    ...run,
    status: "analysed",
    effectiveStart,
    guideYear: context.batch.guideYear,
    scannedCount: scanned,
    impactCount: impacts.length,
    ...counts,
  };

  return { run: nextRun, impacts };
}

function formatPlanMonth(planMonth: string): string {
  if (!/^\d{4}-\d{2}$/.test(planMonth)) return planMonth;
  const [year, month] = planMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function summarizeImpacts(impacts: PriceUpdateImpact[]) {
  const count = (classification: PriceUpdateClassification) =>
    impacts.filter((impact) => impact.classification === classification).length;
  return {
    safeCount: count("safe_auto_update"),
    reviewCount: count("review_required"),
    consentCount: count("consent_required"),
    protectedCount: count("protected") + count("no_action"),
    blockedCount: count("blocked"),
    appliedCount: impacts.filter((impact) => impact.applyStatus === "applied").length,
  };
}

export function canApplyImpact(impact: PriceUpdateImpact): boolean {
  if (impact.applyStatus === "applied" || impact.applyStatus === "protected" || impact.applyStatus === "skipped") return false;
  if (impact.classification === "protected" || impact.classification === "no_action" || impact.classification === "blocked") {
    return false;
  }
  if (impact.entityType === "plan-budget") return false;
  if (impact.classification === "consent_required") {
    return impact.decision === "approved" && Boolean(impact.evidenceRef.trim());
  }
  if (impact.classification === "review_required") {
    return impact.decision === "approved";
  }
  return impact.decision === "approved" || impact.classification === "safe_auto_update";
}

export function approveSafeImpacts(impacts: PriceUpdateImpact[]): PriceUpdateImpact[] {
  return impacts.map((impact) =>
    impact.classification === "safe_auto_update" && impact.decision === "pending"
      ? { ...impact, decision: "approved" as PriceUpdateDecision }
      : impact
  );
}

export type PriceUpdateApplyContext = PriceUpdateAnalysisContext & {
  run: PriceUpdateRun;
  impacts: PriceUpdateImpact[];
};

export type PriceUpdateApplyResult = {
  run: PriceUpdateRun;
  impacts: PriceUpdateImpact[];
  serviceAgreements: ServiceAgreementRecord[];
  serviceBookings: ServiceBookingRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  changedAgreementIds: string[];
  changedBookingIds: string[];
  changedMonthlyPlanIds: string[];
  changedClaimIds: string[];
  changedInvoiceIds: string[];
};

function bookingGrandTotal(lines: ServiceBookingRecord["lines"]): string {
  const total = lines.reduce((sum, line) => sum + (parseMoney(line.lineAmount) ?? 0), 0);
  return total.toFixed(2);
}

function claimTotal(lines: ClaimRecord["lines"]): number {
  return lines.reduce((sum, line) => sum + (line.lineAmount ?? 0), 0);
}

function invoiceTotal(lines: InvoiceRecord["lines"]): number {
  return lines.reduce((sum, line) => sum + (line.lineAmount ?? 0), 0);
}

export function applyApprovedPriceUpdates(context: PriceUpdateApplyContext): PriceUpdateApplyResult {
  const agreements = [...context.serviceAgreements];
  const bookings = [...context.serviceBookings];
  const monthlyPlans = [...context.monthlyServicePlans];
  const claims = [...context.claims];
  const invoices = [...context.invoices];
  const changedAgreementIds = new Set<string>();
  const changedBookingIds = new Set<string>();
  const changedMonthlyPlanIds = new Set<string>();
  const changedClaimIds = new Set<string>();
  const changedInvoiceIds = new Set<string>();

  // Re-validate eligibility against the record's *current* status at apply time.
  // Classifications were captured at analysis time, so a record that became
  // Signed/Active, Submitted, or Sent in between must not be price-mutated even
  // if it was approved while still a draft. Returns a skipped impact when the
  // live status no longer permits the approved action, otherwise null.
  const blockedByStatusChange = (
    impact: PriceUpdateImpact,
    currentClassification: PriceUpdateClassification,
    currentStatus: string
  ): PriceUpdateImpact | null => {
    if (canApplyImpact({ ...impact, classification: currentClassification })) return null;
    return {
      ...impact,
      applyStatus: "skipped" as PriceUpdateApplyStatus,
      applyMessage: `Record status changed to "${currentStatus}" since analysis — re-review required before applying.`,
    };
  };

  const nextImpacts: PriceUpdateImpact[] = context.impacts.map((impact) => {
    if (!canApplyImpact(impact)) return impact;
    if (impact.newPrice == null) {
      return { ...impact, applyStatus: "error" as PriceUpdateApplyStatus, applyMessage: "No fixed new price to apply." };
    }
    const effectiveStart = impact.effectiveStart || context.run.effectiveStart;

    if (impact.entityType === "service-agreement") {
      const agreement = agreements.find((entry) => entry.id === impact.entityId);
      if (!agreement) {
        return { ...impact, applyStatus: "error", applyMessage: "Service agreement not found." };
      }
      const blocked = blockedByStatusChange(impact, classifyAgreement(agreement.status), agreement.status);
      if (blocked) return blocked;
      const lines = agreement.lines.map((line) => {
        if (line.id !== impact.entityLineId) return line;
        return { ...line, plannedPrice: impact.newPrice!.toFixed(2) };
      });
      const updated = {
        ...agreement,
        lines,
        totalPlannedAmount: sumPlannedAmounts(lines),
        updatedBy: context.actorName,
      };
      const index = agreements.findIndex((entry) => entry.id === agreement.id);
      agreements[index] = updated;
      changedAgreementIds.add(agreement.id);
      return {
        ...impact,
        applyStatus: "applied" as PriceUpdateApplyStatus,
        applyMessage: `Planned price updated to ${impact.newPrice!.toFixed(2)}.`,
      };
    }

    if (impact.entityType === "service-booking") {
      const booking = bookings.find((entry) => entry.id === impact.entityId);
      if (!booking) return { ...impact, applyStatus: "error", applyMessage: "Service booking not found." };
      const currentLine = booking.lines.find((entry) => entry.id === impact.entityLineId);
      const blocked = blockedByStatusChange(
        impact,
        classifyBooking(booking.documentStatus, currentLine?.endDate || booking.endDate, effectiveStart),
        booking.documentStatus
      );
      if (blocked) return blocked;
      const lines = booking.lines.map((line) => {
        if (line.id !== impact.entityLineId) return line;
        const qty = parseMoney(line.orderedQuantity) ?? 1;
        const amount = qty * impact.newPrice!;
        return { ...line, price: impact.newPrice!.toFixed(2), lineAmount: amount.toFixed(2) };
      });
      const updated = {
        ...booking,
        lines,
        grandTotal: bookingGrandTotal(lines),
        totalLines: bookingGrandTotal(lines),
        updatedBy: context.actorName,
      };
      bookings[bookings.findIndex((entry) => entry.id === booking.id)] = updated;
      changedBookingIds.add(booking.id);
      return { ...impact, applyStatus: "applied", applyMessage: `Booking line rate updated to ${impact.newPrice!.toFixed(2)}.` };
    }

    if (impact.entityType === "monthly-service-plan") {
      const plan = monthlyPlans.find((entry) => entry.id === impact.entityId);
      if (!plan) return { ...impact, applyStatus: "error", applyMessage: "Monthly service plan not found." };
      const blocked = blockedByStatusChange(
        impact,
        classifyMonthlyPlan(plan.status, plan.planMonth, effectiveStart),
        plan.status
      );
      if (blocked) return blocked;
      const lines = plan.lines.map((line) => {
        if (line.id !== impact.entityLineId) return line;
        return { ...line, plannedAmount: impact.newPrice! };
      });
      const updated = { ...plan, lines, updatedBy: context.actorName };
      monthlyPlans[monthlyPlans.findIndex((entry) => entry.id === plan.id)] = updated;
      changedMonthlyPlanIds.add(plan.id);
      return { ...impact, applyStatus: "applied", applyMessage: `Planned amount recalculated to ${impact.newPrice!.toFixed(2)}.` };
    }

    if (impact.entityType === "claim") {
      const claim = claims.find((entry) => entry.id === impact.entityId);
      if (!claim) return { ...impact, applyStatus: "error", applyMessage: "Claim not found." };
      const currentClaimLine = claim.lines.find((entry) => entry.id === impact.entityLineId);
      const blocked = blockedByStatusChange(
        impact,
        classifyClaim(claim.status, currentClaimLine?.serviceDate ?? "", effectiveStart),
        claim.status
      );
      if (blocked) return blocked;
      const lines = claim.lines.map((line) => {
        if (line.id !== impact.entityLineId) return line;
        const amount = line.quantity * impact.newPrice!;
        return { ...line, unitPrice: impact.newPrice!, lineAmount: amount };
      });
      const updated = { ...claim, lines, totalAmount: claimTotal(lines), updatedBy: context.actorName };
      claims[claims.findIndex((entry) => entry.id === claim.id)] = updated;
      changedClaimIds.add(claim.id);
      return { ...impact, applyStatus: "applied", applyMessage: `Draft claim unit price updated.` };
    }

    if (impact.entityType === "invoice") {
      const invoice = invoices.find((entry) => entry.id === impact.entityId);
      if (!invoice) return { ...impact, applyStatus: "error", applyMessage: "Invoice not found." };
      const blocked = blockedByStatusChange(impact, classifyInvoice(invoice.status), invoice.status);
      if (blocked) return blocked;
      const lines = invoice.lines.map((line) => {
        if (line.id !== impact.entityLineId) return line;
        const amount = line.quantity * impact.newPrice!;
        return { ...line, unitPrice: impact.newPrice!, lineAmount: amount };
      });
      const updated = { ...invoice, lines, totalAmount: invoiceTotal(lines), updatedBy: context.actorName };
      invoices[invoices.findIndex((entry) => entry.id === invoice.id)] = updated;
      changedInvoiceIds.add(invoice.id);
      return { ...impact, applyStatus: "applied", applyMessage: `Draft invoice unit price updated.` };
    }

    return { ...impact, applyStatus: "skipped", applyMessage: "Record type not applied in this slice." };
  });

  const run: PriceUpdateRun = {
    ...context.run,
    status: "applied",
    appliedBy: context.actorName,
    appliedAt: new Date().toISOString(),
    ...summarizeImpacts(nextImpacts),
  };

  return {
    run,
    impacts: nextImpacts,
    serviceAgreements: agreements,
    serviceBookings: bookings,
    monthlyServicePlans: monthlyPlans,
    claims,
    invoices,
    changedAgreementIds: [...changedAgreementIds],
    changedBookingIds: [...changedBookingIds],
    changedMonthlyPlanIds: [...changedMonthlyPlanIds],
    changedClaimIds: [...changedClaimIds],
    changedInvoiceIds: [...changedInvoiceIds],
  };
}

export function buildVariationTaskPartial(
  impact: PriceUpdateImpact,
  actorUserId: string,
  actorName: string
): Omit<TaskRecord, "id" | "documentNo" | "updates"> {
  return {
    title: "NDIS price variation review",
    description: `Review NDIS price change for ${impact.supportItemNumber} on ${impact.recordLabel}. Old ${impact.oldPrice?.toFixed(2) ?? "—"} → new ${impact.newPrice?.toFixed(2) ?? "—"} from ${impact.effectiveStart}. Participant consent required before applying to active/signed agreements.`,
    status: "Open",
    taskTypeId: "tt-review",
    priority: "High",
    dueDate: "",
    assignmentType: "role",
    assigneeUserId: "",
    assigneeRoleId: "role-coordinator",
    entityType: impact.entityType === "service-agreement" ? "service-agreement" : "client",
    entityId: impact.entityType === "service-agreement" ? impact.entityId : impact.clientId,
    entityLabel: impact.recordLabel,
    createdByUserId: actorUserId,
    createdBy: actorName,
    updatedBy: actorName,
    completedBy: "",
    completedAt: "",
    resolutionNotes: "",
  };
}

export function unresolvedImpactCount(impacts: PriceUpdateImpact[]): number {
  return impacts.filter((impact) => {
    if (impact.classification === "protected" || impact.classification === "no_action") return false;
    if (impact.applyStatus === "applied") return false;
    if (impact.decision === "ignored") return false;
    return true;
  }).length;
}

export function createEmptyRun(batch: NdisPriceImportBatch, actorName: string): PriceUpdateRun {
  return {
    id: newId("pur"),
    sourceImportBatchId: batch.id,
    status: "draft",
    effectiveStart: "",
    guideYear: batch.guideYear,
    createdBy: actorName,
    createdAt: new Date().toISOString(),
    appliedBy: "",
    appliedAt: "",
    closedBy: "",
    closedAt: "",
    scannedCount: 0,
    impactCount: 0,
    safeCount: 0,
    reviewCount: 0,
    consentCount: 0,
    protectedCount: 0,
    blockedCount: 0,
    appliedCount: 0,
    notes: "",
  };
}

export function impactsToCsv(impacts: PriceUpdateImpact[]): string {
  const headers = [
    "entityType",
    "recordLabel",
    "clientName",
    "supportItemNumber",
    "oldPrice",
    "newPrice",
    "deltaAmount",
    "deltaPercent",
    "effectiveStart",
    "classification",
    "decision",
    "applyStatus",
  ];
  const rows = impacts.map((impact) =>
    [
      impact.entityType,
      impact.recordLabel,
      impact.clientName,
      impact.supportItemNumber,
      impact.oldPrice ?? "",
      impact.newPrice ?? "",
      impact.deltaAmount ?? "",
      impact.deltaPercent ?? "",
      impact.effectiveStart,
      impact.classification,
      impact.decision,
      impact.applyStatus,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
