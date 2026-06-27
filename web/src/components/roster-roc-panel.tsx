"use client";

import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import {
  buildRosterOfCaresFromCsv,
  generateRosterOfCareFromAgreement,
  parseRocCsv,
  ROC_CSV_HEADERS,
} from "@/lib/roc-csv-import";
import { rocWeekdayLabel, type RosterOfCareRecord } from "@/lib/roster-of-care";
import {
  buildShiftsFromRosterOfCare,
  buildShiftsFromRosterOfCares,
  validateRocPublishShifts,
  type RocRolloverScope,
} from "@/lib/roc-publish-shifts";
import { weekStartFromDate } from "@/lib/roster-shift";
import type { OrganizationRecord } from "@/lib/organization";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import type { RosterShiftRecord } from "@/lib/roster-shift";

const TEMPLATE_CSV = `client_search_key,day,start_time,end_time,support_type,location_search_key,worker_requirement,notes
BERN,Mon,09:00,15:00,Standard,GLEN-SIL,Support worker,SIL morning
BERN,Wed,14:00,20:00,Standard,GLEN-SIL,Support worker,Community access afternoon`;

export function RosterRocPanel() {
  const {
    clients,
    locations,
    employees,
    serviceAgreements,
    rosterOfCares,
    serviceBookings,
    rosterShifts,
    addRecurringRosterShifts,
    bulkUpsertRosterOfCares,
    upsertRosterOfCare,
  } = useData();
  const { organization } = useOrganization();
  const { session, canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("rostering");
  const actor = session?.displayName || "SuperUser";

  const [csvText, setCsvText] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [generateClientId, setGenerateClientId] = useState("");
  const [generateAgreementId, setGenerateAgreementId] = useState("");

  const activeRocs = useMemo(
    () => [...rosterOfCares].sort((a, b) => a.name.localeCompare(b.name)),
    [rosterOfCares]
  );

  const agreementsForClient = useMemo(() => {
    if (!generateClientId) return [];
    return serviceAgreements.filter(
      (a) => a.clientId === generateClientId && (a.status === "Active" || a.status === "Signed")
    );
  }, [generateClientId, serviceAgreements]);

  const handleImport = () => {
    setError("");
    setMessage("");
    const parsed = parseRocCsv(csvText);
    if (!parsed.ok) {
      setError(parsed.errors.join(" "));
      return;
    }
    const built = buildRosterOfCaresFromCsv(parsed.rows, clients, locations, rosterOfCares, actor);
    if (!built.ok) {
      setError(built.errors.join(" "));
      return;
    }
    bulkUpsertRosterOfCares(built.records);
    setMessage(`Imported ${built.records.length} roster of care record${built.records.length === 1 ? "" : "s"}.`);
    setCsvText("");
  };

  const handleGenerate = () => {
    setError("");
    setMessage("");
    const client = clients.find((c) => c.id === generateClientId);
    const agreement = serviceAgreements.find((a) => a.id === generateAgreementId);
    if (!client || !agreement) {
      setError("Select a client and active service agreement.");
      return;
    }
    const record = generateRosterOfCareFromAgreement(
      agreement,
      client,
      locations,
      rosterOfCares,
      actor
    );
    upsertRosterOfCare(record, { action: "imported" });
    setMessage(`Generated draft RoC for ${client.searchKey} from ${agreement.searchKey}.`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Import roster of care (CSV)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use the AbilityVua CSV template until your NDIS RoC export format is mapped. Columns:{" "}
          {ROC_CSV_HEADERS.join(", ")}.
        </p>
        {canEdit ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCsvText(TEMPLATE_CSV)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Load sample template
              </button>
            </div>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              placeholder="Paste CSV here…"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!csvText.trim()}
              className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
            >
              Import CSV
            </button>
          </>
        ) : null}
      </section>

      {canEdit ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Roster rollover defaults</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manual bulk publish uses these organisation defaults now. The same settings are ready for a scheduled
            rollover worker later.
          </p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Mode</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {organization.rosterRolloverEnabled ? "Config defaults on" : "Manual only"}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Maintain ahead</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {organization.rosterRolloverLookaheadWeeks} weeks
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Default status</dt>
              <dd className="mt-1 font-medium text-slate-900">{organization.rosterRolloverDefaultStatus}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Duplicates</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {organization.rosterRolloverSkipExisting ? "Skip existing" : "Allow overwrite"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {canEdit ? (
        <BulkRolloverPanel
          clients={clients}
          locations={locations}
          rosterOfCares={rosterOfCares}
          serviceBookings={serviceBookings}
          rosterShifts={rosterShifts}
          organization={organization}
          actor={actor}
          addRecurringRosterShifts={addRecurringRosterShifts}
        />
      ) : null}

      {canEdit ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Generate from service agreement</h2>
          <p className="mt-1 text-sm text-slate-600">
            Build a draft weekly RoC from an active agreement schedule — coordinators refine before rostering.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Client</span>
              <select
                value={generateClientId}
                onChange={(e) => {
                  setGenerateClientId(e.target.value);
                  setGenerateAgreementId("");
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.searchKey} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Service agreement</span>
              <select
                value={generateAgreementId}
                onChange={(e) => setGenerateAgreementId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={!generateClientId}
              >
                <option value="">Select agreement</option>
                {agreementsForClient.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.searchKey} ({a.status})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!generateClientId || !generateAgreementId}
            className="mt-3 rounded-lg border border-[#b51266] bg-white px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60"
          >
            Generate draft RoC
          </button>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Rosters of care</h2>
        {activeRocs.length ? (
          <ul className="mt-4 space-y-4">
            {activeRocs.map((roc) => (
              <RocCard
                key={roc.id}
                roc={roc}
                clients={clients}
                employees={employees}
                locations={locations}
                allRocs={rosterOfCares}
                organization={organization}
                canEdit={canEdit}
                actor={actor}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No roster of care records yet. Import CSV or generate from an agreement.</p>
        )}
      </section>
    </div>
  );
}

function RocCard({
  roc,
  clients,
  employees,
  locations,
  allRocs,
  organization,
  canEdit,
  actor,
}: {
  roc: RosterOfCareRecord;
  clients: { id: string; searchKey: string; name: string }[];
  employees: { id: string; searchKey: string; name: string }[];
  locations: { id: string; searchKey: string }[];
  allRocs: RosterOfCareRecord[];
  organization: OrganizationRecord;
  canEdit: boolean;
  actor: string;
}) {
  const { serviceBookings, rosterShifts, addRecurringRosterShifts } = useData();
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(new Date().toISOString().slice(0, 10)));
  const [weekCount, setWeekCount] = useState(() =>
    organization.rosterRolloverEnabled ? organization.rosterRolloverLookaheadWeeks : 4
  );
  const [shiftStatus, setShiftStatus] = useState<"Draft" | "Published">(() =>
    organization.rosterRolloverEnabled ? organization.rosterRolloverDefaultStatus : "Draft"
  );
  const [skipExisting, setSkipExisting] = useState(() =>
    organization.rosterRolloverEnabled ? organization.rosterRolloverSkipExisting : true
  );
  const [publishError, setPublishError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  const client = clients.find((c) => c.id === roc.clientId);
  const locationLabel = (id: string) => locations.find((l) => l.id === id)?.searchKey || id || "—";
  const workerLabel = (id: string) => employees.find((e) => e.id === id)?.searchKey || id || "—";

  const previewWithoutSkip = buildShiftsFromRosterOfCare(
    roc,
    { weekStart, weekCount, status: shiftStatus, actor, skipExisting: false },
    rosterShifts,
    serviceBookings,
    allRocs
  );
  const preview = buildShiftsFromRosterOfCare(
    roc,
    { weekStart, weekCount, status: shiftStatus, actor, skipExisting },
    rosterShifts,
    serviceBookings,
    allRocs
  );
  const allSkippedByExisting =
    skipExisting && previewWithoutSkip.shifts.length > 0 && preview.shifts.length === 0;
  const validation = preview.shifts.length
    ? validateRocPublishShifts(preview.shifts, rosterShifts)
    : validateRocPublishShifts([], rosterShifts, { allSkippedByExisting });

  function handlePublish() {
    setPublishError("");
    setPublishMessage("");
    if (allSkippedByExisting) {
      setPublishMessage("All dates in this range were already published from this RoC.");
      return;
    }
    if (validation.blocked) {
      setPublishError(validation.errors.join(" "));
      return;
    }
    const saveError = addRecurringRosterShifts(preview.shifts);
    if (saveError) {
      setPublishError(saveError);
      return;
    }
    const note =
      validation.warnings.length || preview.warnings.length
        ? ` Warnings: ${[...validation.warnings, ...preview.warnings].slice(0, 3).join(" ")}`
        : "";
    setPublishMessage(
      `Published ${preview.shifts.length} ${shiftStatus.toLowerCase()} shift${preview.shifts.length === 1 ? "" : "s"} to the roster calendar.${note}`
    );
  }

  return (
    <li className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{roc.name}</p>
          {client ? (
            <ClientRecordLink
              id={client.id}
              searchKey={client.searchKey}
              name={client.name}
              className="text-sm text-[#b51266] hover:underline"
            />
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {roc.status} · {roc.source} · {roc.lines.length} weekly line{roc.lines.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {roc.lines.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pr-3 py-1">Day</th>
                <th className="pr-3 py-1">Time</th>
                <th className="pr-3 py-1">Type</th>
                <th className="pr-3 py-1">Location</th>
                <th className="pr-3 py-1">Worker</th>
                <th className="pr-3 py-1">Ratio</th>
                <th className="pr-3 py-1">Session</th>
                <th className="py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {roc.lines.map((line) => (
                <tr key={line.id} className="border-t border-slate-200/80 text-slate-700">
                  <td className="pr-3 py-1">{rocWeekdayLabel(line.weekday)}</td>
                  <td className="pr-3 py-1">
                    {line.startTime} – {line.endTime}
                  </td>
                  <td className="pr-3 py-1">{line.supportType}</td>
                  <td className="pr-3 py-1">{locationLabel(line.locationId)}</td>
                  <td className="pr-3 py-1">
                    {line.defaultEmployeeId ? workerLabel(line.defaultEmployeeId) : line.workerRequirement || "—"}
                  </td>
                  <td className="pr-3 py-1">{line.supportRatio || "1:1"}</td>
                  <td className="pr-3 py-1">{line.sessionKey?.trim() || "—"}</td>
                  <td className="py-1">{line.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {canEdit && roc.lines.length ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publish to roster</h3>
          <p className="mt-1 text-xs text-slate-600">
            Create {shiftStatus.toLowerCase()} shifts from weekly lines for the selected weeks. Lines with the same
            session key at the same time and location publish to one live session. Vacant shifts stay Draft until a
            worker is assigned.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-slate-700">Week starting</span>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(weekStartFromDate(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-slate-700">Weeks</span>
              <select
                value={weekCount}
                onChange={(e) => setWeekCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                {[1, 2, 3, 4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} week{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-slate-700">Shift status</span>
              <select
                value={shiftStatus}
                onChange={(e) => setShiftStatus(e.target.value as "Draft" | "Published")}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="Draft">Draft (vacant OK)</option>
                <option value="Published">Published (worker required)</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="rounded border-slate-300"
              />
              Skip dates already published from this RoC
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Preview: {preview.shifts.length} shift{preview.shifts.length === 1 ? "" : "s"}
            {preview.skippedLines.length
              ? ` · ${preview.skippedLines.length} line${preview.skippedLines.length === 1 ? "" : "s"} skipped (missing location)`
              : ""}
          </p>
          {validation.errors.length ? (
            <p className="mt-2 text-xs text-rose-700">{validation.errors.slice(0, 2).join(" ")}</p>
          ) : null}
          {validation.warnings.length || preview.warnings.length ? (
            <p className="mt-2 text-xs text-amber-800">
              {[...validation.warnings, ...preview.warnings].slice(0, 2).join(" ")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handlePublish}
            disabled={(!preview.shifts.length && !allSkippedByExisting) || validation.blocked}
            className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
          >
            Publish {preview.shifts.length} shift{preview.shifts.length === 1 ? "" : "s"}
          </button>
          {publishError ? (
            <p className="mt-2 text-xs text-rose-700">{publishError}</p>
          ) : null}
          {publishMessage ? (
            <p className="mt-2 text-xs text-emerald-800">{publishMessage}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function BulkRolloverPanel({
  clients,
  locations,
  rosterOfCares,
  serviceBookings,
  rosterShifts,
  organization,
  actor,
  addRecurringRosterShifts,
}: {
  clients: ClientRecord[];
  locations: LocationRecord[];
  rosterOfCares: RosterOfCareRecord[];
  serviceBookings: ServiceBookingRecord[];
  rosterShifts: RosterShiftRecord[];
  organization: OrganizationRecord;
  actor: string;
  addRecurringRosterShifts: (records: RosterShiftRecord[]) => string | null;
}) {
  const [scopeKind, setScopeKind] = useState<RocRolloverScope["kind"]>("all");
  const [clientId, setClientId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(new Date().toISOString().slice(0, 10)));
  const [weekCount, setWeekCount] = useState(() =>
    organization.rosterRolloverEnabled ? organization.rosterRolloverLookaheadWeeks : 4
  );
  const [shiftStatus, setShiftStatus] = useState<"Draft" | "Published">(() =>
    organization.rosterRolloverEnabled ? organization.rosterRolloverDefaultStatus : "Draft"
  );
  const [skipExisting, setSkipExisting] = useState(() =>
    organization.rosterRolloverEnabled ? organization.rosterRolloverSkipExisting : true
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeRocs = useMemo(() => rosterOfCares.filter((roc) => roc.status === "Active"), [rosterOfCares]);

  const clientOptions = useMemo(() => {
    const ids = new Set(activeRocs.map((roc) => roc.clientId));
    return clients.filter((c) => ids.has(c.id)).sort((a, b) => a.searchKey.localeCompare(b.searchKey));
  }, [activeRocs, clients]);

  const locationOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const roc of activeRocs) {
      for (const line of roc.lines) {
        if (line.locationId?.trim()) ids.add(line.locationId);
      }
    }
    return locations.filter((l) => ids.has(l.id)).sort((a, b) => a.searchKey.localeCompare(b.searchKey));
  }, [activeRocs, locations]);

  const scope: RocRolloverScope | null = useMemo(() => {
    if (scopeKind === "client") return clientId ? { kind: "client", clientId } : null;
    if (scopeKind === "location") return locationId ? { kind: "location", locationId } : null;
    return { kind: "all" };
  }, [scopeKind, clientId, locationId]);

  const input = useMemo(
    () => ({ weekStart, weekCount, status: shiftStatus, actor }),
    [weekStart, weekCount, shiftStatus, actor]
  );

  const previewWithoutSkip = useMemo(
    () =>
      scope
        ? buildShiftsFromRosterOfCares(scope, { ...input, skipExisting: false }, rosterShifts, serviceBookings, rosterOfCares)
        : null,
    [scope, input, rosterShifts, serviceBookings, rosterOfCares]
  );
  const preview = useMemo(
    () =>
      scope
        ? buildShiftsFromRosterOfCares(scope, { ...input, skipExisting }, rosterShifts, serviceBookings, rosterOfCares)
        : null,
    [scope, input, skipExisting, rosterShifts, serviceBookings, rosterOfCares]
  );

  const allSkippedByExisting =
    skipExisting && (previewWithoutSkip?.shifts.length ?? 0) > 0 && (preview?.shifts.length ?? 0) === 0;
  const validation = preview
    ? validateRocPublishShifts(preview.shifts, rosterShifts, { allSkippedByExisting })
    : null;

  function handlePublish() {
    setError("");
    setMessage("");
    if (!scope || !preview) {
      setError("Select a rollover scope.");
      return;
    }
    if (allSkippedByExisting) {
      setMessage("All shifts in this range were already published.");
      return;
    }
    if (validation?.blocked) {
      setError(validation.errors.join(" "));
      return;
    }
    const saveError = addRecurringRosterShifts(preview.shifts);
    if (saveError) {
      setError(saveError);
      return;
    }
    const note =
      (validation?.warnings.length ?? 0) || preview.warnings.length
        ? ` Warnings: ${[...(validation?.warnings ?? []), ...preview.warnings].slice(0, 3).join(" ")}`
        : "";
    setMessage(
      `Published ${preview.shifts.length} ${shiftStatus.toLowerCase()} shift${preview.shifts.length === 1 ? "" : "s"} from ${preview.rocCount} roster of care template${preview.rocCount === 1 ? "" : "s"}.${note}`
    );
  }

  const scopeIncomplete =
    (scopeKind === "client" && !clientId) || (scopeKind === "location" && !locationId);
  const previewCount = preview?.shifts.length ?? 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Bulk rollover</h2>
      <p className="mt-1 text-sm text-slate-600">
        Roll forward live shifts from active rosters of care in one action — for every participant, one client, or one
        location. Lines that share a session key publish to one shared session.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-slate-700">Scope</span>
          <select
            value={scopeKind}
            onChange={(e) => {
              setScopeKind(e.target.value as RocRolloverScope["kind"]);
              setMessage("");
              setError("");
            }}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">All active rosters of care</option>
            <option value="client">By client</option>
            <option value="location">By location</option>
          </select>
        </label>
        {scopeKind === "client" ? (
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-slate-700">Client</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="">Select client</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.searchKey} — {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {scopeKind === "location" ? (
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-slate-700">Location</span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="">Select location</option>
              {locationOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.searchKey}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-slate-700">Week starting</span>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(weekStartFromDate(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-slate-700">Weeks</span>
          <select
            value={weekCount}
            onChange={(e) => setWeekCount(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            {[1, 2, 3, 4, 6, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n} week{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-slate-700">Shift status</span>
          <select
            value={shiftStatus}
            onChange={(e) => setShiftStatus(e.target.value as "Draft" | "Published")}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="Draft">Draft (vacant OK)</option>
            <option value="Published">Published (worker required)</option>
          </select>
        </label>
        <label className="flex items-end gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={skipExisting}
            onChange={(e) => setSkipExisting(e.target.checked)}
            className="rounded border-slate-300"
          />
          Skip dates already published
        </label>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        Preview: {previewCount} shift{previewCount === 1 ? "" : "s"} across {preview?.rocCount ?? 0} roster of care
        template{(preview?.rocCount ?? 0) === 1 ? "" : "s"}
        {preview?.skippedLines.length
          ? ` · ${preview.skippedLines.length} line${preview.skippedLines.length === 1 ? "" : "s"} skipped (missing location)`
          : ""}
      </p>
      {validation?.errors.length ? (
        <p className="mt-2 text-xs text-rose-700">{validation.errors.slice(0, 2).join(" ")}</p>
      ) : null}
      {validation?.warnings.length || preview?.warnings.length ? (
        <p className="mt-2 text-xs text-amber-800">
          {[...(validation?.warnings ?? []), ...(preview?.warnings ?? [])].slice(0, 2).join(" ")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handlePublish}
        disabled={scopeIncomplete || (!previewCount && !allSkippedByExisting) || validation?.blocked}
        className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
      >
        Publish {previewCount} shift{previewCount === 1 ? "" : "s"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-800">{message}</p> : null}
    </section>
  );
}
