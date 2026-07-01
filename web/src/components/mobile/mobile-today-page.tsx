"use client";

import Link from "next/link";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MobileFloatingCheckIn } from "@/components/mobile/mobile-floating-check-in";
import { MobileShiftCard } from "@/components/mobile/mobile-shift-card";
import { useMobileShifts } from "@/lib/mobile/use-mobile-shifts";
import { formatDayHeading } from "@/lib/roster-shift";
import { canWorkerCheckIn, canWorkerCheckOut } from "@/lib/roster-shift-checkin";

export function MobileTodayPage() {
  const {
    employeeId,
    orgToday,
    todayGroups,
    actionShift,
    busyId,
    error,
    notesByShift,
    setNotesByShift,
    handleCheckIn,
    handleCheckOut,
    shiftContext,
  } = useMobileShifts();

  const greeting = actionShift
    ? canWorkerCheckOut(actionShift, employeeId).ok
      ? "Ready to check out?"
      : canWorkerCheckIn(actionShift, employeeId, new Date(), orgToday).ok
        ? "Ready to check in?"
        : "Your day"
    : "Your day";

  return (
    <MobileAuthGuard windowKey="my-shifts">
      <MobileEmployeeShell
        title={greeting}
        subtitle={formatDayHeading(orgToday)}
        floatingAction={
          actionShift && employeeId ? (
            <MobileFloatingCheckIn
              shift={actionShift}
              employeeId={employeeId}
              anchorDate={orgToday}
              busy={busyId === actionShift.id}
              onCheckIn={() => void handleCheckIn(actionShift.id)}
              onCheckOut={() => void handleCheckOut(actionShift.id)}
            />
          ) : undefined
        }
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Today&apos;s shifts</p>
          <Link href="/m/schedule" className="text-sm font-semibold text-[#b51266]">
            Pay period →
          </Link>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
        ) : null}

        {!employeeId ? (
          <p className="text-sm text-slate-500">Link your user to an employee record to see shifts.</p>
        ) : todayGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">No shifts today.</p>
            <Link href="/my/open-shifts" className="mt-3 inline-block text-sm font-semibold text-[#b51266]">
              Browse open shifts
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {todayGroups.map((group) => (
              <section key={group.date}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h2>
                <ul className="space-y-3">
                  {group.shifts.map((shift) => {
                    const { client, location } = shiftContext(shift);
                    return (
                      <li key={shift.id}>
                        <MobileShiftCard
                          shift={shift}
                          client={client}
                          location={location}
                          employeeId={employeeId}
                          anchorDate={orgToday}
                          busy={busyId === shift.id}
                          highlight={actionShift?.id === shift.id}
                          notes={notesByShift[shift.id] ?? ""}
                          onNotesChange={(value) =>
                            setNotesByShift((prev) => ({ ...prev, [shift.id]: value }))
                          }
                          onCheckIn={() => void handleCheckIn(shift.id)}
                          onCheckOut={() => void handleCheckOut(shift.id)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
