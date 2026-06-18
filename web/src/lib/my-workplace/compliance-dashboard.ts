import type {
  EmployeeAvailabilityRow,
  EmployeeCredentialRow,
  EmployeeDocumentRow,
  EmployeeRecord,
} from "@/lib/employee";
import { daysUntil, syncCredentialStatuses } from "@/lib/employee-compliance";
import type { MyContractView, MyWorkplaceSummary } from "@/lib/my-workplace/types";
import { buildMyContracts, buildMySummary, isStaffContractDocument } from "@/lib/my-workplace/types";

export type MyActionItemSeverity = "overdue" | "due_soon" | "action" | "review";

export type MyActionItem = {
  id: string;
  category: "credential" | "document" | "profile" | "leave" | "contract" | "availability";
  severity: MyActionItemSeverity;
  title: string;
  description: string;
  href: string;
  dueDate?: string;
};

export type MyProfileGap = {
  id: string;
  label: string;
  description: string;
  href: string;
};

const DUE_SOON_DAYS = 30;

function hasContactValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function primaryHomeAddress(employee: EmployeeRecord) {
  return (
    employee.locations.find((l) => l.primaryAddress === "Yes" && l.active !== "No") ??
    employee.locations.find((l) => l.addressType.toLowerCase() === "home" && l.active !== "No") ??
    employee.locations.find((l) => l.active !== "No")
  );
}

export function buildProfileGaps(
  employee: EmployeeRecord,
  availability: EmployeeAvailabilityRow[]
): MyProfileGap[] {
  const gaps: MyProfileGap[] = [];

  if (!hasContactValue(employee.email)) {
    gaps.push({
      id: "email",
      label: "Work email",
      description: "Add an email address so we can reach you.",
      href: "/my/profile",
    });
  }
  if (!hasContactValue(employee.mobile) && !hasContactValue(employee.phone)) {
    gaps.push({
      id: "phone",
      label: "Phone or mobile",
      description: "Add at least one phone number.",
      href: "/my/profile",
    });
  }
  if (!employee.emergencyContacts.length) {
    gaps.push({
      id: "emergency-contact",
      label: "Emergency contact",
      description: "Add a next of kin or emergency contact.",
      href: "/my/profile",
    });
  } else {
    const primary =
      employee.emergencyContacts.find((c) => c.primaryContact === "Yes") ?? employee.emergencyContacts[0];
    if (!hasContactValue(primary.name)) {
      gaps.push({
        id: "emergency-name",
        label: "Emergency contact name",
        description: "Your primary emergency contact needs a name.",
        href: "/my/profile",
      });
    }
    if (!hasContactValue(primary.phone) && !hasContactValue(primary.mobile)) {
      gaps.push({
        id: "emergency-phone",
        label: "Emergency contact phone",
        description: "Add a phone number for your emergency contact.",
        href: "/my/profile",
      });
    }
  }
  const home = primaryHomeAddress(employee);
  if (!home || !hasContactValue(home.address1)) {
    gaps.push({
      id: "home-address",
      label: "Home address",
      description: "Add your residential address.",
      href: "/my/profile",
    });
  }
  if (!availability.length) {
    gaps.push({
      id: "availability",
      label: "Working availability",
      description: "Tell rostering when you are available to work.",
      href: "/my/availability",
    });
  }

  return gaps;
}

function credentialActionItems(credentials: EmployeeCredentialRow[]): MyActionItem[] {
  const items: MyActionItem[] = [];
  const synced = syncCredentialStatuses(credentials);

  for (const cred of synced) {
    if (cred.status === "Pending review") {
      items.push({
        id: `cred-review-${cred.id}`,
        category: "credential",
        severity: "review",
        title: `${cred.credentialType} awaiting HR review`,
        description: cred.submittedAt
          ? `Submitted ${cred.submittedAt.slice(0, 10)}`
          : "HR will verify your evidence and sign off when complete.",
        href: "/my/credentials",
      });
      continue;
    }
    if (cred.status === "Rejected") {
      items.push({
        id: `cred-rejected-${cred.id}`,
        category: "credential",
        severity: "action",
        title: `${cred.credentialType} needs resubmission`,
        description: cred.reviewNotes?.trim() || "HR declined this submission. Update and submit again.",
        href: "/my/credentials",
      });
      continue;
    }

    const days = daysUntil(cred.expiryDate);
    if (days === null) continue;
    if (days < 0) {
      items.push({
        id: `cred-overdue-${cred.id}`,
        category: "credential",
        severity: "overdue",
        title: `${cred.credentialType} expired`,
        description: `Expired ${cred.expiryDate}. Upload an updated credential for review.`,
        href: "/my/credentials",
        dueDate: cred.expiryDate,
      });
    } else if (days <= DUE_SOON_DAYS) {
      items.push({
        id: `cred-soon-${cred.id}`,
        category: "credential",
        severity: "due_soon",
        title: `${cred.credentialType} expiring soon`,
        description: `Expires ${cred.expiryDate} (${days} day${days === 1 ? "" : "s"}).`,
        href: "/my/credentials",
        dueDate: cred.expiryDate,
      });
    }
  }

  return items;
}

function documentActionItems(documents: EmployeeDocumentRow[]): MyActionItem[] {
  const items: MyActionItem[] = [];
  const visible = documents.filter((doc) => doc.staffVisible !== false);

  for (const doc of visible) {
    const days = daysUntil(doc.expiryDate);
    if (days === null) continue;
    if (days < 0) {
      items.push({
        id: `doc-overdue-${doc.id}`,
        category: "document",
        severity: "overdue",
        title: `${doc.name || doc.documentType} expired`,
        description: `Expired ${doc.expiryDate}. Contact HR if you need a replacement.`,
        href: "/my/contracts",
        dueDate: doc.expiryDate,
      });
    } else if (days <= DUE_SOON_DAYS) {
      items.push({
        id: `doc-soon-${doc.id}`,
        category: "document",
        severity: "due_soon",
        title: `${doc.name || doc.documentType} expiring soon`,
        description: `Expires ${doc.expiryDate} (${days} day${days === 1 ? "" : "s"}).`,
        href: "/my/contracts",
        dueDate: doc.expiryDate,
      });
    }
  }

  return items;
}

function contractActionItems(contracts: MyContractView[]): MyActionItem[] {
  return contracts
    .filter((c) => c.requiresAcknowledgement && !c.acknowledged)
    .map((c) => ({
      id: `contract-${c.id}`,
      category: "contract" as const,
      severity: "action" as const,
      title: `Acknowledge ${c.name || c.documentType}`,
      description: "Required before this item is complete.",
      href: "/my/contracts",
    }));
}

function profileActionItems(gaps: MyProfileGap[]): MyActionItem[] {
  return gaps.map((gap) => ({
    id: `gap-${gap.id}`,
    category: "profile" as const,
    severity: "action" as const,
    title: gap.label,
    description: gap.description,
    href: gap.href,
  }));
}

const SEVERITY_ORDER: Record<MyActionItemSeverity, number> = {
  overdue: 0,
  due_soon: 1,
  action: 2,
  review: 3,
};

export function buildMyActionItems(input: {
  employee: EmployeeRecord;
  availability: EmployeeAvailabilityRow[];
  contracts: MyContractView[];
}): MyActionItem[] {
  const profileGaps = buildProfileGaps(input.employee, input.availability);
  const items = [
    ...credentialActionItems(input.employee.credentials ?? []),
    ...documentActionItems(input.employee.documents ?? []),
    ...contractActionItems(input.contracts),
    ...profileActionItems(profileGaps),
  ];

  const pendingLeave = (input.employee.leaveRequests ?? []).filter((l) => l.status === "Requested");
  for (const leave of pendingLeave) {
    items.push({
      id: `leave-${leave.id}`,
      category: "leave",
      severity: "review",
      title: `${leave.leaveType} awaiting approval`,
      description: `${leave.startDate} to ${leave.endDate}`,
      href: "/my/leave",
    });
  }

  return items.sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severity !== 0) return severity;
    return a.title.localeCompare(b.title);
  });
}

export function extendMySummary(
  base: MyWorkplaceSummary,
  actionItems: MyActionItem[],
  profileGaps: MyProfileGap[]
): MyWorkplaceSummary {
  const overdueCount = actionItems.filter((i) => i.severity === "overdue").length;
  const dueSoonCount = actionItems.filter((i) => i.severity === "due_soon").length;
  const credentialsPendingReview = actionItems.filter(
    (i) => i.category === "credential" && i.severity === "review"
  ).length;

  return {
    ...base,
    overdueCount,
    dueSoonCount,
    credentialsPendingReview,
    profileGapsCount: profileGaps.length,
    actionItemsCount: actionItems.length,
  };
}

export function buildMyWorkplaceDashboard(input: {
  employee: EmployeeRecord;
  availability: EmployeeAvailabilityRow[];
  contracts: MyContractView[];
}) {
  const profileGaps = buildProfileGaps(input.employee, input.availability);
  const actionItems = buildMyActionItems(input);
  const baseSummary = buildMySummary(
    input.employee.leaveRequests ?? [],
    input.contracts,
    input.availability
  );
  const summary = extendMySummary(baseSummary, actionItems, profileGaps);

  return { summary, actionItems, profileGaps };
}

export { isStaffContractDocument, buildMyContracts };
