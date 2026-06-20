export type PortalServiceItem = {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: string;
  workerName: string;
  locationName: string;
};

export type PortalBudgetLine = {
  supportBudget: string;
  supportCategory: string;
  allocated: number;
  claimed: number;
  remaining: number;
};

export type PortalBudgetView = {
  overall: { allocated: number; claimed: number; remaining: number };
  lines: PortalBudgetLine[];
  utilisationPct: number | null;
};

export type PortalClientSummary = {
  id: string;
  name: string;
  preferredName: string;
  email: string;
  planReviewDueDate: string;
};
