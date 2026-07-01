"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileLoginForm } from "@/components/mobile/mobile-login-form";
import { useAuth } from "@/lib/auth-store";
import { MOBILE_APP_NAME } from "@/lib/mobile/constants";
import { safeMobilePostLoginPath } from "@/lib/mobile/login-redirect";

export function MobileLoginPage() {
  const { session, hydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeMobilePostLoginPath(searchParams.get("next"));
  const sessionMessage =
    searchParams.get("expired") === "inactivity"
      ? "Your session expired due to inactivity. Sign in again to continue."
      : "";

  useEffect(() => {
    if (!hydrated || !session) return;
    router.replace(nextPath);
  }, [hydrated, session, router, nextPath]);

  if (!hydrated || session) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-[#fdf2f8]/50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-[#fdf2f8]/50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">{MOBILE_APP_NAME}</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Use your usual AbilityVua username and password for shifts, check-in, and timesheets.
        </p>
        <div className="mt-6">
          <MobileLoginForm nextPath={nextPath} sessionMessage={sessionMessage} />
        </div>
      </div>
    </div>
  );
}
