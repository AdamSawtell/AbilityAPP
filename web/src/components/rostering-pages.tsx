"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AgencyShiftRequestDrawer } from "@/components/agency-shift-request-drawer";
import { OpenShiftsMarketplacePanel } from "@/components/open-shifts-marketplace-panel";
import { RosterCapacityPanel } from "@/components/roster-capacity-panel";
import { RosterForwardPanel } from "@/components/roster-forward-panel";
import { RosterGapsPanel } from "@/components/roster-gaps-panel";
import { RosterFortnightReviewPanel } from "@/components/roster-fortnight-review-panel";
import { RosterPublishWeekPanel } from "@/components/roster-publish-week-panel";
import { RosterRocPanel } from "@/components/roster-roc-panel";
import { PayPeriodSelector } from "@/components/pay-period-admin-panel";
import { ContractedHoursPanel } from "@/components/contracted-hours-panel";
import { RosterShiftEditor } from "@/components/roster-shift-editor";
import { ClientRecordLink, EmployeeRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { agencyWorkerDisplayName } from "@/lib/agency-worker";
import { localDateIso } from "@/lib/booking-cancellation";
import { useData } from "@/lib/data-store";
import {
  addDaysIso,
  formatDayHeading,
  formatShiftTimeRange,
  isAgencyCoveredShift,
  normalizeRosterShift,
  resolveRosterWeekStart,
  shiftsForWeek,
  weekStartFromDate,
} from "@/lib/roster-shift";
import { isBuddyShift, isShiftBillable, isTrainingOrMeetingPurpose, normalizeShiftPurpose } from "@/lib/buddy-shift";
import { detectRosterShiftConflicts } from "@/lib/roster-shift-conflicts";
import { rosterValidationMode } from "@/lib/roster-shift-compliance";
import { gapsForWeek, isVacantShift, type RosterGap } from "@/lib/roster-gap-analysis";
import { listOpenMarketplaceShifts } from "@/lib/roster-open-shifts";
import { shiftCheckInStatus, shiftCheckInStatusLabel } from "@/lib/roster-shift-checkin";
import { hasShiftGeo } from "@/lib/geolocation";
import { ShiftGeoLinks } from "@/components/shift-geo-links";
import { ShiftGeofenceAlerts } from "@/components/shift-geofence-alerts";
import { shiftGeofenceAlerts, shiftHasGeofenceAlert } from "@/lib/shift-geofence";
import { canRescheduleShiftByDrag, rescheduledShiftOnDate } from "@/lib/roster-shift-reschedule";
import {
  buildRosterWeekCsv,
  downloadRosterWeekCsv,
  rosterWeekCsvFilename,
} from "@/lib/roster-week-csv-export";
import { findCurrentPayPeriodInstance } from "@/lib/pay-period";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type RosterView = "week" | "forward" | "review" | "gaps" | "open" | "roc" | "capacity";

function rosterViewFromParam(value: string | null): RosterView {
  return value === "forward" ||
    value === "review" ||
    value === "gaps" ||
    value === "open" ||
    value === "roc" ||
    value === "capacity"
    ? value
    : "week";
}

export function RosteringWeekView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    clients,
    employees,
    locations,
    serviceBookings,
    rosterOfCares,
    rosterShifts,
    rosterShiftRequests,
    agencyWorkers,
    businessPartners,
    upsertRosterShift,
    approveShiftRequest,
    rejectShiftRequest,
    setShiftCriticalFill,
    payPeriodInstances,
  } = useData();
  const { session, canWriteWindow, canProcess } = useAuth();
  const actor = session?.displayName ?? "SuperUser";
  const canEditRoster = canWriteWindow("rostering");
  const canRequestAgency = canProcess("request-agency-coverage");
  const dragStartedRef = useRef(false);
  const [view, setViewState] = useState<RosterView>(() => rosterViewFromParam(searchParams.get("view")));
  const [forwardWeeks, setForwardWeeks] = useState(8);
  const [weekStart, setWeekStartState] = useState(() =>
    resolveRosterWeekStart(searchParams.get("week"), localDateIso())
  );
  const queryString = searchParams.toString();

  useEffect(() => {
    setViewState(rosterViewFromParam(searchParams.get("view")));
    setWeekStartState(resolveRosterWeekStart(searchParams.get("week"), localDateIso()));
  }, [queryString, searchParams]);

  function setWeekStart(next: string) {
    setWeekStartState(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", next);
    if (view !== "week") params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setView(next: RosterView, nextWeekStart = weekStart) {
    setViewState(next);
    setWeekStartState(nextWeekStart);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", nextWeekStart);
    if (next === "week") params.delete("view");
    else params.set("view", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToCurrentWeek() {
    setWeekStart(weekStartFromDate(localDateIso()));
  }
  const [editorShift, setEditorShift] = useState<ReturnType<typeof normalizeRosterShift> | null | "new">(null);
  const [newShiftDate, setNewShiftDate] = useState("");
  const [editorPrefill, setEditorPrefill] = useState<{ clientId?: string; serviceBookingId?: string } | null>(null);
  const [buddyFromPrimary, setBuddyFromPrimary] = useState<ReturnType<typeof normalizeRosterShift> | null>(null);
  const [dragShiftId, setDragShiftId] = useState<string | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<string | null>(null);
  const [rescheduleNotice, setRescheduleNotice] = useState<{ tone: "error" | "success"; message: string } | null>(
    null
  );
  const [agencyShift, setAgencyShift] = useState<ReturnType<typeof normalizeRosterShift> | null>(null);
  const [payPeriodInstanceId, setPayPeriodInstanceId] = useState(() => {
    const current = findCurrentPayPeriodInstance(payPeriodInstances, localDateIso());
    return current?.id ?? "";
  });

  useEffect(() => {
    if (payPeriodInstanceId) return;
    const current = findCurrentPayPeriodInstance(payPeriodInstances, localDateIso());
    if (current) setPayPeriodInstanceId(current.id);
  }, [payPeriodInstances, payPeriodInstanceId]);

  const shifts = useMemo(
    () => shiftsForWeek(rosterShifts.map(normalizeRosterShift), weekStart),
    [rosterShifts, weekStart]
  );

  const days = useMemo(() => DAY_LABELS.map((_, index) => addDaysIso(weekStart, index)), [weekStart]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, typeof shifts>();
    for (const day of days) map.set(day, []);
    for (const shift of shifts) {
      map.get(shift.shiftDate)?.push(shift);
    }
    return map;
  }, [days, shifts]);

  const conflictByShiftId = useMemo(() => {
    const all = rosterShifts.map(normalizeRosterShift);
    const map = new Map<string, ReturnType<typeof detectRosterShiftConflicts>>();
    for (const shift of all) {
      const mode = rosterValidationMode(shift);
      const issues = detectRosterShiftConflicts(shift, { existing: all }).map((issue) =>
        mode === "publish" && issue.severity === "warning" ? { ...issue, severity: "error" as const } : issue
      );
      if (issues.length) map.set(shift.id, issues);
    }
    return map;
  }, [rosterShifts]);

  const weekGaps = useMemo(
    () => gapsForWeek(weekStart, rosterShifts.map(normalizeRosterShift), serviceBookings),
    [weekStart, rosterShifts, serviceBookings]
  );

  const openShiftCount = useMemo(
    () => listOpenMarketplaceShifts(rosterShifts).length,
    [rosterShifts]
  );

  function handleFillGap(gap: RosterGap) {
    if (gap.code === "VACANT_SHIFT" && gap.shiftId) {
      const shift = rosterShifts.find((s) => s.id === gap.shiftId);
      if (shift) {
        setEditorPrefill(null);
        setEditorShift(normalizeRosterShift(shift));
      }
      return;
    }
    if (gap.code === "COVERAGE_GAP") {
      setNewShiftDate(gap.weekStart ?? weekStart);
      setEditorPrefill({
        clientId: gap.clientId,
        serviceBookingId: gap.serviceBookingId,
      });
      setEditorShift("new");
      setView("week");
    }
  }

  function handleRequestAgency(gap: RosterGap) {
    if (!gap.shiftId) return;
    const shift = rosterShifts.find((s) => s.id === gap.shiftId);
    if (shift) setAgencyShift(normalizeRosterShift(shift));
  }

  function openNewShift(date?: string) {
    setEditorPrefill(null);
    setNewShiftDate(date ?? weekStart);
    setEditorShift("new");
  }

  function handleShiftDragStart(shift: ReturnType<typeof normalizeRosterShift>, event: React.DragEvent) {
    const gate = canRescheduleShiftByDrag(shift);
    if (!gate.allowed) {
      event.preventDefault();
      setRescheduleNotice({ tone: "error", message: gate.reason ?? "This shift cannot be dragged." });
      return;
    }
    dragStartedRef.current = true;
    setDragShiftId(shift.id);
    setRescheduleNotice(null);
    event.dataTransfer.setData("text/plain", shift.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleShiftDragEnd() {
    setDragShiftId(null);
    setDropTargetDay(null);
    window.setTimeout(() => {
      dragStartedRef.current = false;
    }, 0);
  }

  function handleDayDrop(targetDay: string) {
    setDropTargetDay(null);
    if (!dragShiftId) return;
    const shift = rosterShifts.find((s) => s.id === dragShiftId);
    setDragShiftId(null);
    if (!shift) return;
    if (shift.shiftDate === targetDay) return;

    const normalized = normalizeRosterShift(shift);
    const gate = canRescheduleShiftByDrag(normalized);
    if (!gate.allowed) {
      setRescheduleNotice({ tone: "error", message: gate.reason ?? "This shift cannot be rescheduled." });
      return;
    }

    const next = rescheduledShiftOnDate(normalized, targetDay, "SuperUser");
    const err = upsertRosterShift(next);
    if (err) {
      setRescheduleNotice({ tone: "error", message: err });
      return;
    }
    setRescheduleNotice({
      tone: "success",
      message: `Shift moved to ${formatDayHeading(targetDay)}.`,
    });
  }

  function openShiftEditor(shift: ReturnType<typeof normalizeRosterShift>) {
    if (dragStartedRef.current) return;
    setBuddyFromPrimary(null);
    setEditorPrefill(null);
    setEditorShift(shift);
  }

  function openBuddyEditor(primary: ReturnType<typeof normalizeRosterShift>) {
    setEditorPrefill(null);
    setBuddyFromPrimary(primary);
    setEditorShift("new");
  }

  function handleExportWeekCsv() {
    const csv = buildRosterWeekCsv(shifts, {
      clients,
      employees,
      locations,
      serviceBookings,
    });
    downloadRosterWeekCsv(csv, rosterWeekCsvFilename(weekStart));
  }

  return (
    <>
      <AppShell
        title="Rostering"
        subtitle={
          view === "week"
            ? "Week calendar — drag shifts between days to reschedule, or click to edit."
            : view === "forward"
              ? "Forward plan — roster hours and conflicts across the next 4–12 weeks."
            : view === "review"
              ? "Fortnight review — compare RoC templates with the live roster before publishing or filling gaps."
              : view === "gaps"
                ? "Gap analysis — vacant shifts and weeks missing staffed coverage for active bookings."
                : view === "roc"
                  ? "Roster of care — import or generate weekly support schedules per participant."
                  : view === "capacity"
                    ? "Capacity — roster demand vs active worker hours across the forward horizon."
                    : "Open shift marketplace — vacant shifts for coordinators to assign or review worker requests."
        }
        audit={{ moduleLabel: "Rostering" }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setView("week")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "week" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setView("forward")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "forward" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Forward plan
              </button>
              <button
                type="button"
                onClick={() => setView("gaps")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "gaps" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Gaps
                {weekGaps.length ? (
                  <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                    {weekGaps.length}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setView("review")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "review" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Fortnight review
              </button>
              <button
                type="button"
                onClick={() => setView("open")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "open" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Open shifts
                {openShiftCount ? (
                  <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                    {openShiftCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setView("roc")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "roc" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                RoC
              </button>
              <button
                type="button"
                onClick={() => setView("capacity")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "capacity" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Capacity
              </button>
            </div>
            {canEditRoster && view === "week" ? (
              <button
                type="button"
                onClick={() => openNewShift()}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
              >
                New shift
              </button>
            ) : null}
          </div>
        }
      >
        {view === "forward" ? (
          <RosterForwardPanel
            rosterShifts={rosterShifts}
            serviceBookings={serviceBookings}
            clients={clients}
            anchorWeekStart={weekStart}
            weekCount={forwardWeeks}
            onAnchorChange={setWeekStart}
            onWeekCountChange={setForwardWeeks}
          />
        ) : view === "review" ? (
          <RosterFortnightReviewPanel
            rosterOfCares={rosterOfCares}
            rosterShifts={rosterShifts}
            clients={clients}
            locations={locations}
            anchorWeekStart={weekStart}
            onAnchorChange={setWeekStart}
            onOpenIssue={(issue) => {
              setView(issue.rosterShiftId ? "week" : "roc", weekStartFromDate(issue.date));
            }}
          />
        ) : view === "gaps" ? (
          <RosterGapsPanel
            rosterShifts={rosterShifts}
            serviceBookings={serviceBookings}
            clients={clients}
            anchorWeekStart={weekStart}
            weekCount={forwardWeeks}
            onFillGap={canEditRoster ? handleFillGap : undefined}
            onRequestAgency={canRequestAgency ? handleRequestAgency : undefined}
          />
        ) : view === "open" ? (
          <OpenShiftsMarketplacePanel
            rosterShifts={rosterShifts}
            rosterShiftRequests={rosterShiftRequests}
            clients={clients}
            employees={employees}
            locations={locations}
            serviceBookings={serviceBookings}
            mode="coordinator"
            onAssign={(shift) => setEditorShift(normalizeRosterShift(shift))}
            onApproveRequest={(requestId) => approveShiftRequest(requestId, actor)}
            onRejectRequest={(requestId, reason) => rejectShiftRequest(requestId, actor, reason)}
            onToggleCriticalFill={(shift, criticalFill) =>
              setShiftCriticalFill(shift.id, criticalFill, actor)
            }
          />
        ) : view === "roc" ? (
          <RosterRocPanel />
        ) : view === "capacity" ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Pay period</span>
                <PayPeriodSelector value={payPeriodInstanceId} onChange={setPayPeriodInstanceId} />
              </label>
            </div>
            <RosterCapacityPanel
              rosterShifts={rosterShifts}
              employees={employees}
              anchorWeekStart={weekStart}
              weekCount={forwardWeeks}
              onAnchorChange={setWeekStart}
              onWeekCountChange={setForwardWeeks}
            />
            <ContractedHoursPanel payPeriodInstanceId={payPeriodInstanceId} />
          </div>
        ) : (
          <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setWeekStart(addDaysIso(weekStart, -7))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Previous week
          </button>
          <p className="text-sm font-medium text-slate-800">
            Week of {formatDayHeading(weekStart)} – {formatDayHeading(addDaysIso(weekStart, 6))}
          </p>
          <button
            type="button"
            onClick={() => setWeekStart(addDaysIso(weekStart, 7))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Next week
          </button>
          <button
            type="button"
            onClick={goToCurrentWeek}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleExportWeekCsv}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export week CSV
          </button>
          <Link href="/service-bookings" className="ml-auto text-sm font-medium text-[#b51266] hover:underline">
            Service bookings
          </Link>
        </div>

        {weekGaps.length ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">
              {weekGaps.length} gap{weekGaps.length === 1 ? "" : "s"} this week
            </p>
            <p className="mt-1 text-amber-900/90">
              Open the <button type="button" onClick={() => setView("gaps")} className="font-medium underline">Gaps</button> tab to
              assign workers or add coverage for active bookings.
            </p>
          </div>
        ) : null}

        <RosterPublishWeekPanel weekStart={weekStart} />

        {rescheduleNotice ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              rescheduleNotice.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-950"
                : "border-emerald-200 bg-emerald-50 text-emerald-950"
            }`}
          >
            <p>{rescheduleNotice.message}</p>
          </div>
        ) : null}

        {canEditRoster ? (
          <p className="mb-3 text-xs text-slate-500">
            Drag a shift card to another day to reschedule. Published shifts still enforce conflict rules on drop.
          </p>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-7">
          {days.map((day) => {
            const dayShifts = shiftsByDay.get(day) ?? [];
            const isDropTarget = dropTargetDay === day && dragShiftId !== null;
            return (
              <div
                key={day}
                className={`min-h-48 rounded-xl border bg-white p-3 shadow-sm transition ${
                  isDropTarget ? "border-[#d4147a] bg-[#fdf2f8]/40 ring-2 ring-[#d4147a]/30" : "border-slate-200"
                }`}
                onDragOver={(e) => {
                  if (!canEditRoster || !dragShiftId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropTargetDay(day);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDropTargetDay((current) => (current === day ? null : current));
                }}
                onDrop={(e) => {
                  if (!canEditRoster) return;
                  e.preventDefault();
                  handleDayDrop(day);
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDayHeading(day)}</p>
                  {canEditRoster ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNewShiftDate(day);
                        openNewShift(day);
                      }}
                      className="text-[10px] font-medium text-[#b51266] hover:underline"
                    >
                      Add
                    </button>
                  ) : null}
                </div>
                {dayShifts.length ? (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => {
                      const client = clients.find((c) => c.id === shift.clientId);
                      const employee = employees.find((e) => e.id === shift.employeeId);
                      const agencyWorker = agencyWorkers.find((w) => w.id === shift.agencyWorkerId);
                      const agencyVendor = businessPartners.find((p) => p.id === shift.vendorBpId);
                      const location = locations.find((l) => l.id === shift.locationId);
                      const booking = serviceBookings.find((b) => b.id === shift.serviceBookingId);
                      const conflicts = conflictByShiftId.get(shift.id) ?? [];
                      const hasError = conflicts.some((c) => c.severity === "error");
                      const vacant = isVacantShift(shift);
                      const draggable = canEditRoster && canRescheduleShiftByDrag(shift).allowed;
                      const isDragging = dragShiftId === shift.id;
                      return (
                        <div
                          key={shift.id}
                          role="button"
                          tabIndex={0}
                          draggable={draggable}
                          onDragStart={(e) => handleShiftDragStart(shift, e)}
                          onDragEnd={handleShiftDragEnd}
                          onClick={() => canEditRoster && openShiftEditor(shift)}
                          onKeyDown={(e) => {
                            if (!canEditRoster) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openShiftEditor(shift);
                            }
                          }}
                          className={`w-full rounded-lg border p-2 text-left text-xs ${
                            hasError
                              ? "border-rose-300 bg-rose-50/80"
                              : vacant
                                ? "border-amber-300 bg-amber-50/80"
                                : "border-[#f9a8d4]/40 bg-[#fdf2f8]/60"
                          } ${canEditRoster ? "cursor-pointer hover:border-[#d4147a]/50 hover:shadow-sm" : "cursor-default"} ${
                            draggable ? "cursor-grab active:cursor-grabbing" : ""
                          } ${isDragging ? "opacity-40" : ""}`}
                        >
                          <p className="font-semibold text-slate-900">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
                          {isTrainingOrMeetingPurpose(normalizeShiftPurpose(shift.shiftPurpose)) && shift.sessionTitle ? (
                            <p className="mt-1 text-[11px] font-semibold text-slate-900">{shift.sessionTitle}</p>
                          ) : null}
                          {client ? (
                            <ClientRecordLink
                              id={client.id}
                              searchKey={client.searchKey}
                              name={client.name}
                              className="mt-1 block text-slate-700 hover:underline"
                            />
                          ) : (
                            <p className="mt-1 text-slate-600">No client</p>
                          )}
                          {employee ? (
                            <EmployeeRecordLink
                              id={employee.id}
                              searchKey={employee.searchKey}
                              name={employee.name}
                              className="mt-0.5 block text-slate-600 hover:underline"
                            />
                          ) : agencyWorker ? (
                            <p className="mt-0.5 text-slate-600">
                              <Link
                                href={`/agency-workers/${agencyWorker.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline"
                              >
                                {agencyWorkerDisplayName(agencyWorker)}
                              </Link>
                              <span className="text-slate-500">
                                {" "}
                                · Agency{agencyVendor ? ` (${agencyVendor.name})` : ""}
                              </span>
                            </p>
                          ) : (
                            <p className="mt-0.5 text-amber-800">Vacant — no worker</p>
                          )}
                          {location ? <p className="mt-0.5 text-slate-500">{location.name}</p> : null}
                          {booking ? (
                            <Link
                              href={`/service-bookings/${booking.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 inline-block text-[#b51266] hover:underline"
                            >
                              Booking {booking.documentNo}
                            </Link>
                          ) : null}
                          {canEditRoster &&
                          !isBuddyShift(shift) &&
                          (shift.employeeId?.trim() || shift.agencyWorkerId?.trim()) ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBuddyEditor(shift);
                              }}
                              className="mt-2 block text-[10px] font-semibold text-violet-800 hover:underline"
                            >
                              Add buddy shift
                            </button>
                          ) : null}
                          {vacant ? (
                            <span className="mt-1 inline-flex rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-950">
                              Vacant
                            </span>
                          ) : null}
                          {isAgencyCoveredShift(shift) ? (
                            <span className="mt-1 inline-flex rounded-full bg-sky-200 px-1.5 py-0.5 text-[10px] font-medium text-sky-950">
                              Agency
                            </span>
                          ) : null}
                          {isBuddyShift(shift) ? (
                            <span className="mt-1 inline-flex rounded-full bg-violet-200 px-1.5 py-0.5 text-[10px] font-medium text-violet-950">
                              Buddy
                            </span>
                          ) : null}
                          {shift.shiftPurpose === "training_session" ? (
                            <span className="mt-1 inline-flex rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-medium text-cyan-950">
                              Training
                            </span>
                          ) : null}
                          {shift.shiftPurpose === "staff_meeting" ? (
                            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-950">
                              Meeting
                            </span>
                          ) : null}
                          {isBuddyShift(shift) && shift.payStatus === "non_payable" ? (
                            <span className="mt-1 inline-flex rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-800">
                              Non-payable
                            </span>
                          ) : null}
                          {isBuddyShift(shift) && !isShiftBillable(shift) ? (
                            <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900">
                              Non-billable
                            </span>
                          ) : null}
                          {isTrainingOrMeetingPurpose(normalizeShiftPurpose(shift.shiftPurpose)) && shift.costAllocation ? (
                            <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900">
                              {shift.costAllocation === "admin_costed"
                                ? "Admin cost"
                                : shift.costAllocation === "billable"
                                  ? "Billable"
                                  : "Non-billable"}
                            </span>
                          ) : null}
                          {shift.recurrenceGroupId ? (
                            <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900">
                              Recurring
                            </span>
                          ) : null}
                          {conflicts.length ? (
                            <span
                              className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                hasError ? "bg-rose-200 text-rose-950" : "bg-amber-100 text-amber-950"
                              }`}
                            >
                              {hasError ? "Conflict" : "Overlap warning"}
                            </span>
                          ) : null}
                          {!vacant && shift.employeeId ? (
                            (() => {
                              const checkStatus = shiftCheckInStatus(shift);
                              if (checkStatus === "not-started") return null;
                              return (
                                <span
                                  className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                    checkStatus === "completed"
                                      ? "bg-emerald-100 text-emerald-950"
                                      : "bg-sky-100 text-sky-950"
                                  }`}
                                >
                                  {shiftCheckInStatusLabel(checkStatus)}
                                </span>
                              );
                            })()
                          ) : null}
                          {hasShiftGeo(shift) ? <ShiftGeoLinks shift={shift} compact /> : null}
                          {shiftHasGeofenceAlert(
                            shift,
                            locations.find((l) => l.id === shift.locationId)
                          ) ? (
                            <ShiftGeofenceAlerts
                              alerts={shiftGeofenceAlerts(
                                shift,
                                locations.find((l) => l.id === shift.locationId)
                              )}
                              compact
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No shifts</p>
                )}
              </div>
            );
          })}
        </div>
          </>
        )}
      </AppShell>

      {editorShift ? (
        <RosterShiftEditor
          initial={editorShift === "new" ? null : editorShift}
          defaultDate={newShiftDate}
          prefill={editorPrefill ?? undefined}
          buddyFromPrimary={buddyFromPrimary}
          onClose={() => {
            setEditorShift(null);
            setEditorPrefill(null);
            setBuddyFromPrimary(null);
          }}
        />
      ) : null}
      {agencyShift ? (
        <AgencyShiftRequestDrawer shift={agencyShift} onClose={() => setAgencyShift(null)} />
      ) : null}
    </>
  );
}
