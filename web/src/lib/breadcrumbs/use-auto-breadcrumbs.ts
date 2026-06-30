"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { buildBreadcrumbs, createDefaultBreadcrumbContext } from "@/lib/breadcrumbs/build-breadcrumbs";
import { resolveEntityBreadcrumbLabel, type BreadcrumbEntityData } from "@/lib/breadcrumbs/entity-resolvers";
import type { BreadcrumbItem } from "@/lib/breadcrumbs/types";
import { useData } from "@/lib/data-store";

function useBreadcrumbEntityData(): BreadcrumbEntityData {
  const {
    clients,
    employees,
    locations,
    incidents,
    enquiries,
    businessPartners,
    agencyWorkers,
    contracts,
    serviceBookings,
    serviceAgreements,
    products,
    priceLists,
    invoices,
    claims,
    timesheets,
    agencyTimesheets,
    vendorInvoices,
    boardReportPacks,
    fleetVehicles,
    maintenanceRequests,
    tasks,
  } = useData();

  return useMemo(
    () => ({
      clients,
      employees,
      locations,
      incidents,
      enquiries,
      businessPartners,
      agencyWorkers,
      contracts,
      serviceBookings,
      serviceAgreements,
      products,
      priceLists,
      invoices,
      claims,
      timesheets,
      agencyTimesheets,
      vendorInvoices,
      boardReportPacks,
      fleetVehicles,
      maintenanceRequests,
      tasks,
    }),
    [
      clients,
      employees,
      locations,
      incidents,
      enquiries,
      businessPartners,
      agencyWorkers,
      contracts,
      serviceBookings,
      serviceAgreements,
      products,
      priceLists,
      invoices,
      claims,
      timesheets,
      agencyTimesheets,
      vendorInvoices,
      boardReportPacks,
      fleetVehicles,
      maintenanceRequests,
      tasks,
    ]
  );
}

/** Auto-derive breadcrumbs from the current route and loaded records. */
export function useAutoBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const entityData = useBreadcrumbEntityData();

  return useMemo(() => {
    const context = createDefaultBreadcrumbContext((listSegment, entityId) =>
      resolveEntityBreadcrumbLabel(listSegment, entityId, entityData)
    );
    return buildBreadcrumbs({ pathname, searchParams }, context);
  }, [pathname, searchParams, entityData]);
}
