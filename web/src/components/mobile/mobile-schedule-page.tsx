"use client";

import Link from "next/link";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MobileOfflineBanner } from "@/components/mobile/mobile-offline-banner";
import { MobileShiftCard } from "@/components/mobile/mobile-shift-card";
import { useMobileShifts } from "@/lib/mobile/use-mobile-shifts";

export function MobileSchedulePage() {
  const {
    employeeId,
    orgToday,
    payPeriod,
    periodGroups,
    busyId,
    error,
    notesByShift,
    setNotesByShift,
    handleCheckIn,
    handleCheckOut,
    shiftContext,
    online,
    sync,
    usingCachedSchedule,
    scheduleCachedAt,
  } = useMobileShifts();

  return (
    <MobileAuthGuard windowKey="my-shifts">
      <MobileEmployeeShell
        title="Pay period"
        subtitle={`${payPeriod.periodStart} – ${payPeriod.periodEnd}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Fortnightly schedule</p>
          <Link href="/m/today" className="text-sm font-semibold text-[#b51266]">
            Today
          </Link>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
        ) : null}

        <MobileOfflineBanner
          online={online}
          pending={sync.pending}
          syncing={sync.syncing}
          syncError={sync.syncError}
          onSyncNow={() => void sync.syncNow()}
          usingCachedSchedule={usingCachedSchedule}
          scheduleCachedAt={scheduleCachedAt}
        />

        {!online && !usingCachedSchedule ? (
          <p className="mb-4 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            Connect once while online to save this pay period for offline browsing.
          </p>
        ) : null}

        {!employeeId ? (
          <p className="text-sm text-slate-500">No employee link.</p>
        ) : periodGroups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No shifts in this pay period.
          </p>
        ) : (
          <div className="space-y-6">
            {periodGroups.map((group) => (
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
                          notes={notesByShift[shift.id] ?? ""}
                          onNotesChange={(value) =>
                            setNotesByShift((prev) => ({ ...prev, [shift.id]: value }))
                          }
                          onCheckIn={() => void handleCheckIn(shift.id)}
                          onCheckOut={() => void handleCheckOut(shift.id)}
                          compact={shift.shiftDate !== orgToday}
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
