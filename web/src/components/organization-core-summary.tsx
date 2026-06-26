"use client";

import {
  EntityHeader,
  type EntityHeaderBadge,
  type EntityHeaderMetaItem,
  type EntityHeaderSummaryItem,
} from "@/components/entity-header";
import { organizationDisplayName, type OrganizationRecord } from "@/lib/organization";

function formatOrganizationAddress(record: OrganizationRecord) {
  return [record.address1, record.address2, record.city, record.state, record.postcode, record.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function OrganizationCoreSummary({
  record,
  saved,
}: {
  record: OrganizationRecord;
  saved?: boolean;
}) {
  const displayName = organizationDisplayName(record);
  const address = formatOrganizationAddress(record);
  const registrationGroups = record.registrationGroups
    .split(/\r?\n/)
    .map((group) => group.trim())
    .filter(Boolean);

  const badges: EntityHeaderBadge[] = [];
  if (saved) badges.push({ key: "saved", label: "Saved", tone: "success" });
  if (record.ndisRegistrationNumber) badges.push({ key: "ndis", label: "NDIS registered", tone: "success" });
  if (record.gstRegistered) badges.push({ key: "gst", label: "GST registered", tone: "info" });
  if (registrationGroups.length) {
    badges.push({
      key: "registration-groups",
      label: `${registrationGroups.length} registration group${registrationGroups.length === 1 ? "" : "s"}`,
      tone: "violet",
    });
  }

  const metadata: EntityHeaderMetaItem[] = [
    { key: "email", icon: "email", label: "General email", value: record.email || "—" },
    { key: "phone", icon: "phone", label: "General phone", value: record.phone || "—" },
    { key: "address", icon: "map-pin", label: "Address", value: address || "—" },
    { key: "primary-contact", icon: "user", label: "Primary contact", value: record.primaryContactName || "—" },
  ];

  const summary: EntityHeaderSummaryItem[] = [
    { key: "abn", label: "ABN", value: record.abn || "—" },
    { key: "ndis-number", label: "NDIS number", value: record.ndisRegistrationNumber || "—" },
    { key: "city", label: "City", value: record.city || "—" },
  ];

  return (
    <EntityHeader
      type="Organisation"
      title={displayName}
      subtitle={record.legalName && record.legalName !== record.tradingName ? record.legalName : record.searchKey}
      imageUrl={record.logoUrl}
      imageAlt={`${displayName} logo`}
      imageFit="contain"
      badges={badges}
      metadata={metadata}
      summary={summary}
    />
  );
}
