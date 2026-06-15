"use client";

import type { ReactNode } from "react";
import type { OrganizationRecord } from "@/lib/organization";

export function OrgLogo({
  organization,
  size = "lg",
}: {
  organization: OrganizationRecord;
  size?: "lg" | "md" | "sm";
}) {
  const box =
    size === "lg" ? "h-24 w-24 rounded-2xl" : size === "md" ? "h-16 w-16 rounded-xl" : "h-11 w-11 rounded-lg";
  const text = size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-base";

  if (organization.logoUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={organization.logoUrl}
        alt=""
        className={`${box} object-contain bg-white p-2 shadow-xl ring-1 ring-white/60`}
      />
    );
  }

  return (
    <span
      className={`flex ${box} items-center justify-center bg-gradient-to-br from-[#d4147a] to-[#b51266] ${text} font-bold text-white shadow-xl`}
    >
      {organization.searchKey?.trim().charAt(0).toUpperCase() || "a"}
    </span>
  );
}

export function LoginBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#5b215c] to-[#be185d]" aria-hidden />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#f9a8d4]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-white/5 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
