"use client";

import Link from "next/link";
import {
  EntityHeader,
  type EntityHeaderBadge,
  type EntityHeaderMetaItem,
  type EntityHeaderSummaryItem,
  type EntityHeaderTone,
} from "@/components/entity-header";
import type { LocationRecord } from "@/lib/location";
import { locationAddressLine } from "@/lib/location";

function statusTone(status: string): EntityHeaderTone {
  if (status === "Active") return "success";
  if (status === "Planned") return "info";
  if (status === "Closed") return "neutral";
  return "warning";
}

export function LocationCoreSummary({
  location,
  saved,
}: {
  location: LocationRecord;
  saved?: boolean;
}) {
  const activeAlerts = location.alerts.filter((a) => a.showAsAlert === "Yes").length;
  const address = locationAddressLine(location);
  const clientsTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Clients")}`;
  const employeesTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Employees")}`;
  const productsTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Products & services")}`;
  const alertsTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Alerts")}`;
  const contactTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Contact & address")}`;

  const badges: EntityHeaderBadge[] = [];
  if (saved) badges.push({ key: "saved", label: "Saved", tone: "success" });
  if (location.status) badges.push({ key: "status", label: location.status, tone: statusTone(location.status) });
  if (location.alerts.length > 0) {
    badges.push({
      key: "alerts",
      label: `${location.alerts.length} alert${location.alerts.length === 1 ? "" : "s"}${activeAlerts > 0 ? ` · ${activeAlerts} active` : ""}`,
      tone: "warning",
      href: alertsTabHref,
    });
  }
  if (location.clientLinks.length > 0) {
    badges.push({
      key: "clients",
      label: `${location.clientLinks.length} client${location.clientLinks.length === 1 ? "" : "s"}`,
      tone: "violet",
      href: clientsTabHref,
    });
  }
  if (location.employeeLinks.length > 0) {
    badges.push({
      key: "staff",
      label: `${location.employeeLinks.length} staff`,
      tone: "info",
      href: employeesTabHref,
    });
  }
  if (location.productLinks.length > 0) {
    badges.push({
      key: "services",
      label: `${location.productLinks.length} service${location.productLinks.length === 1 ? "" : "s"}`,
      tone: "info",
      href: productsTabHref,
    });
  }

  const metadata: EntityHeaderMetaItem[] = [
    {
      key: "address",
      icon: "map-pin",
      label: "Address",
      value: address ? (
        <Link href={contactTabHref} className="hover:text-[#b51266] hover:underline">
          {address}
        </Link>
      ) : (
        "—"
      ),
    },
    { key: "phone", icon: "phone", label: "Phone", value: location.phone || location.mobile || "—" },
    { key: "email", icon: "email", label: "Email", value: location.email || "—" },
    {
      key: "valid",
      icon: "calendar",
      label: "Valid",
      value: `${location.validFrom || "—"}${location.validTo ? ` → ${location.validTo}` : ""}`,
    },
  ];

  const summary: EntityHeaderSummaryItem[] = [
    { key: "capacity", label: "Capacity", value: location.capacity || "—" },
    { key: "city", label: "City", value: location.city || "—" },
  ];
  if (location.locationType?.trim()) {
    summary.push({ key: "type", label: "Type", value: location.locationType });
  }

  const subtitleParts = [location.searchKey, location.locationType || null].filter(Boolean);

  return (
    <EntityHeader
      type="Location"
      title={location.name}
      subtitle={subtitleParts.join(" · ")}
      imageUrl={location.pictureUrl}
      imageAlt={location.name}
      badges={badges}
      metadata={metadata}
      summary={summary}
    />
  );
}
