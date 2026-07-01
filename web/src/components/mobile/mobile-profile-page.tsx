"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { useData } from "@/lib/data-store";
import type { EmployeeEmergencyContactRow, EmployeeLocationRow, EmployeeRecord } from "@/lib/employee";
import { emptyEmergencyContactRow, emptyEmployeeLocationRow, renumberLines } from "@/lib/employee-line-tables";
import type { MyProfileGap } from "@/lib/my-workplace/compliance-dashboard";
import { mobileHrefFromDesktop } from "@/lib/mobile/login-redirect";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type ProfileData = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  emergencyContacts: EmployeeEmergencyContactRow[];
  locations: EmployeeLocationRow[];
  profileGaps: MyProfileGap[];
};

export function MobileProfilePage() {
  const { upsertEmployee } = useData();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/my/profile", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load profile");
        return res.json() as Promise<ProfileData>;
      })
      .then(setProfile)
      .catch((err: Error) => setError(err.message));
  }, []);

  function updateContact(index: number, next: EmployeeEmergencyContactRow) {
    if (!profile) return;
    setProfile({ ...profile, emergencyContacts: profile.emergencyContacts.map((row, i) => (i === index ? next : row)) });
  }

  function addContact() {
    if (!profile) return;
    setProfile({
      ...profile,
      emergencyContacts: [...profile.emergencyContacts, emptyEmergencyContactRow(profile.emergencyContacts.length + 1)],
    });
  }

  function removeContact(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      emergencyContacts: renumberLines(profile.emergencyContacts.filter((_, i) => i !== index)),
    });
  }

  function updateLocation(index: number, next: EmployeeLocationRow) {
    if (!profile) return;
    setProfile({ ...profile, locations: profile.locations.map((row, i) => (i === index ? next : row)) });
  }

  function addLocation() {
    if (!profile) return;
    const row = emptyEmployeeLocationRow(profile.locations.length + 1);
    if (profile.locations.length === 0) row.primaryAddress = "Yes";
    setProfile({ ...profile, locations: [...profile.locations, row] });
  }

  function removeLocation(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      locations: renumberLines(profile.locations.filter((_, i) => i !== index)),
    });
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/my/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          preferredName: profile.preferredName,
          email: profile.email,
          phone: profile.phone,
          mobile: profile.mobile,
          emergencyContacts: profile.emergencyContacts,
          locations: profile.locations,
        }),
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      if (body.employee) upsertEmployee(body.employee);
      setMessage("Profile updated.");
      const refreshed = await fetch("/api/my/profile", { credentials: "include" });
      if (refreshed.ok) setProfile((await refreshed.json()) as ProfileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileAuthGuard windowKey="my-profile">
      <MobileEmployeeShell title="Personal info" subtitle="Contact details and emergency contacts">
        {!profile && !error ? <p className="text-sm text-slate-500">Loading profile…</p> : null}
        {error && !profile ? <p className="text-sm text-red-600">{error}</p> : null}

        {profile ? (
          <form onSubmit={saveProfile} className="space-y-4">
            {profile.profileGaps.length > 0 ? (
              <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h2 className="text-sm font-semibold text-amber-900">Complete your profile</h2>
                <ul className="mt-2 space-y-1 text-sm text-amber-900/90">
                  {profile.profileGaps.map((gap) => (
                    <li key={gap.id}>
                      <Link href={mobileHrefFromDesktop(gap.href)} className="font-medium underline">
                        {gap.label}
                      </Link>
                      <span className="text-amber-800/80"> — {gap.description}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">Employment</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Job title</dt>
                  <dd className="font-medium">{profile.jobTitle || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Department</dt>
                  <dd className="font-medium">{profile.department || "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">Contact</h2>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">First name</span>
                  <input className={inputClass} value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Last name</span>
                  <input className={inputClass} value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Email</span>
                  <input type="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Phone</span>
                  <input className={inputClass} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Mobile</span>
                  <input className={inputClass} value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Emergency contacts</h2>
                <button type="button" onClick={addContact} className="text-sm font-medium text-[#b51266]">
                  Add
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {profile.emergencyContacts.map((contact, index) => (
                  <div key={contact.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium">Contact {contact.lineNo}</span>
                      <button type="button" onClick={() => removeContact(index)} className="text-xs text-red-600">
                        Remove
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input className={inputClass} placeholder="Name" value={contact.name} onChange={(e) => updateContact(index, { ...contact, name: e.target.value })} />
                      <input className={inputClass} placeholder="Phone" value={contact.phone} onChange={(e) => updateContact(index, { ...contact, phone: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Home address</h2>
                <button type="button" onClick={addLocation} className="text-sm font-medium text-[#b51266]">
                  Add
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {profile.locations.map((location, index) => (
                  <div key={location.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium">Address {location.lineNo}</span>
                      <button type="button" onClick={() => removeLocation(index)} className="text-xs text-red-600">
                        Remove
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input className={inputClass} placeholder="Address line 1" value={location.address1} onChange={(e) => updateLocation(index, { ...location, address1: e.target.value })} />
                      <input className={inputClass} placeholder="Suburb" value={location.city} onChange={(e) => updateLocation(index, { ...location, city: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <input className={inputClass} placeholder="State" value={location.state} onChange={(e) => updateLocation(index, { ...location, state: e.target.value })} />
                        <input className={inputClass} placeholder="Postcode" value={location.postcode} onChange={(e) => updateLocation(index, { ...location, postcode: e.target.value })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-[#b51266] text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        ) : null}
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
