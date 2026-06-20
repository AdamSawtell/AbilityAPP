import { newLineId } from "@/lib/client-line-tables";
import type { ServiceAgreementLine } from "@/lib/service-agreement";

const DEFAULT_FUNDING = {
  fundingType: "Funding Body",
  fundingBody: "NDIS - National Disability Insurance Scheme",
  fundingManagementType: "Portal Managed",
  budgetRules: "Strict Limit",
} as const;

export type ScheduleOfSupportsTemplate = {
  id: string;
  label: string;
  description: string;
  lines: Omit<ServiceAgreementLine, "id" | "lineNo">[];
};

export const SCHEDULE_OF_SUPPORTS_TEMPLATES: ScheduleOfSupportsTemplate[] = [
  {
    id: "sil-community",
    label: "SIL + community starter",
    description: "Supported independent living and community participation lines from the NDIS price list.",
    lines: [
      {
        productId: "prod-sil-wd",
        name: "SIL",
        description: "Supported independent living — weekday",
        plannedPrice: "0",
        registrationGroup: "Supported Independent Living",
        ...DEFAULT_FUNDING,
      },
      {
        productId: "prod-cp",
        name: "Community participation",
        description: "Assistance with social and community participation",
        plannedPrice: "0",
        registrationGroup: "Participation In Community And Social And Civic Activities",
        fundingType: "Funding Body",
        fundingBody: "NDIS - National Disability Insurance Scheme",
        fundingManagementType: "Portal Managed",
        budgetRules: "Warning",
      },
    ],
  },
  {
    id: "core-daily-living",
    label: "Core daily living",
    description: "Personal care and daily living placeholder — enter planned amounts from the NDIS plan.",
    lines: [
      {
        productId: "prod-sil-wd",
        name: "Assistance with daily life",
        description: "Personal care and daily living supports",
        plannedPrice: "0",
        registrationGroup: "Assistance With Daily Life Tasks In A Group Or Shared Living",
        ...DEFAULT_FUNDING,
      },
    ],
  },
  {
    id: "full-schedule-scaffold",
    label: "Full schedule scaffold",
    description: "SIL, community participation, and transport rows ready for manual pricing.",
    lines: [
      {
        productId: "prod-sil-wd",
        name: "SIL",
        description: "",
        plannedPrice: "0",
        registrationGroup: "Supported Independent Living",
        ...DEFAULT_FUNDING,
      },
      {
        productId: "prod-cp",
        name: "Community participation",
        description: "",
        plannedPrice: "0",
        registrationGroup: "Participation In Community And Social And Civic Activities",
        ...DEFAULT_FUNDING,
        budgetRules: "Warning",
      },
      {
        productId: "prod-transport",
        name: "Transport",
        description: "Provider travel / transport",
        plannedPrice: "0",
        registrationGroup: "Participation In Community And Social And Civic Activities",
        ...DEFAULT_FUNDING,
        budgetRules: "Warning",
      },
    ],
  },
];

export function applyScheduleTemplate(
  existing: ServiceAgreementLine[],
  template: ScheduleOfSupportsTemplate
): ServiceAgreementLine[] {
  const baseLineNo = existing.reduce((max, row) => Math.max(max, row.lineNo), 0);
  const added = template.lines.map((line, index) => ({
    id: newLineId("sal"),
    lineNo: baseLineNo + (index + 1) * 10,
    ...line,
  }));
  return [...existing, ...added];
}
