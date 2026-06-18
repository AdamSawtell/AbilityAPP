import type { EmployeeCredentialRow, EmployeeLeaveRequestRow } from "@/lib/employee";

export type CredentialReviewItem = {
  employeeId: string;
  employeeName: string;
  credential: EmployeeCredentialRow;
};

export type LeaveReviewItem = {
  employeeId: string;
  employeeName: string;
  request: EmployeeLeaveRequestRow;
};

export type WorkforceReviewSummary = {
  pendingCredentials: number;
  pendingLeave: number;
  total: number;
};

export type WorkforceReviewQueue = {
  summary: WorkforceReviewSummary;
  credentials: CredentialReviewItem[];
  leaveRequests: LeaveReviewItem[];
};

export function buildWorkforceReviewSummary(queue: Pick<WorkforceReviewQueue, "credentials" | "leaveRequests">): WorkforceReviewSummary {
  const pendingCredentials = queue.credentials.length;
  const pendingLeave = queue.leaveRequests.length;
  return {
    pendingCredentials,
    pendingLeave,
    total: pendingCredentials + pendingLeave,
  };
}
