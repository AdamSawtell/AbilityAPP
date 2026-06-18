"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useData } from "@/lib/data-store";
import type { EmployeeEmergencyContactRow, EmployeeLocationRow, EmployeeRecord } from "@/lib/employee";
import { emptyEmergencyContactRow, renumberLines } from "@/lib/employee-line-tables";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

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
};

export function MyProfilePage() {
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
    const emergencyContacts = profile.emergencyContacts.map((row, i) => (i === index ? next : row));
    setProfile({ ...profile, emergencyContacts });
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <MyWorkplaceGuard windowKey="my-profile">
        <AppShell title="About me" breadcrumbs={myWorkplaceBreadcrumbs("About me")} audit={{ moduleLabel: "About me" }}>
          <p className="text-sm text-slate-500">{error || "Loading…"}</p>
        </AppShell>
      </MyWorkplaceGuard>
    );
  }

  return (
    <MyWorkplaceGuard windowKey="my-profile">
      <AppShell
        title="About me"
        subtitle="Update contact details your employer can reach you on."
        breadcrumbs={myWorkplaceBreadcrumbs("About me")}
        audit={{ moduleLabel: "About me" }}
      >
        <MyWorkplaceSubnav />
        <form onSubmit={saveProfile} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Employment summary</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Job title</dt>
                <dd className="font-medium text-slate-900">{profile.jobTitle || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd className="font-medium text-slate-900">{profile.department || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Employment type</dt>
                <dd className="font-medium text-slate-900">{profile.employmentType || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">First name</span>
                <input className={inputClass} value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Last name</span>
                <input className={inputClass} value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Preferred name</span>
                <input className={inputClass} value={profile.preferredName} onChange={(e) => setProfile({ ...profile, preferredName: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
                <input type="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Phone</span>
                <input className={inputClass} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Mobile</span>
                <input className={inputClass} value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Emergency contacts</h2>
              <button type="button" onClick={addContact} className="text-sm font-medium text-[#b51266] hover:underline">
                Add contact
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {profile.emergencyContacts.map((contact, index) => (
                <div key={contact.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex justify-between">
                    <p className="text-sm font-medium text-slate-900">Contact {contact.lineNo}</p>
                    <button type="button" onClick={() => removeContact(index)} className="text-xs text-red-600">
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className={inputClass} placeholder="Name" value={contact.name} onChange={(e) => updateContact(index, { ...contact, name: e.target.value })} />
                    <input className={inputClass} placeholder="Relationship" value={contact.relationship} onChange={(e) => updateContact(index, { ...contact, relationship: e.target.value })} />
                    <input className={inputClass} placeholder="Phone" value={contact.phone} onChange={(e) => updateContact(index, { ...contact, phone: e.target.value })} />
                    <input className={inputClass} placeholder="Mobile" value={contact.mobile} onChange={(e) => updateContact(index, { ...contact, mobile: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button type="submit" disabled={saving} className="rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </AppShell>
    </MyWorkplaceGuard>
  );
}
