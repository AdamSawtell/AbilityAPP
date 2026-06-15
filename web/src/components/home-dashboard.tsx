"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientRecordLink, EnquiryRecordLink } from "@/components/record-link";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";

function SummaryCard({
  title,
  count,
  description,
  href,
  accent,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  accent: "pink" | "emerald" | "indigo";
}) {
  const styles =
    accent === "pink"
      ? "from-[#d4147a]/10 to-[#fdf2f8] ring-[#f9a8d4]/50 hover:ring-[#d4147a]/40"
      : accent === "indigo"
        ? "from-indigo-500/10 to-indigo-50 ring-indigo-200/60 hover:ring-indigo-300"
        : "from-emerald-500/10 to-emerald-50 ring-emerald-200/60 hover:ring-emerald-300";

  return (
    <Link
      href={href}
      className={`group rounded-2xl bg-gradient-to-br p-6 shadow-sm ring-1 transition hover:shadow-md ${styles}`}
    >
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{count}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#b51266] transition-all group-hover:gap-2">
        View all
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}

export function HomeDashboard() {
  const { enquiries, clients, employees } = useData();
  const { canWindow, session } = useAuth();
  const showEmployees = canWindow("employees");

  const openEnquiries = useMemo(
    () => enquiries.filter((e) => !e.status.startsWith("5_")).length,
    [enquiries]
  );

  const convertedCount = useMemo(
    () => enquiries.filter((e) => e.status.startsWith("4_")).length,
    [enquiries]
  );

  const recentEnquiries = useMemo(() => enquiries.slice(0, 5), [enquiries]);
  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);

  return (
    <AppShell
      title="Home"
      subtitle={`Welcome back${session?.displayName ? `, ${session.displayName}` : ""}. Pick up where you left off.`}
    >
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/enquiries/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          <span aria-hidden>+</span> New enquiry
        </Link>
        <Link
          href="/enquiries"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Browse enquiries
        </Link>
        <Link
          href="/clients"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Browse clients
        </Link>
        {showEmployees ? (
          <Link
            href="/employees"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Browse employees
          </Link>
        ) : null}
      </div>

      <div className={`grid gap-6 ${showEmployees ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <SummaryCard
          title="Enquiries"
          count={enquiries.length}
          description={`${openEnquiries} open · ${convertedCount} converted`}
          href="/enquiries"
          accent="pink"
        />
        <SummaryCard
          title="Clients"
          count={clients.length}
          description="People receiving support"
          href="/clients"
          accent="emerald"
        />
        {showEmployees ? (
          <SummaryCard
            title="Employees"
            count={employees.length}
            description="Staff and contractors"
            href="/employees"
            accent="indigo"
          />
        ) : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Today</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {new Date().toLocaleDateString("en-AU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {openEnquiries > 0
              ? `${openEnquiries} enquiry${openEnquiries === 1 ? "" : "ies"} need attention.`
              : "No open enquiries right now."}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent enquiries</h2>
            <Link href="/enquiries" className="text-sm font-medium text-[#b51266] hover:underline">
              All enquiries
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEnquiries.length ? (
              recentEnquiries.map((e) => (
                <EnquiryRecordLink
                  key={e.id}
                  id={e.id}
                  documentNo={e.documentNo}
                  name={`${e.firstName} ${e.lastName}`.trim()}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#fdf2f8]/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {e.firstName} {e.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{e.documentNo}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </EnquiryRecordLink>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No enquiries yet.</p>
                <Link href="/enquiries/new" className="mt-2 inline-block text-sm font-medium text-[#b51266] hover:underline">
                  Create your first enquiry
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent clients</h2>
            <Link href="/clients" className="text-sm font-medium text-[#b51266] hover:underline">
              All clients
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentClients.length ? (
              recentClients.map((c) => (
                <ClientRecordLink
                  key={c.id}
                  id={c.id}
                  searchKey={c.searchKey}
                  name={c.name}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-emerald-50/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.searchKey}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    {c.status.replace(/^\d+_/, "").replace(/_/g, " ")}
                  </span>
                </ClientRecordLink>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No clients yet.</p>
                <p className="mt-2 text-sm text-slate-500">Convert an enquiry to create a client record.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
