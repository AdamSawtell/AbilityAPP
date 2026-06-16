"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LocationList } from "@/components/location-list";
import { LocationTabbedView } from "@/components/location-view";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useData } from "@/lib/data-store";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import type { LocationRecord } from "@/lib/location";
import { auditMetaFrom } from "@/lib/audit";

function LocationTabbedViewFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

export function LocationListView() {
  const { locations } = useData();
  return <LocationList records={locations} />;
}

export function LocationDetailView({ id }: { id: string }) {
  const { locations, upsertLocation } = useData();
  const { openLocation, setTabDirty, touchTab } = useWorkspace();
  const stored = locations.find((l) => l.id === id);
  const [draft, setDraft] = useState<LocationRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const location = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const tabKey = workspaceKey("location", id);

  useEffect(() => {
    if (!stored) return;
    openLocation(stored.id, stored.searchKey, stored.name);
  }, [id, stored, openLocation]);

  useEffect(() => {
    setTabDirty(tabKey, hasUnsavedChanges);
  }, [tabKey, hasUnsavedChanges, setTabDirty]);

  useEffect(() => {
    if (location) touchTab(tabKey, location.searchKey, location.name);
  }, [location, tabKey, touchTab]);

  if (!location) {
    return (
      <AppShell
        title="Location not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Locations", href: "/locations" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No location with ID {id}.</p>
        <Link href="/locations" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to locations
        </Link>
      </AppShell>
    );
  }

  function patchDraft(patch: Partial<LocationRecord>) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, ...patch, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onFieldChange(key: keyof LocationRecord, value: string) {
    patchDraft({ [key]: value });
  }

  function onSave() {
    if (!location) return;
    upsertLocation(location);
    setDraft(null);
    setSaved(true);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={location.name}
        subtitle={`${location.searchKey} · ${location.locationType}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Locations", href: "/locations" },
          { label: location.searchKey },
        ]}
        audit={
          stored
            ? {
                entityType: "location",
                entityId: stored.id,
                meta: auditMetaFrom(stored),
              }
            : undefined
        }
      >
        <Suspense fallback={<LocationTabbedViewFallback />}>
          <LocationTabbedView
            location={location}
            onChange={onFieldChange}
            onAlertsChange={(alerts) => patchDraft({ alerts })}
            onClientLinksChange={(clientLinks) => patchDraft({ clientLinks })}
            onEmployeeLinksChange={(employeeLinks) => patchDraft({ employeeLinks })}
            onProductLinksChange={(productLinks) => patchDraft({ productLinks })}
            onActivitiesChange={(activities) => patchDraft({ activities })}
          />
        </Suspense>
        {saved ? <p className="mt-4 text-sm text-emerald-700">Changes saved.</p> : null}
      </AppShell>
      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
