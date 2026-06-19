"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientCoreSummary } from "@/components/client-core-summary";
import { ClientList } from "@/components/client-list";
import { ClientTabbedView } from "@/components/client-view";
import { ClientRecordLink, EnquiryRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { auditMetaFrom } from "@/lib/audit";
import { useAiDraftLoader } from "@/lib/ai/use-ai-draft";
import { draftHighlightKeys } from "@/lib/ai/draft-field-highlight";
import { trackAiPrepareSaved } from "@/lib/ai/prepare-audit.client";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import type { ClientLineCollectionKey } from "@/lib/client-line-tables";
import { emptyClientRecord, findClientByRouteId, normalizeClient, type ClientRecord } from "@/lib/client";

function ClientTabbedViewFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

export function ClientListView() {
  const { clients } = useData();
  return <ClientList records={clients} />;
}

export function ClientDetailView({ id }: { id: string }) {
  return (
    <Suspense fallback={<ClientTabbedViewFallback />}>
      <ClientDetailViewInner id={id} />
    </Suspense>
  );
}

function ClientDetailViewInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const aiDraftId = searchParams.get("aiDraft");
  const draftLoad = useAiDraftLoader(aiDraftId);
  const { session } = useAuth();
  const { clients, upsertClient, getServiceAgreementsByClientId, getSupportPlanByClientId } = useData();
  const { openClient, setTabDirty, touchTab } = useWorkspace();
  const stored = findClientByRouteId(clients, id);
  const [draft, setDraft] = useState<ClientRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);

  const client = draft ?? stored ?? null;
  const enquiryLink = client?.enquiryId;
  const hasUnsavedChanges = Boolean(draft);
  const agreementCount = getServiceAgreementsByClientId(id).length;
  const supportPlan = getSupportPlanByClientId(id);
  const hasSupportPlan = Boolean(supportPlan);
  const goalCount = supportPlan?.goals.length ?? 0;
  const progressReviewCount = supportPlan?.progressReviews?.length ?? 0;
  const tabKey = workspaceKey("client", stored?.id ?? id);

  const highlightFields = useMemo(() => {
    if (!aiDraftId || !draftApplied || !draftLoad.payload) return undefined;
    return draftHighlightKeys(draftLoad.payload, draftLoad.entityType ?? "client_patch");
  }, [aiDraftId, draftApplied, draftLoad.payload, draftLoad.entityType]);

  useEffect(() => {
    if (!stored || !draftLoad.payload || draftApplied || draftLoad.loading) return;
    const p = draftLoad.payload;
    if (draftLoad.entityType === "client_patch") {
      const fields = (p.fields ?? p) as Record<string, string>;
      setDraft(
        normalizeClient({
          ...stored,
          ...fields,
          updatedBy: session?.displayName ?? stored.updatedBy,
        })
      );
      setDraftApplied(true);
      return;
    }
    if (draftLoad.entityType === "client_activity") {
      const rawDate = String(p.activityDate ?? p.date ?? "").trim();
      const row = {
        id: `act-ai-${Date.now()}`,
        lineNo: stored.activity.length + 1,
        date: /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : new Date().toISOString().slice(0, 10),
        activityType: String(p.activityType ?? "Note"),
        subject: String(p.subject ?? ""),
        description: String(p.description ?? p.notes ?? ""),
        createdBy: session?.displayName ?? "User",
      };
      setDraft(
        normalizeClient({
          ...stored,
          activity: [...stored.activity, row],
          updatedBy: session?.displayName ?? stored.updatedBy,
        })
      );
      setDraftApplied(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "Activity");
      if (aiDraftId) params.set("aiDraft", aiDraftId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    stored,
    draftLoad.payload,
    draftLoad.entityType,
    draftLoad.loading,
    draftApplied,
    session?.displayName,
    aiDraftId,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (!stored) return;
    openClient(stored.id, stored.searchKey, stored.name);
  }, [id, stored, openClient]);

  useEffect(() => {
    setTabDirty(tabKey, hasUnsavedChanges);
  }, [tabKey, hasUnsavedChanges, setTabDirty]);

  useEffect(() => {
    if (client) touchTab(tabKey, client.searchKey, client.name);
  }, [client, tabKey, touchTab]);

  if (!client) {
    return (
      <AppShell
        title="Client not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No client with ID {id}.</p>
        <Link href="/clients" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to clients
        </Link>
      </AppShell>
    );
  }

  function onChange(key: keyof ClientRecord, value: string | boolean) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onLineItemsChange(key: ClientLineCollectionKey, rows: ClientRecord[ClientLineCollectionKey]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft(normalizeClient({ ...base, [key]: rows, updatedBy: "SuperUser" }));
    setSaved(false);
  }

  function onSave() {
    if (!client) return;
    const normalized = normalizeClient(client);
    upsertClient(normalized);
    if (session) {
      const savedLabel =
        draftLoad.entityType === "client_activity"
          ? `Logged activity on ${normalized.name}.`
          : `Saved updates to ${normalized.name}.`;
      trackAiPrepareSaved({
        userId: session.userId,
        roleId: session.activeRoleId,
        draftId: aiDraftId ?? undefined,
        entityType: draftLoad.entityType === "client_activity" ? "client_activity" : "client",
        entityId: normalized.id,
        entityLabel: normalized.name,
        chatMessage: aiDraftId ? `${savedLabel} You can continue in chat.` : undefined,
      });
    }
    setDraft(null);
    setSaved(true);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={client.name}
        subtitle={`${client.searchKey}${enquiryLink ? ` · enquiry ${enquiryLink}` : ""}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: client.searchKey },
        ]}
        actions={
          <>
            <Link
              href="/clients"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              All clients
            </Link>
            {enquiryLink ? (
              <EnquiryRecordLink
                id={enquiryLink}
                documentNo={enquiryLink}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              />
            ) : null}
          </>
        }
        audit={
          stored
            ? {
                entityType: "client",
                entityId: stored.id,
                meta: auditMetaFrom(stored),
              }
            : undefined
        }
      >
        {aiDraftId && draftApplied ? (
          <p className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Prepared by your AI assistant. Check the changes, then click Save.
          </p>
        ) : null}
        {draftLoad.error ? <p className="mb-4 text-sm text-red-700">{draftLoad.error}</p> : null}
        <ClientCoreSummary client={client} saved={saved && !hasUnsavedChanges} />

        <Suspense fallback={<ClientTabbedViewFallback />}>
          <ClientTabbedView
            client={client}
            agreementCount={agreementCount}
            hasSupportPlan={hasSupportPlan}
            goalCount={goalCount}
            progressReviewCount={progressReviewCount}
            onChange={onChange}
            onLineItemsChange={onLineItemsChange}
            highlightFields={highlightFields}
          />
        </Suspense>
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}

function ClientNewViewInner({ aiDraftId }: { aiDraftId: string | null }) {
  const { clients, upsertClient } = useData();
  const { session } = useAuth();
  const router = useRouter();
  const [base, setBase] = useState<ClientRecord | null>(null);
  const [draft, setDraft] = useState<ClientRecord | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);
  const [draftPayload, setDraftPayload] = useState<Record<string, unknown> | null>(null);

  const highlightFields = useMemo(
    () => (draftPayload ? draftHighlightKeys(draftPayload, "client") : undefined),
    [draftPayload]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError("");
      if (aiDraftId) {
        try {
          const res = await fetch(`/api/ai/drafts/${aiDraftId}`, { credentials: "include" });
          const data = (await res.json()) as {
            error?: string;
            payload?: Record<string, unknown>;
          };
          if (!res.ok) {
            if (!cancelled) setLoadError(data.error ?? "Could not load AI draft");
            return;
          }
          const p = data.payload ?? {};
          setDraftPayload(p as Record<string, unknown>);
          const record = emptyClientRecord(
            {
              firstName: String(p.firstName ?? ""),
              lastName: String(p.lastName ?? ""),
              preferredName: String(p.preferredName ?? ""),
              email: String(p.email ?? ""),
              phone: String(p.phone ?? ""),
              status: String(p.status ?? ""),
              fundingBody: String(p.fundingBody ?? ""),
              disability: String(p.disability ?? ""),
              services: String(p.services ?? ""),
            },
            session?.displayName ?? "User",
            clients
          );
          if (!cancelled) {
            setBase(record);
            setDraft(record);
          }
        } catch {
          if (!cancelled) setLoadError("Could not load AI draft");
        }
        return;
      }
      const record = emptyClientRecord(
        { firstName: "", lastName: "" },
        session?.displayName ?? "User",
        clients
      );
      if (!cancelled) {
        setBase(record);
        setDraft(record);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [aiDraftId, clients, session?.displayName]);

  const client = draft ?? base;

  if (loadError) {
    return (
      <AppShell
        title="New client"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clients", href: "/clients" }, { label: "New" }]}
        audit={{ moduleLabel: "Clients" }}
      >
        <p className="text-sm text-red-700">{loadError}</p>
        <Link href="/clients" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to clients
        </Link>
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell
        title="New client"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clients", href: "/clients" }, { label: "New" }]}
        audit={{ moduleLabel: "Clients" }}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  function onChange(key: keyof ClientRecord, value: string | boolean) {
    const current = draft ?? base;
    if (!current) return;
    setDraft({ ...current, [key]: value, updatedBy: session?.displayName ?? "User" });
    setSaved(false);
  }

  function onLineItemsChange(key: ClientLineCollectionKey, rows: ClientRecord[ClientLineCollectionKey]) {
    const current = draft ?? base;
    if (!current) return;
    setDraft(normalizeClient({ ...current, [key]: rows, updatedBy: session?.displayName ?? "User" }));
    setSaved(false);
  }

  function onSave() {
    const current = draft ?? base;
    if (!current) return;
    const normalized = normalizeClient(current);
    upsertClient(normalized);
    if (session && aiDraftId) {
      trackAiPrepareSaved({
        userId: session.userId,
        roleId: session.activeRoleId,
        draftId: aiDraftId,
        entityType: "client",
        entityId: normalized.id,
        entityLabel: normalized.name,
        chatMessage: `Created client ${normalized.name}. You can continue in chat.`,
      });
    } else if (session) {
      trackAiPrepareSaved({
        userId: session.userId,
        roleId: session.activeRoleId,
        entityType: "client",
        entityId: normalized.id,
        entityLabel: normalized.name,
      });
    }
    setSaved(true);
    router.push(`/clients/${normalized.id}`);
  }

  function onDiscard() {
    setDraft(base);
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title="New client"
        subtitle={aiDraftId ? "Review the details your assistant prepared, then save." : "Enter client details and save."}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clients", href: "/clients" }, { label: "New" }]}
        audit={{ moduleLabel: "Clients" }}
      >
        {aiDraftId ? (
          <p className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Prepared by your AI assistant. Check every field, then click Save to create this client.
          </p>
        ) : null}

        <ClientCoreSummary client={client} />

        {saved ? <p className="mb-4 text-sm text-emerald-700">Saved</p> : null}
        {!saved ? <p className="mb-4 text-sm text-amber-700">Not saved yet</p> : null}

        <Suspense fallback={<ClientTabbedViewFallback />}>
          <ClientTabbedView
              client={client}
              agreementCount={0}
              hasSupportPlan={false}
              goalCount={0}
              progressReviewCount={0}
              onChange={onChange}
              onLineItemsChange={onLineItemsChange}
              highlightFields={highlightFields}
            />
          </Suspense>
      </AppShell>

      <UnsavedChangesBar visible={!saved} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}

export function ClientNewView() {
  return (
    <Suspense fallback={<ClientTabbedViewFallback />}>
      <ClientNewViewWithParams />
    </Suspense>
  );
}

function ClientNewViewWithParams() {
  const searchParams = useSearchParams();
  const aiDraftId = searchParams.get("aiDraft");
  return <ClientNewViewInner aiDraftId={aiDraftId} />;
}
