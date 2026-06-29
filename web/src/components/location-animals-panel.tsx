"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { animalsRegisteredAtLocation } from "@/lib/client-animal";
import type { LocationRecord } from "@/lib/location";
import type { ClientRecord } from "@/lib/client";

function roleLabel(role: string): string {
  if (role === "assistance") return "Assistance animal";
  if (role === "therapy") return "Therapy animal";
  if (role === "companion") return "Companion pet";
  return role;
}

export function LocationAnimalsPanel({
  location,
  clients,
}: {
  location: LocationRecord;
  clients: ClientRecord[];
}) {
  const rows = useMemo(
    () => animalsRegisteredAtLocation(clients, location.id),
    [clients, location.id]
  );

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Animals on site</h3>
        <p className="mt-2 text-sm text-slate-600">
          No animals are linked to this support location yet. Assign a support location on each animal in the
          client&apos;s Animal and Pet tab.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Animals on site</h3>
      <p className="mt-1 text-sm text-slate-500">
        Participant animals registered at {location.name}. Workers on shifts here see matching rows on My shifts.
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map(({ client, animal }) => (
          <li key={animal.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{animal.name || animal.animalType}</p>
                <p className="text-sm text-slate-600">
                  {roleLabel(animal.role)}
                  {animal.breed ? ` · ${animal.breed}` : ""}
                </p>
              </div>
              <ClientRecordLink
                id={client.id}
                searchKey={client.searchKey}
                name={client.name}
                className="text-sm font-medium text-[#b51266] hover:underline"
              />
            </div>
            {animal.allergies.trim() ? (
              <p className="mt-2 text-xs text-rose-900">Allergy / risk: {animal.allergies.trim()}</p>
            ) : null}
            <Link
              href={`/clients/${client.id}?tab=${encodeURIComponent("Animal and Pet")}`}
              className="mt-2 inline-block text-xs font-medium text-[#b51266] hover:underline"
            >
              Open animal record
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
