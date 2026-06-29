import { adminCommunicationsArticle } from "@/lib/help/articles/admin-communications";
import { deliveryArticle, servicePlanningArticle } from "@/lib/help/articles/delivery";
import { SYSTEM_SETUP_ARTICLES } from "@/lib/help/articles/system-setup";
import { quickTaskArticles } from "@/lib/help/articles/quick-tasks";
import { taskAutomationsArticle } from "@/lib/help/articles/task-automations";
import { documentTemplatesArticle } from "@/lib/help/articles/document-templates";
import { adminArticle, maintainingGuideArticle, reportsArticle, servicesArticle } from "@/lib/help/articles/services-admin";
import { clientsArticle, locationsArticle } from "@/lib/help/articles/clients-locations";
import { enquiriesArticle, tasksArticle } from "@/lib/help/articles/core";
import { incidentsArticle, reportIncidentQuickArticle } from "@/lib/help/articles/incidents";
import { complaintsFeedbackArticle } from "@/lib/help/articles/complaints";
import { gettingStartedArticle, homeArticle, navigationArticle } from "@/lib/help/articles/foundation";
import { employeesArticle, businessPartnersArticle, agencyWorkersArticle } from "@/lib/help/articles/people";
import { myWorkplaceArticle } from "@/lib/help/articles/my-workplace";
import { participantPortalArticle } from "@/lib/help/articles/participant-portal";
import { participantPortalGuideArticle } from "@/lib/help/articles/participant-portal-guide";
import { agencyVendorPortalArticle } from "@/lib/help/articles/agency-vendor-portal";
import { financeArticle } from "@/lib/help/articles/finance";
import { fleetArticle } from "@/lib/help/articles/fleet";
import { maintenanceArticle } from "@/lib/help/articles/maintenance";
import { trainingMeetingsArticle, workforceLeaveCalendarArticle, workforceOrganisationArticle } from "@/lib/help/articles/workforce-organisation";
import { recordRetentionArticle, userSessionAuditArticle, processAuditArticle, aiQueryAuditArticle, timeAndDateArticle } from "@/lib/help/articles/session-audit";
import { ndisPriceImporterArticle } from "@/lib/help/articles/ndis-price-importer";
import { priceUpdateReviewArticle } from "@/lib/help/articles/price-update-review";
import type { HelpArticle, HelpCategory } from "@/lib/help/types";

export const HELP_ARTICLES: HelpArticle[] = [
  gettingStartedArticle,
  navigationArticle,
  ...quickTaskArticles,
  reportIncidentQuickArticle,
  homeArticle,
  tasksArticle,
  enquiriesArticle,
  incidentsArticle,
  complaintsFeedbackArticle,
  clientsArticle,
  locationsArticle,
  employeesArticle,
  businessPartnersArticle,
  agencyWorkersArticle,
  myWorkplaceArticle,
  participantPortalArticle,
  participantPortalGuideArticle,
  agencyVendorPortalArticle,
  financeArticle,
  workforceLeaveCalendarArticle,
  trainingMeetingsArticle,
  workforceOrganisationArticle,
  servicesArticle,
  deliveryArticle,
  servicePlanningArticle,
  fleetArticle,
  maintenanceArticle,
  reportsArticle,
  adminArticle,
  adminCommunicationsArticle,
  taskAutomationsArticle,
  documentTemplatesArticle,
  userSessionAuditArticle,
  processAuditArticle,
  aiQueryAuditArticle,
  recordRetentionArticle,
  timeAndDateArticle,
  ndisPriceImporterArticle,
  priceUpdateReviewArticle,
  maintainingGuideArticle,
  ...SYSTEM_SETUP_ARTICLES,
];

export const HELP_CATEGORIES: HelpCategory[] = [
  "Foundation",
  "Quick tasks",
  "Core",
  "People",
  "Services",
  "Finance",
  "Reports",
  "Admin",
  "System setup",
  "Reference",
];

export const HELP_CATEGORY_LABELS: Record<HelpCategory, string> = {
  Foundation: "Foundation",
  "Quick tasks": "Quick tasks",
  Core: "Core modules",
  People: "People",
  Services: "Services",
  Finance: "Finance",
  Reports: "Reports",
  Admin: "Administration",
  "System setup": "System setup",
  Reference: "Reference",
};
