import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import { ALL_PROCESS_IDS, ALL_WINDOW_KEYS } from "@/lib/access/catalog";

export const SEED_USERS: AppUserRecord[] = [
  {
    id: "user-superuser",
    username: "SuperUser",
    email: "superuser@abilityerp.local",
    firstName: "Super",
    lastName: "User",
    phone: "",
    active: true,
    employeeBpId: "",
    notes: "Full access administrator (AbilityERP SuperUser equivalent)",
    roleIds: ["role-admin"],
  },
  {
    id: "user-isla",
    username: "IslaRobinson",
    email: "isla.robinson@abilityerp.local",
    firstName: "Isla",
    lastName: "Robinson",
    phone: "",
    active: true,
    employeeBpId: "emp-isla",
    notes: "Intake and client coordination",
    roleIds: ["role-intake", "role-coordinator"],
  },
  {
    id: "user-gabriela",
    username: "GabrielaWilson",
    email: "gabriela.wilson@abilityerp.local",
    firstName: "Gabriela",
    lastName: "Wilson",
    phone: "",
    active: true,
    employeeBpId: "emp-gabriela",
    notes: "Enquiry processing",
    roleIds: ["role-intake"],
  },
];

export const SEED_ROLES: AppRoleRecord[] = [
  {
    id: "role-admin",
    roleKey: "AbilityERP_Admin",
    name: "AbilityERP Admin",
    description: "Full system access — all windows and processes",
    active: true,
    windowKeys: [...ALL_WINDOW_KEYS],
    processIds: [...ALL_PROCESS_IDS],
  },
  {
    id: "role-intake",
    roleKey: "Intake_Coordinator",
    name: "Intake Coordinator",
    description: "Enquiries and convert-to-client process",
    active: true,
    windowKeys: ["home", "enquiries", "clients"],
    processIds: ["enquiry-to-client"],
  },
  {
    id: "role-coordinator",
    roleKey: "Support_Coordinator",
    name: "Support Coordinator",
    description: "Client records and service catalog (no admin)",
    active: true,
    windowKeys: ["home", "clients", "products", "price-lists", "service-agreements"],
    processIds: [],
  },
];
