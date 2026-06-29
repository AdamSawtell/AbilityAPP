import type { ClientAnimalRow } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";

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

/** Animals relevant at a support location — blank location means all sites for this client. */
export function animalsAtSupportLocation(animals: ClientAnimalRow[], locationId: string): ClientAnimalRow[] {
  const active = activeClientAnimals(animals);
  if (!locationId.trim()) return active;
  return active.filter((a) => !a.locationId?.trim() || a.locationId === locationId);
}

export function clientHasActiveAssistanceAnimal(animals: ClientAnimalRow[]): boolean {
  return activeClientAnimals(animals).some((a) => a.role === "assistance" || a.role === "therapy");
}

export function animalSummaryForShift(
  animals: ClientAnimalRow[],
  allergyAlert: string,
  shiftLocationId = ""
): string | null {
  const active = animalsAtSupportLocation(animals, shiftLocationId);
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

export function animalShiftAlerts(
  animals: ClientAnimalRow[],
  allergyAlert: string,
  shiftLocationId = ""
): string[] {
  const alerts: string[] = [];
  if (allergyAlert.trim()) alerts.push(allergyAlert.trim());
  for (const animal of animalsAtSupportLocation(animals, shiftLocationId)) {
    if (animal.role === "assistance" || animal.role === "therapy") {
      alerts.push(`Assistance animal: ${animal.name || animal.animalType}`);
    }
    if (animal.allergies.trim()) {
      alerts.push(`${animal.name || "Animal"} allergy: ${animal.allergies.trim()}`);
    }
  }
  return alerts;
}

export type AnimalAtLocationRow = {
  client: ClientRecord;
  animal: ClientAnimalRow;
};

export function animalsRegisteredAtLocation(clients: ClientRecord[], locationId: string): AnimalAtLocationRow[] {
  if (!locationId.trim()) return [];
  const rows: AnimalAtLocationRow[] = [];
  for (const client of clients) {
    for (const animal of activeClientAnimals(client.animals ?? [])) {
      if (animal.locationId === locationId) {
        rows.push({ client, animal });
      }
    }
  }
  return rows.sort(
    (a, b) =>
      (a.animal.displayPriority || defaultAnimalDisplayPriority(a.animal.role)) -
        (b.animal.displayPriority || defaultAnimalDisplayPriority(b.animal.role)) ||
      a.client.name.localeCompare(b.client.name)
  );
}

export function animalDropdownOptionsForClient(
  client: ClientRecord,
  locations: LocationRecord[]
): {
  dropdowns: { animalSupportLocation: string[]; animalClientAddress: string[] };
  optionLabels: Record<string, string>;
} {
  const assignedLocations = locations.filter((location) =>
    location.clientLinks.some((link) => link.clientId === client.id)
  );
  const locationChoices = assignedLocations.length ? assignedLocations : locations;
  const optionLabels: Record<string, string> = {
    "": "All locations (follows participant)",
  };
  const animalSupportLocation = [""];
  for (const location of locationChoices) {
    animalSupportLocation.push(location.id);
    optionLabels[location.id] = `${location.searchKey} — ${location.name}`;
  }

  const animalClientAddress = [""];
  for (const address of client.locations ?? []) {
    animalClientAddress.push(address.id);
    optionLabels[address.id] = `${address.name}${address.address1 ? ` · ${address.address1}` : ""}`;
  }

  return {
    dropdowns: { animalSupportLocation, animalClientAddress },
    optionLabels,
  };
}
