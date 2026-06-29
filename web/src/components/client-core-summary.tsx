"use client";

import Link from "next/link";
import {
  EntityHeader,
  type EntityHeaderBadge,
  type EntityHeaderMetaItem,
  type EntityHeaderSummaryItem,
  type EntityHeaderTone,
} from "@/components/entity-header";
import { lifecycleLabel, normalizeLifecycleStatus } from "@/lib/client-lifecycle";
import { useData } from "@/lib/data-store";
import type { ClientRecord } from "@/lib/client";
import { formatLocationAddress } from "@/lib/client-line-tables";
import { clientHasActiveAssistanceAnimal } from "@/lib/client-animal";

function statusLabel(status: string) {
  return status.replace(/^\d+_/, "").replace(/_/g, " ");
}

const LIFECYCLE_TONE: Record<string, EntityHeaderTone> = {
  intake: "neutral",
  onboarding: "info",
  active: "success",
  plan_review: "warning",
  exit: "danger",
};

export function ClientCoreSummary({ client, saved }: { client: ClientRecord; saved?: boolean }) {
  const { getServiceAgreementsByClientId, getSupportPlanByClientId } = useData();
  const supportPlan = getSupportPlanByClientId(client.id);
  const agreements = getServiceAgreementsByClientId(client.id);
  const supportPlanTabHref = `/clients/${client.id}?tab=${encodeURIComponent("Support Plan")}`;
  const activeAlerts = client.alerts.filter((a) => a.showAsAlert === "Yes").length;
  const activeConsents = (client.consents ?? []).filter((c) => c.showAsAlert === "Yes").length;
  const restrictiveCount = client.restrictivePractices?.length ?? 0;
  const postToLocation = client.locations?.find((l) => l.postToAddress === "Yes" && l.active === "Yes");
  const serviceLocation = client.locations?.find((l) => l.serviceDeliveryAddress === "Yes" && l.active === "Yes");

  const subtitleParts = [
    client.searchKey,
    client.preferredName && client.preferredName !== client.firstName ? `goes by ${client.preferredName}` : null,
  ].filter(Boolean);

  const lifecycleKey = normalizeLifecycleStatus(client.lifecycleStatus);

  const badges: EntityHeaderBadge[] = [];
  if (saved) badges.push({ key: "saved", label: "Saved", tone: "success" });
  badges.push({ key: "lifecycle", label: lifecycleLabel(client.lifecycleStatus), tone: LIFECYCLE_TONE[lifecycleKey] ?? "neutral" });
  if (client.status) badges.push({ key: "status", label: statusLabel(client.status), tone: "neutral" });
  if (client.alerts.length > 0) {
    badges.push({
      key: "alerts",
      label: `${client.alerts.length} alert${client.alerts.length === 1 ? "" : "s"}${activeAlerts > 0 ? ` · ${activeAlerts} active` : ""}`,
      tone: "warning",
    });
  }
  if (activeConsents > 0) {
    badges.push({
      key: "consents",
      label: `${activeConsents} consent alert${activeConsents === 1 ? "" : "s"}`,
      tone: "info",
      href: `/clients/${client.id}?tab=Consents%20and%20Legal%20Orders`,
    });
  }
  if (restrictiveCount > 0) {
    badges.push({
      key: "restrictive",
      label: `${restrictiveCount} restrictive practice${restrictiveCount === 1 ? "" : "s"}`,
      tone: "danger",
      href: `/clients/${client.id}?tab=Restrictive%20Practices`,
    });
  }
  if (client.riskAlerts?.trim()) badges.push({ key: "risk", label: "Risk noted", tone: "warning" });
  if (clientHasActiveAssistanceAnimal(client.animals ?? [])) {
    badges.push({
      key: "assistance-animal",
      label: "Assistance animal on site",
      tone: "info",
      href: `/clients/${client.id}?tab=${encodeURIComponent("Animal and Pet")}`,
    });
  }
  if (client.animalAllergyAlert?.trim()) {
    badges.push({
      key: "animal-allergy",
      label: "Animal allergy alert",
      tone: "danger",
      href: `/clients/${client.id}?tab=${encodeURIComponent("Animal and Pet")}`,
    });
  }
  if (supportPlan) {
    badges.push({
      key: "support-plan",
      label: `Support plan · ${supportPlan.goals.length} goal${supportPlan.goals.length === 1 ? "" : "s"}`,
      tone: "info",
      href: supportPlanTabHref,
    });
  }
  if (agreements.length > 0) {
    badges.push({
      key: "agreements",
      label: `${agreements.length} service agreement${agreements.length === 1 ? "" : "s"}`,
      tone: "violet",
    });
  }

  const metadata: EntityHeaderMetaItem[] = [
    { key: "email", icon: "email", label: "Email", value: client.email || "—" },
    { key: "phone", icon: "phone", label: "Phone", value: client.phone || "—" },
    {
      key: "service",
      icon: "map-pin",
      label: "Service address",
      value: serviceLocation ? (
        <Link href={`/clients/${client.id}?tab=Locations`} className="hover:text-[#b51266] hover:underline">
          {formatLocationAddress(serviceLocation)}
        </Link>
      ) : (
        "—"
      ),
    },
    {
      key: "post",
      icon: "mail",
      label: "Post to",
      value: postToLocation ? (
        <Link href={`/clients/${client.id}?tab=Locations`} className="hover:text-[#b51266] hover:underline">
          {formatLocationAddress(postToLocation)}
        </Link>
      ) : (
        "—"
      ),
    },
  ];

  const summary: EntityHeaderSummaryItem[] = [
    { key: "funding", label: "Funding", value: client.fundingBody || "—" },
    { key: "disability", label: "Disability", value: client.disability || "—" },
  ];
  if (client.fundingBodyNumber?.trim()) {
    summary.push({ key: "ndis", label: "NDIS number", value: client.fundingBodyNumber });
  }

  return (
    <EntityHeader
      type="Client"
      title={client.name}
      subtitle={subtitleParts.join(" · ")}
      imageUrl={client.pictureUrl}
      imageAlt={client.name}
      badges={badges}
      metadata={metadata}
      summary={summary}
    />
  );
}
