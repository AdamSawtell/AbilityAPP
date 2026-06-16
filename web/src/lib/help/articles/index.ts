import { quickTaskArticles } from "@/lib/help/articles/quick-tasks";
import { adminArticle, maintainingGuideArticle, reportsArticle, servicesArticle } from "@/lib/help/articles/services-admin";
import { clientsArticle, locationsArticle } from "@/lib/help/articles/clients-locations";
import { enquiriesArticle, tasksArticle } from "@/lib/help/articles/core";
import { gettingStartedArticle, homeArticle, navigationArticle } from "@/lib/help/articles/foundation";
import { employeesArticle } from "@/lib/help/articles/people";
import type { HelpArticle, HelpCategory } from "@/lib/help/types";

export const HELP_ARTICLES: HelpArticle[] = [
  gettingStartedArticle,
  navigationArticle,
  ...quickTaskArticles,
  homeArticle,
  tasksArticle,
  enquiriesArticle,
  clientsArticle,
  locationsArticle,
  employeesArticle,
  servicesArticle,
  reportsArticle,
  adminArticle,
  maintainingGuideArticle,
];

export const HELP_CATEGORIES: HelpCategory[] = [
  "Foundation",
  "Quick tasks",
  "Core",
  "People",
  "Services",
  "Reports",
  "Admin",
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
  Reference: "Reference",
};
