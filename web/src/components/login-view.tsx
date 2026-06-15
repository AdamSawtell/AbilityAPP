"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { displayName } from "@/lib/access/types";
import { useAuth } from "@/lib/auth-store";

export function LoginView() {
  const { users, login, availableRolesForUser } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4147a] to-[#b51266] text-lg font-bold text-white">
            a
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Sign in to AbilityAPP</h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose your user account and role, like AbilityERP&apos;s Change Role.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="user">
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
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
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              required
              disabled={!userId}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50"
            >
              <option value="">Select role…</option>
              {roleOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {userId && roleOptions.length === 0 ? (
              <p className="mt-1 text-xs text-amber-600">This user has no roles assigned.</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !userId || !roleId}
            className="w-full rounded-lg bg-[#d4147a] py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Password sign-in and employee linking will be added with Supabase Auth.
        </p>
      </div>
    </div>
  );
}
