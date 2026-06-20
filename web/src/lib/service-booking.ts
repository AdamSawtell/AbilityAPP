import { DEFAULT_CANCELLATION_NOTICE_DAYS, normalizeCancellationFields } from "@/lib/booking-cancellation";
import { newLineId } from "@/lib/client-line-tables";

/** Service Booking Line — AbilityERP tab "Service Booking Line". */
export type ServiceBookingLine = {
  id: string;
  lineNo: number;
  manualHold: boolean;
  readyToClaim: boolean;
  orderedQuantity: string;
  quantityInvoiced: string;
  datePromised: string;
  productId: string;
  claimType: string;
  useTimeBasedQuantity: boolean;
  startDate: string;
  endDate: string;
  uom: string;
  price: string;
  lineAmount: string;
};

/** Service Booking header — AbilityERP document (not a single shift). */
export type ServiceBookingRecord = {
  id: string;
  documentNo: string;
  organization: string;
  description: string;
  targetDocumentType: string;
  isTemplate: boolean;
  readyToClaimRule: string;
  programOfSupports: boolean;
  dateOrdered: string;
  datePromised: string;
  startDate: string;
  endDate: string;
  clientId: string;
  invoicePartner: string;
  serviceAgreementId: string;
  bookingGeneratorRef: string;
  totalLines: string;
  grandTotal: string;
  documentStatus: string;
  cancellationNoticeDays: number;
  cancelledAt: string;
  cancellationInitiatedBy: string;
  cancellationReason: string;
  cancellationNotes: string;
  createdBy: string;
  updatedBy: string;
  lines: ServiceBookingLine[];
};

export const serviceBookingTabs = ["Overview", "Lines"] as const;

export const serviceBookingDropdowns = {
  targetDocumentType: ["Service Booking - Standard", "Service Booking - Template"],
  readyToClaimRule: ["Manual Tick", "Automatic", "On completion"],
  documentStatus: ["Drafted", "In progress", "Completed", "Cancelled"],
  uom: ["Week", "Hour", "Day", "Each", "Month"],
  claimType: ["", "Standard", "Non-face-to-face", "Provider travel"],
  cancellationInitiatedBy: ["Participant", "Provider", "NDIA", "Mutual agreement"],
};

export const initialServiceBookings: ServiceBookingRecord[] = [
  {
    id: "sb-50145",
    documentNo: "50145",
    organization: "AbilityERP",
    description: "Part 1",
    targetDocumentType: "Service Booking - Standard",
    isTemplate: false,
    readyToClaimRule: "Manual Tick",
    programOfSupports: false,
    dateOrdered: "2025-10-01",
    datePromised: "2025-10-12",
    startDate: "2025-09-29",
    endDate: "2025-10-12",
    clientId: "bp-bern",
    invoicePartner: "NDIS - National Disability Insurance Scheme",
    serviceAgreementId: "sa-rose-ni",
    bookingGeneratorRef: "BERN_SIL",
    totalLines: "10907.80",
    grandTotal: "10907.80",
    documentStatus: "Drafted",
    cancellationNoticeDays: DEFAULT_CANCELLATION_NOTICE_DAYS,
    cancelledAt: "",
    cancellationInitiatedBy: "",
    cancellationReason: "",
    cancellationNotes: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
    lines: [
      {
        id: "sbl-50145-10",
        lineNo: 10,
        manualHold: false,
        readyToClaim: false,
        orderedQuantity: "1",
        quantityInvoiced: "0",
        datePromised: "2025-10-12",
        productId: "prod-sil-wd",
        claimType: "",
        useTimeBasedQuantity: false,
        startDate: "2025-10-06",
        endDate: "2025-10-12",
        uom: "Week",
        price: "5453.90",
        lineAmount: "5453.90",
      },
      {
        id: "sbl-50145-20",
        lineNo: 20,
        manualHold: false,
        readyToClaim: false,
        orderedQuantity: "1",
        quantityInvoiced: "0",
        datePromised: "2025-10-05",
        productId: "prod-sil-wd",
        claimType: "",
        useTimeBasedQuantity: false,
        startDate: "2025-09-29",
        endDate: "2025-10-05",
        uom: "Week",
        price: "5453.90",
        lineAmount: "5453.90",
      },
    ],
  },
  {
    id: "sb-50143",
    documentNo: "50143",
    organization: "AbilityERP",
    description: "SIL weekly block",
    targetDocumentType: "Service Booking - Standard",
    isTemplate: false,
    readyToClaimRule: "Manual Tick",
    programOfSupports: false,
    dateOrdered: "2025-06-10",
    datePromised: "2025-06-16",
    startDate: "2025-06-16",
    endDate: "2025-06-16",
    clientId: "bp-bern",
    invoicePartner: "NDIS - National Disability Insurance Scheme",
    serviceAgreementId: "sa-rose-ni",
    bookingGeneratorRef: "BERN_SIL",
    totalLines: "591.00",
    grandTotal: "591.00",
    documentStatus: "Completed",
    cancellationNoticeDays: DEFAULT_CANCELLATION_NOTICE_DAYS,
    cancelledAt: "",
    cancellationInitiatedBy: "",
    cancellationReason: "",
    cancellationNotes: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
    lines: [
      {
        id: "sbl-50143-10",
        lineNo: 10,
        manualHold: false,
        readyToClaim: true,
        orderedQuantity: "6",
        quantityInvoiced: "6",
        datePromised: "2025-06-16",
        productId: "prod-sil-wd",
        claimType: "",
        useTimeBasedQuantity: true,
        startDate: "2025-06-16",
        endDate: "2025-06-16",
        uom: "Hour",
        price: "98.50",
        lineAmount: "591.00",
      },
    ],
  },
  {
    id: "sb-50137",
    documentNo: "50137",
    organization: "AbilityERP",
    description: "Community participation outing",
    targetDocumentType: "Service Booking - Standard",
    isTemplate: false,
    readyToClaimRule: "Manual Tick",
    programOfSupports: false,
    dateOrdered: "2025-06-17",
    datePromised: "2025-06-18",
    startDate: "2025-06-18",
    endDate: "2025-06-18",
    clientId: "bp-bern",
    invoicePartner: "NDIS - National Disability Insurance Scheme",
    serviceAgreementId: "sa-rose-ni",
    bookingGeneratorRef: "",
    totalLines: "261.88",
    grandTotal: "261.88",
    documentStatus: "Completed",
    cancellationNoticeDays: DEFAULT_CANCELLATION_NOTICE_DAYS,
    cancelledAt: "",
    cancellationInitiatedBy: "",
    cancellationReason: "",
    cancellationNotes: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
    lines: [
      {
        id: "sbl-50137-10",
        lineNo: 10,
        manualHold: false,
        readyToClaim: true,
        orderedQuantity: "4",
        quantityInvoiced: "4",
        datePromised: "2025-06-18",
        productId: "prod-cp",
        claimType: "",
        useTimeBasedQuantity: true,
        startDate: "2025-06-18",
        endDate: "2025-06-18",
        uom: "Hour",
        price: "65.47",
        lineAmount: "261.88",
      },
    ],
  },
];

export function sumLineAmounts(lines: ServiceBookingLine[]): string {
  const total = lines.reduce((sum, line) => sum + (parseFloat(line.lineAmount) || 0), 0);
  return total.toFixed(2);
}

export function normalizeServiceBooking(record: ServiceBookingRecord): ServiceBookingRecord {
  const lines = record.lines.map((line, index) => ({
    ...line,
    lineNo: line.lineNo ?? (index + 1) * 10,
  }));
  const grandTotal = sumLineAmounts(lines);
  return normalizeCancellationFields({
    ...record,
    lines,
    totalLines: grandTotal,
    grandTotal,
  });
}

export function createServiceBooking(
  partial: ServiceBookingRecord,
  existing: ServiceBookingRecord[]
): ServiceBookingRecord {
  const id = partial.id || `sb-${Date.now()}`;
  const maxDoc = existing.reduce((max, r) => {
    const n = parseInt(r.documentNo, 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 50000);
  const documentNo = partial.documentNo || String(maxDoc + 1);
  return normalizeServiceBooking({
    ...partial,
    id,
    documentNo,
    lines: partial.lines ?? [],
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}

export function emptyBookingLine(lineNo: number): ServiceBookingLine {
  return {
    id: newLineId("sbl"),
    lineNo,
    manualHold: false,
    readyToClaim: false,
    orderedQuantity: "1",
    quantityInvoiced: "0",
    datePromised: "",
    productId: "",
    claimType: "",
    useTimeBasedQuantity: false,
    startDate: "",
    endDate: "",
    uom: "Week",
    price: "",
    lineAmount: "",
  };
}

export function formatServiceBookingDate(date: string): string {
  if (!date?.trim()) return "—";
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
