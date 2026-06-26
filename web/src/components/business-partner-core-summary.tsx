"use client";

import {
  EntityHeader,
  type EntityHeaderBadge,
  type EntityHeaderMetaItem,
  type EntityHeaderSummaryItem,
  type EntityHeaderTone,
} from "@/components/entity-header";
import { isAgencyVendorPartner } from "@/lib/agency-worker";
import type { BusinessPartnerRecord } from "@/lib/business-partner";

function statusTone(status: string): EntityHeaderTone {
  const value = status.toLowerCase();
  if (value.includes("inactive") || value.includes("closed")) return "neutral";
  if (value.includes("active")) return "success";
  return "warning";
}

function formatPartnerAddress(partner: BusinessPartnerRecord) {
  return [partner.address1, partner.address2, partner.city, partner.state, partner.postcode, partner.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function BusinessPartnerCoreSummary({
  partner,
  saved,
}: {
  partner: BusinessPartnerRecord;
  saved?: boolean;
}) {
  const address = formatPartnerAddress(partner);
  const isAgencyVendor = isAgencyVendorPartner(partner.partnerType);
  const typeLabel = partner.partnerType || (isAgencyVendor ? "Provider" : "Business partner");

  const badges: EntityHeaderBadge[] = [];
  if (saved) badges.push({ key: "saved", label: "Saved", tone: "success" });
  if (partner.status) badges.push({ key: "status", label: partner.status, tone: statusTone(partner.status) });
  if (partner.partnerType) badges.push({ key: "type", label: partner.partnerType, tone: isAgencyVendor ? "violet" : "info" });
  if (partner.invoiceDeliveryMethod) {
    badges.push({ key: "invoice-delivery", label: `Invoices by ${partner.invoiceDeliveryMethod}`, tone: "neutral" });
  }

  const metadata: EntityHeaderMetaItem[] = [
    { key: "email", icon: "email", label: "Email", value: partner.email || "—" },
    { key: "phone", icon: "phone", label: "Phone", value: partner.phone || partner.mobile || "—" },
    { key: "address", icon: "map-pin", label: "Address", value: address || "—" },
    {
      key: "remittance",
      icon: "mail",
      label: "Remittance",
      value: partner.remittanceEmail || partner.email || "—",
    },
  ];

  const summary: EntityHeaderSummaryItem[] = [
    { key: "abn", label: "ABN", value: partner.abn || "—" },
    { key: "terms", label: "Payment terms", value: partner.paymentTerms || "—" },
    { key: "preferred", label: "Preferred contact", value: partner.preferredCommunicationMethod || "—" },
  ];

  if (isAgencyVendor && partner.agencyHourlyRate > 0) {
    summary.push({ key: "agency-rate", label: "Agency rate", value: `$${partner.agencyHourlyRate.toFixed(2)}` });
  }

  return (
    <EntityHeader
      type={typeLabel}
      title={partner.name}
      subtitle={partner.searchKey}
      badges={badges}
      metadata={metadata}
      summary={summary}
    />
  );
}
