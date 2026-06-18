import { SYSTEM_SETUP_ARTICLES } from "@/lib/help/articles/system-setup";
import { quickTaskArticles } from "@/lib/help/articles/quick-tasks";
import { taskAutomationsArticle } from "@/lib/help/articles/task-automations";
import { adminArticle, maintainingGuideArticle, reportsArticle, servicesArticle } from "@/lib/help/articles/services-admin";
import { clientsArticle, locationsArticle } from "@/lib/help/articles/clients-locations";
import { enquiriesArticle, tasksArticle } from "@/lib/help/articles/core";
import { incidentsArticle, reportIncidentQuickArticle } from "@/lib/help/articles/incidents";
import { gettingStartedArticle, homeArticle, navigationArticle } from "@/lib/help/articles/foundation";
import { employeesArticle } from "@/lib/help/articles/people";
import { workforceLeaveCalendarArticle, workforceOrganisationArticle } from "@/lib/help/articles/workforce-organisation";
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
  clientsArticle,
  locationsArticle,
  employeesArticle,
  workforceLeaveCalendarArticle,
  workforceOrganisationArticle,
  servicesArticle,
  reportsArticle,
  adminArticle,
  taskAutomationsArticle,
  maintainingGuideArticle,
  ...SYSTEM_SETUP_ARTICLES,
];

export const HELP_CATEGORIES: HelpCategory[] = [
  "Foundation",
  "Quick tasks",
  "Core",
  "People",
  "Services",
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
  Reports: "Reports",
  Admin: "Administration",
  "System setup": "System setup",
  Reference: "Reference",
};
