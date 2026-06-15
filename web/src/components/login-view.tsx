"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginBackdrop, OrgLogo } from "@/components/organization-landing";
import { displayName } from "@/lib/access/types";
import { useAuth } from "@/lib/auth-store";
import { organizationAddressLine, organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";

export function LoginView() {
  const { users, login, availableRolesForUser } = useAuth();
  const { organization } = useOrganization();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orgName = organizationDisplayName(organization);
  const showLegalName =
    organization.legalName.trim() &&
    organization.legalName.trim().toLowerCase() !== orgName.trim().toLowerCase();
  const locationLine = organizationAddressLine(organization);

  const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
  const roleOptions = useMemo(
    () => (userId ? availableRolesForUser(userId) : []),
    [userId, availableRolesForUser]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(userId, roleId);
      router.replace("/");
    } catch {
      setError("Could not sign in with that user and role.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginBackdrop>
      <div className="text-center">
        <div className="mx-auto flex justify-center">
          <OrgLogo organization={organization} size="lg" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{orgName}</h1>
        {showLegalName ? <p className="mt-1 text-sm text-white/65">{organization.legalName}</p> : null}
        {locationLine ? <p className="mt-2 text-sm text-white/50">{locationLine}</p> : null}
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/75">
          Sign in to your workspace — enquiries, clients, and day-to-day service delivery.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-slate-700">Staff sign in</p>
        <p className="mt-1 text-center text-xs text-slate-500">Select your account and role for this session.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="user">
              User
            </label>
            <select
              id="user"
              required
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setRoleId("");
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
            >
              <option value="">Select user…</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {displayName(u)} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              required
              disabled={!userId}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select role…</option>
              {roleOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {userId && roleOptions.length === 0 ? (
              <p className="mt-1.5 text-xs text-amber-600">This user has no roles assigned.</p>
            ) : null}
          </div>

          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !userId || !roleId}
            className="w-full rounded-lg bg-[#d4147a] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Continue to workspace"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Password sign-in will be added with Supabase Auth.
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-white/40">
        Powered by <span className="font-medium text-white/55">AbilityAPP</span>
      </p>
    </LoginBackdrop>
  );
}
