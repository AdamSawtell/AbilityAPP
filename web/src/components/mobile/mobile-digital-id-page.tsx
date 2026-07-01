"use client";

import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { useAuth } from "@/lib/auth-store";

export function MobileDigitalIdPage() {
  const { session } = useAuth();
  const { employee } = useMyEmployee();

  const name =
    employee?.preferredName?.trim() ||
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") ||
    session?.displayName ||
    "Employee";
  const role =
    session?.activeRoleName?.trim() ||
    employee?.jobTitle?.trim() ||
    "Support Worker";
  const employeeNo = employee?.searchKey?.trim() || employee?.id || "—";
  const photo = employee?.pictureUrl?.trim();

  return (
    <MobileAuthGuard>
      <MobileEmployeeShell
        title="Digital Worker ID"
        subtitle="Present when asked on site"
        backHref="/m/more"
        backLabel="More"
        hideNav
      >
        <div className="mx-auto max-w-sm pt-4">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#b51266] to-[#7c0f48] p-1 shadow-xl">
            <div className="rounded-[1.35rem] bg-white p-6 text-center">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  className="mx-auto h-28 w-28 rounded-2xl object-cover ring-4 ring-[#fdf2f8]"
                />
              ) : (
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-[#fdf2f8] text-3xl font-bold text-[#b51266]">
                  {name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <p className="mt-4 text-xl font-bold text-slate-900">{name}</p>
              <p className="mt-1 text-sm font-semibold text-[#b51266]">{role}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-slate-400">Employee ID</p>
              <p className="font-mono text-lg font-semibold text-slate-800">{employeeNo}</p>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            This card confirms your identity as an AbilityVua worker. It is not a government-issued ID.
          </p>
        </div>
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
