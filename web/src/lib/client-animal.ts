import type { ClientAnimalRow } from "@/lib/client-line-tables";

export type ClientAnimalRole = "assistance" | "companion" | "therapy";
export type ClientAnimalStatus = "active" | "deceased" | "transferred";

/** Default NDIS billing boundary — assistance/therapy care may be billable; companion is not. */
export const ANIMAL_ROLE_BILLABLE: Record<ClientAnimalRole, boolean> = {
  assistance: true,
  therapy: true,
  companion: false,
};

export function isAnimalRoleBillable(role: string): boolean {
  return ANIMAL_ROLE_BILLABLE[role as ClientAnimalRole] ?? false;
}

export function defaultAnimalDisplayPriority(role: string): number {
  if (role === "assistance") return 1;
  if (role === "therapy") return 2;
  if (role === "companion") return 3;
  return 10;
}

export function sortClientAnimals<T extends Pick<ClientAnimalRow, "displayPriority" | "role" | "lineNo">>(
  rows: T[]
): T[] {
  return [...rows].sort(
    (a, b) =>
      (a.displayPriority || defaultAnimalDisplayPriority(a.role)) -
        (b.displayPriority || defaultAnimalDisplayPriority(b.role)) ||
      a.lineNo - b.lineNo
  );
}

export function activeClientAnimals(animals: ClientAnimalRow[]): ClientAnimalRow[] {
  return sortClientAnimals(animals.filter((a) => a.status === "active"));
}

export function clientHasActiveAssistanceAnimal(animals: ClientAnimalRow[]): boolean {
  return activeClientAnimals(animals).some((a) => a.role === "assistance" || a.role === "therapy");
}

export function animalSummaryForShift(animals: ClientAnimalRow[], allergyAlert: string): string | null {
  const active = activeClientAnimals(animals);
  if (!active.length && !allergyAlert.trim()) return null;
  const parts: string[] = [];
  if (allergyAlert.trim()) parts.push("Animal allergy alert");
  if (active.length) {
    const assistance = active.filter((a) => a.role === "assistance" || a.role === "therapy").length;
    parts.push(
      `${active.length} animal${active.length === 1 ? "" : "s"}${assistance ? ` · ${assistance} assistance` : ""}`
    );
  }
  return parts.join(" · ");
}

export function animalShiftAlerts(animals: ClientAnimalRow[], allergyAlert: string): string[] {
  const alerts: string[] = [];
  if (allergyAlert.trim()) alerts.push(allergyAlert.trim());
  for (const animal of activeClientAnimals(animals)) {
    if (animal.role === "assistance" || animal.role === "therapy") {
      alerts.push(`Assistance animal: ${animal.name || animal.animalType}`);
    }
    if (animal.allergies.trim()) {
      alerts.push(`${animal.name || "Animal"} allergy: ${animal.allergies.trim()}`);
    }
  }
  return alerts;
}
