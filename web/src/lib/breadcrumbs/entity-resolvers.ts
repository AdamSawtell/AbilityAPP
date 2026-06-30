import { findClientByRouteId } from "@/lib/client";
import { findClaimByRouteId } from "@/lib/claim";
import { agencyWorkerDisplayName } from "@/lib/agency-worker";
import { findFleetVehicleByRouteId } from "@/lib/fleet-vehicle";
import { findMaintenanceRequestByRouteId } from "@/lib/maintenance-request";
import { reportById } from "@/lib/reports/catalog";
import type { AgencyTimesheetRecord } from "@/lib/agency-timesheet";
import type { AgencyWorkerRecord } from "@/lib/agency-worker";
import type { BoardReportPackRecord } from "@/lib/board-report-pack";
import type { BusinessPartnerRecord } from "@/lib/business-partner";
import type { ClaimRecord } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";
import type { ContractRecord } from "@/lib/contract";
import type { EmployeeRecord } from "@/lib/employee";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { FleetVehicleRecord } from "@/lib/fleet-vehicle";
import type { IncidentRecord } from "@/lib/incident";
import type { InvoiceRecord } from "@/lib/invoice";
import type { LocationRecord } from "@/lib/location";
import type { MaintenanceRequestRecord } from "@/lib/maintenance-request";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import type { TaskRecord } from "@/lib/task";
import type { TimesheetRecord } from "@/lib/timesheet";
import type { VendorInvoiceRecord } from "@/lib/vendor-invoice";

export type BreadcrumbEntityData = {
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  incidents: IncidentRecord[];
  enquiries: EnquiryRecord[];
  businessPartners: BusinessPartnerRecord[];
  agencyWorkers: AgencyWorkerRecord[];
  contracts: ContractRecord[];
  serviceBookings: ServiceBookingRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  invoices: InvoiceRecord[];
  claims: ClaimRecord[];
  timesheets: TimesheetRecord[];
  agencyTimesheets: AgencyTimesheetRecord[];
  vendorInvoices: VendorInvoiceRecord[];
  boardReportPacks: BoardReportPackRecord[];
  fleetVehicles: FleetVehicleRecord[];
  maintenanceRequests: MaintenanceRequestRecord[];
  tasks: TaskRecord[];
};

function byId<T extends { id: string }>(records: T[], id: string): T | undefined {
  return records.find((record) => record.id === id);
}

export function resolveEntityBreadcrumbLabel(
  listSegment: string,
  entityId: string,
  data: BreadcrumbEntityData
): string | undefined {
  switch (listSegment) {
    case "clients": {
      const client = findClientByRouteId(data.clients, entityId);
      return client ? client.name || client.searchKey : undefined;
    }
    case "employees": {
      const employee = byId(data.employees, entityId);
      return employee ? employee.name || employee.searchKey : undefined;
    }
    case "locations": {
      const location = byId(data.locations, entityId);
      return location ? location.name || location.searchKey : undefined;
    }
    case "incidents": {
      const incident = byId(data.incidents, entityId);
      return incident ? incident.documentNo : undefined;
    }
    case "enquiries": {
      const enquiry = byId(data.enquiries, entityId);
      return enquiry ? enquiry.documentNo : undefined;
    }
    case "business-partners": {
      const partner = byId(data.businessPartners, entityId);
      return partner ? partner.name || partner.searchKey : undefined;
    }
    case "agency-workers": {
      const worker = byId(data.agencyWorkers, entityId);
      return worker ? agencyWorkerDisplayName(worker) : undefined;
    }
    case "contracts": {
      const contract = byId(data.contracts, entityId);
      return contract ? contract.documentNo || contract.name : undefined;
    }
    case "service-bookings": {
      const booking = byId(data.serviceBookings, entityId);
      return booking ? booking.documentNo : undefined;
    }
    case "service-agreements": {
      const agreement = byId(data.serviceAgreements, entityId);
      return agreement ? agreement.name || agreement.searchKey : undefined;
    }
    case "service-planning": {
      const plan = byId(data.serviceAgreements, entityId);
      return plan ? plan.name || plan.searchKey : undefined;
    }
    case "products": {
      const product = byId(data.products, entityId);
      return product ? product.name || product.searchKey : undefined;
    }
    case "price-lists": {
      const list = byId(data.priceLists, entityId);
      return list ? list.name : undefined;
    }
    case "invoices": {
      const invoice = byId(data.invoices, entityId);
      return invoice ? invoice.documentNo : undefined;
    }
    case "claims": {
      const claim = findClaimByRouteId(data.claims, entityId) ?? byId(data.claims, entityId);
      return claim ? claim.documentNo : undefined;
    }
    case "timesheets": {
      const timesheet = byId(data.timesheets, entityId);
      return timesheet ? timesheet.documentNo : undefined;
    }
    case "agency-timesheets": {
      const timesheet = byId(data.agencyTimesheets, entityId);
      return timesheet ? timesheet.documentNo : undefined;
    }
    case "vendor-invoices": {
      const invoice = byId(data.vendorInvoices, entityId);
      return invoice ? invoice.documentNo : undefined;
    }
    case "board-reporting": {
      const pack = byId(data.boardReportPacks, entityId);
      return pack ? pack.title : undefined;
    }
    case "fleet": {
      const vehicle = findFleetVehicleByRouteId(data.fleetVehicles, entityId) ?? byId(data.fleetVehicles, entityId);
      return vehicle ? vehicle.registrationNumber || vehicle.searchKey || vehicle.name : undefined;
    }
    case "maintenance": {
      const request = findMaintenanceRequestByRouteId(data.maintenanceRequests, entityId) ?? byId(data.maintenanceRequests, entityId);
      return request ? request.documentNo : undefined;
    }
    case "tasks": {
      const task = byId(data.tasks, entityId);
      return task ? task.documentNo || task.title : undefined;
    }
    case "reports": {
      const report = reportById(entityId);
      return report?.label;
    }
    default:
      return undefined;
  }
}