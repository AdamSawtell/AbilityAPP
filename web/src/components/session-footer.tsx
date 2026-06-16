"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

export function SessionFooter() {
  const { session, userInitials, availableRolesForUser, switchRole, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!session) return null;

  const roles = availableRolesForUser(session.userId);

  function onLogout() {
    void logout().then(() => router.replace("/login"));
  }

  return (
    <div className="relative shrink-0 border-t border-slate-100 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-slate-100"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4147a]/10 text-sm font-semibold text-[#b51266]">
          {userInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{session.displayName}</p>
          <p className="truncate text-xs text-slate-500">{session.activeRoleName}</p>
        </div>
      </button>

      {open ? (
        <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Change role</p>
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                void switchRole(role.id);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-2 py-2 text-left text-sm ${
                role.id === session.activeRoleId
                  ? "bg-[#fdf2f8] font-medium text-[#b51266]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {role.name}
            </button>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={onLogout}
            className="block w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SessionHeaderChip() {
  const { session } = useAuth();
  if (!session) return null;
  return (
    <Link href="/" className="hidden text-xs text-slate-500 sm:block">
      {session.username} / {session.activeRoleName}
    </Link>
  );
}
