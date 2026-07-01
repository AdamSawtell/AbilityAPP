"use client";

import { useEffect, useState } from "react";
import { acceptMobilePrivacy, mobilePrivacyAccepted } from "@/lib/mobile/privacy";

export function MobilePrivacyGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    setAccepted(mobilePrivacyAccepted());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!accepted) {
    return (
      <div className="flex min-h-[100dvh] flex-col justify-end bg-slate-900/40 px-4 py-8">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Location at check-in</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
            <li>GPS is captured only when you tap <strong>Check in</strong> or <strong>Check out</strong>.</li>
            <li>Location is used to verify attendance at the support site and is stored with your shift record.</li>
            <li>AbilityVua does not track your location continuously in the background.</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              acceptMobilePrivacy();
              setAccepted(true);
            }}
            className="mt-6 min-h-12 w-full rounded-xl bg-[#b51266] text-base font-semibold text-white"
          >
            I understand
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
