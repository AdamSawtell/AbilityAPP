import type { AppUserRecord } from "@/lib/access/types";

export type LeadershipLoginLink = {
  id: string;
  username: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  notes: string;
};

/** Dedicated logins for leadership holders (managers, officers, board). */
export const LEADERSHIP_LOGIN_LINKS: LeadershipLoginLink[] = [
  {
    id: "user-board",
    username: "EleanorWright",
    employeeId: "emp-board-chair",
    firstName: "Eleanor",
    lastName: "Wright",
    email: "eleanor.wright@abilityerp.local",
    roleId: "role-board",
    notes: "Board chair seed login",
  },
  {
    id: "user-hr-manager",
    username: "SandraBlake",
    employeeId: "emp-hr-manager",
    firstName: "Sandra",
    lastName: "Blake",
    email: "sandra.blake@abilityerp.local",
    roleId: "role-hr-manager",
    notes: "HR manager",
  },
  {
    id: "user-hr-officer",
    username: "CalebMurphy",
    employeeId: "emp-staff-146",
    firstName: "Caleb",
    lastName: "Murphy",
    email: "caleb.murphy@abilityerp.local",
    roleId: "role-hr-officer",
    notes: "HR officer",
  },
  {
    id: "user-ict-manager",
    username: "AlexKim",
    employeeId: "emp-ict-manager",
    firstName: "Alex",
    lastName: "Kim",
    email: "alex.kim@abilityerp.local",
    roleId: "role-ict-manager",
    notes: "ICT manager",
  },
  {
    id: "user-ict-officer",
    username: "JordanLee",
    employeeId: "emp-ict-officer",
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@abilityerp.local",
    roleId: "role-ict-officer",
    notes: "ICT officer",
  },
  {
    id: "user-quality-manager",
    username: "QuinnTaylor",
    employeeId: "emp-quality-manager",
    firstName: "Quinn",
    lastName: "Taylor",
    email: "quinn.taylor@abilityerp.local",
    roleId: "role-quality-manager",
    notes: "Quality manager",
  },
  {
    id: "user-quality-officer",
    username: "AudreyPatel",
    employeeId: "emp-staff-145",
    firstName: "Audrey",
    lastName: "Patel",
    email: "audrey.patel@abilityerp.local",
    roleId: "role-quality-officer",
    notes: "Quality officer",
  },
  {
    id: "user-rostering-officer",
    username: "MorganBlake",
    employeeId: "emp-rostering-officer",
    firstName: "Morgan",
    lastName: "Blake",
    email: "morgan.blake@abilityerp.local",
    roleId: "role-rostering-officer",
    notes: "Rostering officer",
  },
  {
    id: "user-finance-manager",
    username: "TessaNguyen",
    employeeId: "emp-finance-manager",
    firstName: "Tessa",
    lastName: "Nguyen",
    email: "tessa.nguyen@abilityerp.local",
    roleId: "role-finance-manager",
    notes: "Finance manager",
  },
  {
    id: "user-jessica",
    username: "JessicaHancock",
    employeeId: "emp-jessica",
    firstName: "Jessica",
    lastName: "Hancock",
    email: "jessica.hancock@abilityerp.local",
    roleId: "role-finance-officer",
    notes: "Contract administrator",
  },
  {
    id: "user-finance-officer",
    username: "NaomiSingh",
    employeeId: "emp-staff-147",
    firstName: "Naomi",
    lastName: "Singh",
    email: "naomi.singh@abilityerp.local",
    roleId: "role-finance-officer",
    notes: "Finance officer",
  },
  {
    id: "user-rose",
    username: "RoseDash",
    employeeId: "emp-rose",
    firstName: "Rose",
    lastName: "Dash",
    email: "rose.dash@abilityerp.local",
    roleId: "role-coordinator",
    notes: "Plan developer",
  },
  {
    id: "user-oliver",
    username: "OliverWilliams",
    employeeId: "emp-oliver",
    firstName: "Oliver",
    lastName: "Williams",
    email: "oliver.williams@abilityerp.local",
    roleId: "role-support-worker",
    notes: "Support worker (legacy slot)",
  },
];

export function leadershipUsersFromLinks(): AppUserRecord[] {
  return LEADERSHIP_LOGIN_LINKS.map((link) => ({
    id: link.id,
    username: link.username,
    email: link.email,
    firstName: link.firstName,
    lastName: link.lastName,
    phone: "",
    active: true,
    employeeBpId: link.employeeId,
    notes: link.notes,
    roleIds: [link.roleId],
  }));
}

export const LEADERSHIP_LOGIN_PASSWORDS: Record<string, string> = Object.fromEntries(
  LEADERSHIP_LOGIN_LINKS.map((link) => [link.username, "welcome"])
);
