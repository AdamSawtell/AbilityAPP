"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LineItemTable } from "@/components/line-item-table";
import { useAuth } from "@/lib/auth-store";
import {
  activeClientAnimals,
  ANIMAL_ROLE_BILLABLE,
  sortClientAnimals,
} from "@/lib/client-animal";
import { animalTableConfig, type ClientAnimalRow } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";
import { useData } from "@/lib/data-store";
import { emptyIncident } from "@/lib/incident";
import { defaultReferenceData } from "@/lib/reference-data";

function roleLabel(role: string): string {
  if (role === "assistance") return "Assistance animal";
  if (role === "therapy") return "Therapy animal";
  if (role === "companion") return "Companion pet";
  return role;
}

function AnimalIncidentActions({
  client,
  animals,
  readOnly,
}: {
  client: ClientRecord;
  animals: ClientAnimalRow[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const { addIncident, incidents } = useData();
  const { session } = useAuth();
  const [incidentType, setIncidentType] = useState(defaultReferenceData.animalIncidentType[0] ?? "");
  const [animalId, setAnimalId] = useState(animals[0]?.id ?? "");

  useEffect(() => {
    if (!animals.length) {
      setAnimalId("");
      return;
    }
    if (!animals.some((a) => a.id === animalId)) {
      setAnimalId(animals[0]!.id);
    }
  }, [animals, animalId]);

  const selectedAnimal = animals.find((a) => a.id === animalId);
  const canReport = Boolean(selectedAnimal?.id);
  const linkedIncidents = incidents.filter(
    (i) => i.primaryClientId === client.id && i.linkedAnimalId?.trim()
  );

  function reportIncident() {
    if (readOnly || !canReport || !selectedAnimal) return;
    const actor = session?.displayName ?? session?.username ?? "User";
    const animalLabel = selectedAnimal?.name?.trim() || selectedAnimal?.animalType || "animal";
    const incident = addIncident({
      ...emptyIncident(),
      title: `Animal incident — ${animalLabel}`,
      description: `${incidentType} involving ${animalLabel}${
        selectedAnimal?.role ? ` (${roleLabel(selectedAnimal.role)})` : ""
      }.`,
      category: "Operational",
      primaryClientId: client.id,
      linkedAnimalId: selectedAnimal?.id ?? "",
      status: "Draft",
      createdBy: actor,
      updatedBy: actor,
    });
    router.push(`/incidents/${incident.id}`);
  }

  if (readOnly) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-medium text-slate-900">Report animal-related incident</p>
      <p className="mt-1 text-xs text-slate-600">
        Opens a draft incident linked to this client and animal record.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block text-xs font-medium text-slate-700">
          Incident type
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="mt-1 block w-full min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {defaultReferenceData.animalIncidentType.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        {animals.length ? (
          <label className="block text-xs font-medium text-slate-700">
            Animal
            <select
              value={animalId}
              onChange={(e) => setAnimalId(e.target.value)}
              className="mt-1 block w-full min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name || animal.animalType} ({roleLabel(animal.role)})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          onClick={reportIncident}
          disabled={!canReport}
          className="min-h-10 rounded-lg border border-[#b51266] bg-white px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Report animal-related incident
        </button>
      </div>
      {linkedIncidents.length ? (
        <ul className="mt-4 space-y-1 text-sm text-slate-700">
          {linkedIncidents.map((incident) => {
            const linked = animals.find((a) => a.id === incident.linkedAnimalId);
            return (
              <li key={incident.id}>
                <Link href={`/incidents/${incident.id}`} className="font-medium text-[#b51266] hover:underline">
                  {incident.documentNo || incident.title}
                </Link>
                {linked ? ` · ${linked.name || linked.animalType}` : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function ClientAnimalsPanel({
  client,
  readOnly,
  onLineItemsChange,
  onAllergyAlertChange,
}: {
  client: ClientRecord;
  readOnly: boolean;
  onLineItemsChange: (rows: ClientAnimalRow[]) => void;
  onAllergyAlertChange: (value: string) => void;
}) {
  const animals = useMemo(() => sortClientAnimals(client.animals ?? []), [client.animals]);
  const active = activeClientAnimals(animals);
  const billableRoles = useMemo(
    () =>
      Object.entries(ANIMAL_ROLE_BILLABLE)
        .filter(([, billable]) => billable)
        .map(([role]) => roleLabel(role))
        .join(", "),
    []
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-3 text-sm text-amber-950">
        <p className="font-medium">NDIS billing boundary</p>
        <p className="mt-1 text-xs leading-relaxed">
          {billableRoles} care may be included in billable support hours when documented in the support plan.
          Companion pet care is never NDIS-billable — time tracking should exclude companion-only tasks.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Animal allergy alert (profile header)
        </span>
        <textarea
          rows={2}
          value={client.animalAllergyAlert ?? ""}
          readOnly={readOnly}
          onChange={(e) => onAllergyAlertChange(e.target.value)}
          placeholder="e.g. Staff allergic to cats — do not enter with pets"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      {client.animalAllergyAlert?.trim() ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          <span className="font-medium">Allergy alert: </span>
          {client.animalAllergyAlert.trim()}
        </p>
      ) : null}

      {active.some((a) => a.role === "assistance" || a.role === "therapy") ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          <span className="font-medium">Assistance animal on site — </span>
          {active
            .filter((a) => a.role === "assistance" || a.role === "therapy")
            .map((a) => a.name || a.animalType)
            .join(", ")}
        </p>
      ) : null}

      <LineItemTable
        config={animalTableConfig}
        rows={animals}
        readOnly={readOnly}
        onChange={onLineItemsChange}
      />

      <AnimalIncidentActions client={client} animals={animals} readOnly={readOnly} />
    </div>
  );
}
