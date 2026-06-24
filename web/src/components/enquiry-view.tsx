"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EnquiryForm } from "@/components/enquiry-form";
import { EnquiryQualificationPanel } from "@/components/enquiry-qualification-panel";
import { RecordActivitiesPanel } from "@/components/record-activities-panel";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { detailTabsForRole, resolveDetailWindowKey } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import {
  enquiryTabGroups,
  formSections,
  type EnquiryActivityRow,
  type EnquiryRecord,
} from "@/lib/enquiry";
import { normalizeEnquiryStatus } from "@/lib/enquiry-pipeline";

function tabCount(record: EnquiryRecord, tab: string, taskCount: number): number | null {
  if (tab === "Activity") return record.activity.length + taskCount;
  return null;
}

export function EnquiryTabbedView({
  record,
  participantName,
  onChange,
  onActivityChange,
}: {
  record: EnquiryRecord;
  participantName: string;
  onChange: (key: keyof EnquiryRecord, value: string) => void;
  onActivityChange: (rows: EnquiryActivityRow[]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow, canWriteWindow } = useAuth();
  const { getTasksByEntity } = useData();
  const { organization } = useOrganization();

  const taskCount = getTasksByEntity("enquiry", record.id).length;
  const allowedTabs = detailTabsForRole("enquiries", session?.windowKeys ?? []);
  const defaultTab = allowedTabs[0] ?? "Enquiry details";
  const requestedTab = searchParams.get("tab") ?? defaultTab;
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;

  const visibleGroups = enquiryTabGroups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => allowedTabs.includes(tab)),
    }))
    .filter((group) => group.tabs.length > 0);

  function canEnquiryTab(tab: string) {
    const key = resolveDetailWindowKey("enquiries", tab);
    return key ? canWindow(key) : false;
  }

  function canWriteEnquiryTab(tab: string) {
    const key = resolveDetailWindowKey("enquiries", tab);
    return key ? canWriteWindow(key) : false;
  }

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const visibleFormSections = formSections.map((section) => {
    if (section.title !== "Enquiry details") return section;
    const showLossReason = normalizeEnquiryStatus(record.status) === "5_Lost";
    return {
      ...section,
      fields: section.fields.filter((field) => field.key !== "lossReason" || showLossReason),
    };
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="hidden shrink-0 lg:block lg:w-52 xl:w-56">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const count = tabCount(record, tab, taskCount);
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">{tab}</span>
                      {count !== null && count > 0 ? (
                        <span className="shrink-0 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
          {allowedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeTab === tab ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Activity" && canEnquiryTab("Activity") ? (
          <div className="space-y-8">
            <RecordActivitiesPanel
              rows={record.activity}
              onChange={onActivityChange}
              readOnly={!canWriteEnquiryTab("Activity")}
              activityDeleteContext={{
                entityType: "enquiry",
                entityId: record.id,
                entityLabel: `${record.documentNo} — ${participantName}`,
                collectionLabel: "Enquiry activity",
              }}
            />
            <div className="border-t border-slate-200 pt-8">
              <RecordTasksPanel
                entityType="enquiry"
                entityId={record.id}
                entityLabel={`${record.documentNo} — ${participantName}`}
              />
            </div>
          </div>
        ) : activeTab === "Qualification" && canEnquiryTab("Qualification") ? (
          <div className="space-y-6">
            <EnquiryQualificationPanel record={record} organization={organization} />
            <EnquiryForm
              record={record}
              sections={visibleFormSections}
              onChange={onChange}
              activeSection="Qualification"
              readOnly={!canWriteEnquiryTab("Qualification")}
            />
          </div>
        ) : canEnquiryTab(activeTab) ? (
          <EnquiryForm
            record={record}
            sections={visibleFormSections}
            onChange={onChange}
            activeSection={activeTab}
            readOnly={!canWriteEnquiryTab(activeTab)}
          />
        ) : null}
      </div>
    </div>
  );
}
