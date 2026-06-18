import type {
  EmployeeAvailabilityRow,
  EmployeeDocumentRow,
  EmployeeEmergencyContactRow,
  EmployeeLeaveRequestRow,
  EmployeeLocationRow,
} from "@/lib/employee";

export type MyProfilePayload = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  mobile: string;
  emergencyContacts: EmployeeEmergencyContactRow[];
  locations: EmployeeLocationRow[];
};

export type MyLeaveSubmitPayload = {
  leaveType: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export type MyContractView = EmployeeDocumentRow & {
  acknowledged: boolean;
  acknowledgedAt?: string;
};

export type MyWorkplaceSummary = {
  pendingLeaveCount: number;
  contractsToAcknowledge: number;
  availabilityConfigured: boolean;
  overdueCount: number;
  dueSoonCount: number;
  credentialsPendingReview: number;
  profileGapsCount: number;
  actionItemsCount: number;
};

export type MyCredentialSubmitPayload = {
  credentialType: string;
  credentialNumber: string;
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  evidenceRef: string;
  notes: string;
};

export function isStaffContractDocument(doc: EmployeeDocumentRow): boolean {
  if (doc.staffVisible === false) return false;
  const type = doc.documentType.toLowerCase();
  return (
    type.includes("contract") ||
    type.includes("policy") ||
    type.includes("employment") ||
    type.includes("agreement")
  );
}

export function dayLabels(): string[] {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
}

export function buildMyContracts(
  documents: EmployeeDocumentRow[],
  acknowledgements: { documentId: string; acknowledgedAt: string }[]
): MyContractView[] {
  const ackByDoc = new Map(acknowledgements.map((a) => [a.documentId, a]));
  return documents
    .filter(isStaffContractDocument)
    .map((doc) => {
      const ack = ackByDoc.get(doc.id);
      return {
        ...doc,
        acknowledged: Boolean(ack),
        acknowledgedAt: ack?.acknowledgedAt,
      };
    });
}

export function buildMySummary(
  leaveRequests: EmployeeLeaveRequestRow[],
  contracts: MyContractView[],
  availability: EmployeeAvailabilityRow[]
): MyWorkplaceSummary {
  return {
    pendingLeaveCount: leaveRequests.filter((l) => l.status === "Requested").length,
    contractsToAcknowledge: contracts.filter((c) => c.requiresAcknowledgement && !c.acknowledged).length,
    availabilityConfigured: availability.length > 0,
    overdueCount: 0,
    dueSoonCount: 0,
    credentialsPendingReview: 0,
    profileGapsCount: 0,
    actionItemsCount: 0,
  };
}
