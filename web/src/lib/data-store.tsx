"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createEnquiry, initialRecords as seedEnquiries, normalizeEnquiry, type EnquiryRecord } from "@/lib/enquiry";
import { initialClients as seedClients, normalizeClient, type ClientRecord } from "@/lib/client";
import { createContract, initialContracts as seedContracts, normalizeContract, type ContractRecord } from "@/lib/contract";
import {
  initialServiceAgreements as seedServiceAgreements,
  normalizeServiceAgreement,
  type ServiceAgreementRecord,
} from "@/lib/service-agreement";
import {
  initialPriceLists as seedPriceLists,
  initialProducts as seedProducts,
  normalizePriceList,
  type PriceListRecord,
  type ProductRecord,
} from "@/lib/product";
import {
  initialPlanDocuments as seedPlanDocuments,
  initialSupportPlans as seedSupportPlans,
  normalizeSupportPlan,
  type PlanAssessmentDocument,
  type SupportPlanRecord,
} from "@/lib/support-plan";
import {
  createEmployee,
  initialEmployees as seedEmployees,
  normalizeEmployee,
  type EmployeeRecord,
} from "@/lib/employee";
import {
  createLocation,
  initialLocations as seedLocations,
  normalizeLocation,
  type LocationRecord,
} from "@/lib/location";
import {
  createTask,
  describeAssignee,
  initialTasks as seedTasks,
  logTaskUpdate,
  normalizeTask,
  type TaskEntityType,
  type TaskRecord,
} from "@/lib/task";
import { initialTaskAutomations, sortTaskAutomations, type TaskAutomationRecord } from "@/lib/task-automation";
import { evaluateAutomationEvents, type AutomationTaskDraft } from "@/lib/task-automation/engine";
import { clientEventsFromSave } from "@/lib/task-automation/client-triggers";
import { employeeEventsFromSave } from "@/lib/task-automation/employee-triggers";
import { enquiryEventsFromSave } from "@/lib/task-automation/enquiry-triggers";
import type { AutomationEvent } from "@/lib/task-automation/events";
import { incidentEventsFromSave } from "@/lib/task-automation/incident-triggers";
import { locationEventsFromSave } from "@/lib/task-automation/location-triggers";
import { investigationSlaDays } from "@/lib/incident-analytics";
import { defaultOrganization } from "@/lib/organization";
import { convertEnquiryToClient } from "@/lib/convert";
import { syncClientsForIncident } from "@/lib/incident-client-sync";
import { syncLocationsForIncident } from "@/lib/incident-location-sync";
import {
  incidentsLinkedToClient,
  incidentsLinkedToEmployee,
  incidentsLinkedToLocation,
} from "@/lib/incident-queries";
import { syncClientsRestrictivePracticeForIncident } from "@/lib/incident-rp-sync";
import {
  createIncident,
  initialIncidents as seedIncidents,
  normalizeIncident,
  type IncidentRecord,
} from "@/lib/incident";
import { persistRecordAudit, type AuditLogOptions } from "@/lib/audit-mutation";
import { logRecordAudit } from "@/lib/audit-log";
import {
  trackEmployeeCredentialChanges,
  trackIncidentProcessChanges,
  trackLocationProcessChanges,
} from "@/lib/process-audit/track-changes";
import { trackProcessExecution } from "@/lib/process-audit/track.client";
import { stampRecordAudit } from "@/lib/audit";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllData,
  fetchTaskAutomations,
  fetchTasks,
  saveClient,
  saveContract,
  saveEmployee,
  saveEnquiry,
  saveIncident,
  saveLocation,
  savePriceList,
  saveProduct,
  saveServiceAgreement,
  saveSupportPlan,
  saveTask,
  saveTaskAutomation,
  deleteTaskAutomation,
} from "@/lib/supabase/data-api";

type DataStore = {
  enquiries: EnquiryRecord[];
  incidents: IncidentRecord[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  supportPlans: SupportPlanRecord[];
  planDocuments: PlanAssessmentDocument[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  tasks: TaskRecord[];
  taskAutomations: TaskAutomationRecord[];
  hydrated: boolean;
  source: "supabase" | "local";
  addEnquiry: (record: EnquiryRecord) => EnquiryRecord;
  updateEnquiry: (record: EnquiryRecord, audit?: AuditLogOptions) => void;
  addIncident: (record: IncidentRecord) => IncidentRecord;
  updateIncident: (record: IncidentRecord, audit?: AuditLogOptions) => void;
  upsertClient: (client: ClientRecord, audit?: AuditLogOptions) => void;
  addContract: (record: ContractRecord) => ContractRecord;
  upsertContract: (contract: ContractRecord) => void;
  upsertProduct: (product: ProductRecord) => void;
  upsertPriceList: (list: PriceListRecord) => void;
  upsertServiceAgreement: (record: ServiceAgreementRecord) => void;
  upsertSupportPlan: (record: SupportPlanRecord) => void;
  upsertEmployee: (record: EmployeeRecord) => void;
  addEmployee: (partial: EmployeeRecord) => EmployeeRecord;
  upsertLocation: (record: LocationRecord) => void;
  addLocation: (partial: LocationRecord) => LocationRecord;
  getEmployeeById: (id: string) => EmployeeRecord | undefined;
  getClientByEnquiryId: (enquiryId: string) => ClientRecord | undefined;
  getContractsByClientId: (clientId: string) => ContractRecord[];
  getServiceAgreementsByClientId: (clientId: string) => ServiceAgreementRecord[];
  getSupportPlanByClientId: (clientId: string) => SupportPlanRecord | undefined;
  getPlanDocumentsByClientId: (clientId: string) => PlanAssessmentDocument[];
  upsertTask: (task: TaskRecord) => void;
  addTask: (
    partial: Omit<TaskRecord, "id" | "documentNo" | "updates">,
    options?: { assigneeDisplayName?: string }
  ) => TaskRecord;
  addAutomationTasks: (drafts: AutomationTaskDraft[]) => void;
  upsertTaskAutomation: (rule: TaskAutomationRecord) => Promise<void>;
  deleteTaskAutomation: (id: string) => void;
  mutateTask: (id: string, mutator: (task: TaskRecord) => TaskRecord) => void;
  relinkEntityTasks: (
    fromType: TaskEntityType,
    fromId: string,
    toType: TaskEntityType,
    toId: string,
    toLabel: string
  ) => void;
  getTasksByEntity: (entityType: TaskEntityType, entityId: string) => TaskRecord[];
  getIncidentsForClient: (clientId: string) => IncidentRecord[];
  getIncidentsForEmployee: (employeeId: string) => IncidentRecord[];
  getIncidentsForLocation: (locationId: string) => IncidentRecord[];
  getTaskById: (id: string) => TaskRecord | undefined;
};

const ORGANIZATION_STORAGE_KEY = "abilityapp-organization";

function readInvestigationSlaDays(): number {
  if (typeof window === "undefined") return defaultOrganization().incidentInvestigationSlaDays;
  try {
    const raw = localStorage.getItem(ORGANIZATION_STORAGE_KEY);
    if (!raw?.trim()) return defaultOrganization().incidentInvestigationSlaDays;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultOrganization().incidentInvestigationSlaDays;
    return investigationSlaDays((parsed as { incidentInvestigationSlaDays?: number }).incidentInvestigationSlaDays);
  } catch {
    return defaultOrganization().incidentInvestigationSlaDays;
  }
}

const DataContext = createContext<DataStore | null>(null);
const STORAGE_KEY = "abilityerp-clone-data";

function useSyncRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

type Persisted = {
  enquiries: EnquiryRecord[];
  incidents?: IncidentRecord[];
  clients: ClientRecord[];
  contracts?: ContractRecord[];
  products?: ProductRecord[];
  priceLists?: PriceListRecord[];
  serviceAgreements?: ServiceAgreementRecord[];
  supportPlans?: SupportPlanRecord[];
  planDocuments?: PlanAssessmentDocument[];
  employees?: EmployeeRecord[];
  locations?: LocationRecord[];
  tasks?: TaskRecord[];
};

function seedData(): Required<Persisted> {
  return {
    enquiries: seedEnquiries,
    incidents: seedIncidents,
    clients: seedClients,
    contracts: seedContracts,
    products: seedProducts,
    priceLists: seedPriceLists.map(normalizePriceList),
    serviceAgreements: seedServiceAgreements.map(normalizeServiceAgreement),
    supportPlans: seedSupportPlans.map(normalizeSupportPlan),
    planDocuments: seedPlanDocuments,
    employees: seedEmployees.map(normalizeEmployee),
    locations: seedLocations.map(normalizeLocation),
    tasks: seedTasks.map(normalizeTask),
  };
}

function isPersisted(value: unknown): value is Persisted {
  if (!value || typeof value !== "object") return false;
  const v = value as Persisted;
  return Array.isArray(v.enquiries) && Array.isArray(v.clients);
}

function loadLocal(): Required<Persisted> {
  const defaults = seedData();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!isPersisted(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return defaults;
    }
    return {
      enquiries: parsed.enquiries.map(normalizeEnquiry),
      incidents: (parsed.incidents ?? seedIncidents).map(normalizeIncident),
      clients: parsed.clients.map(normalizeClient),
      contracts: (parsed.contracts ?? seedContracts).map(normalizeContract),
      products: parsed.products ?? seedProducts,
      priceLists: (parsed.priceLists ?? seedPriceLists).map(normalizePriceList),
      serviceAgreements: (parsed.serviceAgreements ?? seedServiceAgreements).map(normalizeServiceAgreement),
      supportPlans: (parsed.supportPlans ?? seedSupportPlans).map(normalizeSupportPlan),
      planDocuments: parsed.planDocuments ?? seedPlanDocuments,
      employees: (parsed.employees ?? seedEmployees).map(normalizeEmployee),
      locations: (parsed.locations ?? seedLocations).map(normalizeLocation),
      tasks: (parsed.tasks ?? seedTasks).map(normalizeTask),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return defaults;
  }
}

function persistLocal(data: Required<Persisted>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const defaults = seedData();
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(defaults.enquiries);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(defaults.incidents);
  const [clients, setClients] = useState<ClientRecord[]>(defaults.clients);
  const [contracts, setContracts] = useState<ContractRecord[]>(defaults.contracts);
  const [products, setProducts] = useState<ProductRecord[]>(defaults.products);
  const [priceLists, setPriceLists] = useState<PriceListRecord[]>(defaults.priceLists);
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreementRecord[]>(defaults.serviceAgreements);
  const [supportPlans, setSupportPlans] = useState<SupportPlanRecord[]>(defaults.supportPlans);
  const [planDocuments, setPlanDocuments] = useState<PlanAssessmentDocument[]>(defaults.planDocuments);
  const [employees, setEmployees] = useState<EmployeeRecord[]>(defaults.employees);
  const [locations, setLocations] = useState<LocationRecord[]>(defaults.locations);
  const [tasks, setTasks] = useState<TaskRecord[]>(defaults.tasks);
  const [taskAutomations, setTaskAutomations] = useState<TaskAutomationRecord[]>(initialTaskAutomations);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  const enquiriesRef = useSyncRef(enquiries);
  const incidentsRef = useSyncRef(incidents);
  const clientsRef = useSyncRef(clients);
  const contractsRef = useSyncRef(contracts);
  const productsRef = useSyncRef(products);
  const priceListsRef = useSyncRef(priceLists);
  const serviceAgreementsRef = useSyncRef(serviceAgreements);
  const supportPlansRef = useSyncRef(supportPlans);
  const employeesRef = useSyncRef(employees);
  const locationsRef = useSyncRef(locations);
  const tasksRef = useSyncRef(tasks);
  const automationsRef = useSyncRef(taskAutomations);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const data = await fetchAllData(supabase);
          let loadedTasks = loadLocal().tasks;
          let loadedAutomations = initialTaskAutomations;
          try {
            const dbTasks = await fetchTasks(supabase);
            if (dbTasks.length) loadedTasks = dbTasks.map(normalizeTask);
          } catch {
            // keep local/seed tasks
          }
          try {
            const dbAutomations = await fetchTaskAutomations(supabase);
            if (dbAutomations.length) loadedAutomations = dbAutomations;
          } catch {
            // keep seed automations
          }
          if (!cancelled) {
            setEnquiries(data.enquiries);
            setIncidents(data.incidents);
            setClients(data.clients);
            setContracts(data.contracts);
            setProducts(data.products);
            setPriceLists(data.priceLists);
            setServiceAgreements(data.serviceAgreements);
            setSupportPlans(data.supportPlans);
            setPlanDocuments(data.planDocuments);
            setEmployees(data.employees);
            setLocations(data.locations ?? seedLocations.map(normalizeLocation));
            setTasks(loadedTasks);
            setTaskAutomations(loadedAutomations);
            setSource("supabase");
            setHydrated(true);
            return;
          }
        } catch {
          // fall back to local seed / localStorage
        }
      }

      if (!cancelled) {
        const data = loadLocal();
        setEnquiries(data.enquiries);
        setIncidents(data.incidents);
        setClients(data.clients);
        setContracts(data.contracts);
        setProducts(data.products);
        setPriceLists(data.priceLists);
        setServiceAgreements(data.serviceAgreements);
        setSupportPlans(data.supportPlans);
        setPlanDocuments(data.planDocuments);
        setEmployees(data.employees);
        setLocations(data.locations);
        setTasks(data.tasks);
        setTaskAutomations(initialTaskAutomations);
        setSource("local");
        setHydrated(true);
      }
    }

    queueMicrotask(() => {
      void hydrate();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || source === "supabase") return;
    persistLocal({
      enquiries,
      incidents,
      clients,
      contracts,
      products,
      priceLists,
      serviceAgreements,
      supportPlans,
      planDocuments,
      employees,
      locations,
      tasks,
    });
  }, [
    enquiries,
    incidents,
    clients,
    contracts,
    products,
    priceLists,
    serviceAgreements,
    supportPlans,
    planDocuments,
    employees,
    locations,
    tasks,
    hydrated,
    source,
  ]);

  const persistRemote = useCallback(
    async (fn: (supabase: ReturnType<typeof createClient>) => Promise<void>) => {
      if (source !== "supabase" || !isSupabaseConfigured()) return;
      const supabase = createClient();
      await fn(supabase);
    },
    [source]
  );

  const persistIncidentRelatedRecords = useCallback(
    (
      incident: IncidentRecord,
      before: IncidentRecord | undefined,
      options?: { isCreate?: boolean; createdBy?: string }
    ) => {
      const prevClients = clientsRef.current;
      let nextClients = syncClientsForIncident(prevClients, incident, before, options);
      nextClients = syncClientsRestrictivePracticeForIncident(nextClients, incident, before);

      const prevLocations = locationsRef.current;
      const nextLocations = syncLocationsForIncident(prevLocations, incident, before, options);

      if (nextClients !== prevClients) {
        setClients(nextClients);
        for (let i = 0; i < nextClients.length; i++) {
          if (nextClients[i] === prevClients[i]) continue;
          const beforeClient = prevClients[i];
          const stampedClient = persistRecordAudit("client", nextClients[i], false, beforeClient);
          void persistRemote((supabase) => saveClient(supabase, stampedClient));
        }
      }

      if (nextLocations !== prevLocations) {
        setLocations(nextLocations);
        for (let i = 0; i < nextLocations.length; i++) {
          if (nextLocations[i] === prevLocations[i]) continue;
          const beforeLocation = prevLocations[i];
          const stampedLocation = persistRecordAudit("location", nextLocations[i], false, beforeLocation);
          void persistRemote((supabase) => saveLocation(supabase, stampedLocation));
        }
      }
    },
    [clientsRef, locationsRef, persistRemote]
  );

  const addAutomationTasks = useCallback(
    (drafts: AutomationTaskDraft[]) => {
      if (!drafts.length) return;

      const created: TaskRecord[] = [];
      setTasks((prev) => {
        let working = prev;
        for (const draft of drafts) {
          const base = createTask({ ...draft, updates: [] }, working);
          const task = stampRecordAudit(
            logTaskUpdate(base, {
              byUserId: "",
              byName: draft.createdBy,
              action: "created",
              summary: `Created automatically and assigned to ${describeAssignee(base)}`,
              detail: draft.entityLabel
                ? `Linked to ${draft.entityLabel}.`
                : draft.description || "",
            }),
            true
          );
          created.push(task);
          working = [...working, task];
        }
        return working;
      });

      for (const task of created) {
        void persistRemote((supabase) => saveTask(supabase, task));
      }
    },
    [persistRemote]
  );

  const runAutomationEvents = useCallback(
    (events: AutomationEvent[]) => {
      if (!events.length) return;
      const rules = automationsRef.current;
      if (!rules.some((r) => r.active)) return;

      const { drafts } = evaluateAutomationEvents({
        events,
        rules,
        tasks: tasksRef.current,
        investigationSlaDays: readInvestigationSlaDays(),
      });

      if (drafts.length) {
        addAutomationTasks(drafts);
      }
    },
    [addAutomationTasks, automationsRef, tasksRef]
  );

  const addEnquiry = useCallback(
    (partial: EnquiryRecord) => {
      const prev = enquiriesRef.current;
      const next = createEnquiry(partial, prev);
      const created = persistRecordAudit("enquiry", next, true);
      setEnquiries((current) => [...current, created]);
      void persistRemote((supabase) => saveEnquiry(supabase, created));
      runAutomationEvents(enquiryEventsFromSave(created));
      return created;
    },
    [persistRemote, enquiriesRef, runAutomationEvents]
  );

  const updateEnquiry = useCallback(
    (record: EnquiryRecord, audit?: AuditLogOptions) => {
      const before = enquiriesRef.current.find((e) => e.id === record.id);
      const stamped = persistRecordAudit("enquiry", record, false, before, audit);
      setEnquiries((prev) => prev.map((e) => (e.id === stamped.id ? stamped : e)));
      void persistRemote((supabase) => saveEnquiry(supabase, stamped));
      runAutomationEvents(enquiryEventsFromSave(stamped, before));
    },
    [persistRemote, enquiriesRef, runAutomationEvents]
  );

  const processIncidentAutomations = useCallback(
    (incident: IncidentRecord, before?: IncidentRecord) => {
      runAutomationEvents(incidentEventsFromSave(incident, before));
    },
    [runAutomationEvents]
  );

  const upsertTaskAutomation = useCallback(
    async (rule: TaskAutomationRecord) => {
      setTaskAutomations((prev) => {
        const exists = prev.some((r) => r.id === rule.id);
        const merged = exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [...prev, rule];
        return sortTaskAutomations(merged);
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        await saveTaskAutomation(supabase, rule);
      }
    },
    [source]
  );

  const deleteTaskAutomationRule = useCallback(
    (id: string) => {
      setTaskAutomations((prev) => prev.filter((r) => r.id !== id));
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void deleteTaskAutomation(supabase, id);
      }
    },
    [source]
  );

  const addIncident = useCallback(
    (partial: IncidentRecord) => {
      const prev = incidentsRef.current;
      const next = createIncident(partial, prev);
      const created = persistRecordAudit("incident", next, true);
      setIncidents((current) => [...current, created]);

      persistIncidentRelatedRecords(created, undefined, {
        isCreate: true,
        createdBy: created.createdBy,
      });

      void persistRemote((supabase) => saveIncident(supabase, created));
      trackIncidentProcessChanges(undefined, created, true);
      processIncidentAutomations(created);
      return created;
    },
    [persistRemote, incidentsRef, persistIncidentRelatedRecords, processIncidentAutomations]
  );

  const updateIncident = useCallback(
    (record: IncidentRecord, audit?: AuditLogOptions) => {
      const before = incidentsRef.current.find((i) => i.id === record.id);
      const stamped = persistRecordAudit("incident", normalizeIncident(record), false, before, audit);
      setIncidents((prev) => prev.map((i) => (i.id === stamped.id ? stamped : i)));

      persistIncidentRelatedRecords(stamped, before);

      void persistRemote((supabase) => saveIncident(supabase, stamped));
      trackIncidentProcessChanges(before, stamped, false);
      processIncidentAutomations(stamped, before);
    },
    [persistRemote, incidentsRef, persistIncidentRelatedRecords, processIncidentAutomations]
  );

  const upsertClient = useCallback(
    (client: ClientRecord, audit?: AuditLogOptions) => {
      const prev = clientsRef.current;
      const normalized = normalizeClient(client);
      const before = prev.find((c) => c.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("client", normalized, !exists, before, audit);
      setClients((current) =>
        exists ? current.map((c) => (c.id === stamped.id ? stamped : c)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveClient(supabase, stamped));
      runAutomationEvents(clientEventsFromSave(stamped, before));
    },
    [persistRemote, clientsRef, runAutomationEvents]
  );

  const addContract = useCallback(
    (partial: ContractRecord) => {
      const prev = contractsRef.current;
      const next = createContract(partial, prev);
      const created = persistRecordAudit("contract", next, true);
      setContracts((current) => [...current, created]);
      void persistRemote((supabase) => saveContract(supabase, created));
      return created;
    },
    [persistRemote, contractsRef]
  );

  const upsertContract = useCallback(
    (contract: ContractRecord) => {
      const prev = contractsRef.current;
      const normalized = normalizeContract(contract);
      const before = prev.find((c) => c.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("contract", normalized, !exists, before);
      setContracts((current) =>
        exists ? current.map((c) => (c.id === stamped.id ? stamped : c)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveContract(supabase, stamped));
    },
    [persistRemote, contractsRef]
  );

  const upsertProduct = useCallback(
    (product: ProductRecord) => {
      const prev = productsRef.current;
      const before = prev.find((p) => p.id === product.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("product", product, !exists, before);
      setProducts((current) =>
        exists ? current.map((p) => (p.id === stamped.id ? stamped : p)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveProduct(supabase, stamped));
    },
    [persistRemote, productsRef]
  );

  const upsertPriceList = useCallback(
    (list: PriceListRecord) => {
      const prev = priceListsRef.current;
      const normalized = normalizePriceList(list);
      const before = prev.find((p) => p.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("price-list", normalized, !exists, before);
      setPriceLists((current) =>
        exists ? current.map((p) => (p.id === stamped.id ? stamped : p)) : [...current, stamped]
      );
      void persistRemote((supabase) => savePriceList(supabase, stamped));
    },
    [persistRemote, priceListsRef]
  );

  const upsertServiceAgreement = useCallback(
    (record: ServiceAgreementRecord) => {
      const prev = serviceAgreementsRef.current;
      const normalized = normalizeServiceAgreement(record);
      const before = prev.find((r) => r.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("service-agreement", normalized, !exists, before);
      setServiceAgreements((current) =>
        exists ? current.map((r) => (r.id === stamped.id ? stamped : r)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveServiceAgreement(supabase, stamped));
    },
    [persistRemote, serviceAgreementsRef]
  );

  const upsertSupportPlan = useCallback(
    (record: SupportPlanRecord) => {
      const prev = supportPlansRef.current;
      const normalized = normalizeSupportPlan(record);
      const before = prev.find((r) => r.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("support-plan", normalized, !exists, before);
      setSupportPlans((current) =>
        exists ? current.map((r) => (r.id === stamped.id ? stamped : r)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveSupportPlan(supabase, stamped));
    },
    [persistRemote, supportPlansRef]
  );

  const upsertEmployee = useCallback(
    (record: EmployeeRecord) => {
      const prev = employeesRef.current;
      const normalized = normalizeEmployee(record);
      const before = prev.find((e) => e.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("employee", normalized, !exists, before);
      setEmployees((current) =>
        exists ? current.map((e) => (e.id === stamped.id ? stamped : e)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveEmployee(supabase, stamped));
      trackEmployeeCredentialChanges(before, stamped);
      runAutomationEvents(employeeEventsFromSave(stamped, before));
    },
    [persistRemote, employeesRef, runAutomationEvents]
  );

  const addEmployee = useCallback(
    (partial: EmployeeRecord) => {
      const prev = employeesRef.current;
      const next = createEmployee(partial, prev);
      const created = persistRecordAudit("employee", next, true);
      setEmployees((current) => [...current, created]);
      void persistRemote((supabase) => saveEmployee(supabase, created));
      runAutomationEvents(employeeEventsFromSave(created));
      return created;
    },
    [persistRemote, employeesRef, runAutomationEvents]
  );

  const upsertLocation = useCallback(
    (record: LocationRecord) => {
      const prev = locationsRef.current;
      const normalized = normalizeLocation(record);
      const before = prev.find((l) => l.id === normalized.id);
      const exists = Boolean(before);
      const stamped = persistRecordAudit("location", normalized, !exists, before);
      setLocations((current) =>
        exists ? current.map((l) => (l.id === stamped.id ? stamped : l)) : [...current, stamped]
      );
      void persistRemote((supabase) => saveLocation(supabase, stamped));
      trackLocationProcessChanges(before, stamped);
      runAutomationEvents(locationEventsFromSave(stamped, before));
    },
    [persistRemote, locationsRef, runAutomationEvents]
  );

  const addLocation = useCallback(
    (partial: LocationRecord) => {
      const prev = locationsRef.current;
      const next = createLocation(partial, prev);
      const created = persistRecordAudit("location", next, true);
      setLocations((current) => [...current, created]);
      void persistRemote((supabase) => saveLocation(supabase, created));
      runAutomationEvents(locationEventsFromSave(created));
      return created;
    },
    [persistRemote, locationsRef, runAutomationEvents]
  );

  const getEmployeeById = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees]
  );

  const getClientByEnquiryId = useCallback(
    (enquiryId: string) => clients.find((c) => c.enquiryId === enquiryId),
    [clients]
  );

  const getContractsByClientId = useCallback(
    (clientId: string) => contracts.filter((c) => c.clientId === clientId),
    [contracts]
  );

  const getServiceAgreementsByClientId = useCallback(
    (clientId: string) => serviceAgreements.filter((r) => r.clientId === clientId),
    [serviceAgreements]
  );

  const getSupportPlanByClientId = useCallback(
    (clientId: string) =>
      supportPlans.find((r) => r.clientId === clientId && r.active) ??
      supportPlans.find((r) => r.clientId === clientId),
    [supportPlans]
  );

  const getPlanDocumentsByClientId = useCallback(
    (clientId: string) => planDocuments.filter((d) => d.clientId === clientId),
    [planDocuments]
  );

  const upsertTask = useCallback((task: TaskRecord) => {
    const normalized = normalizeTask(task);
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === normalized.id);
      return exists ? prev.map((t) => (t.id === normalized.id ? normalized : t)) : [...prev, normalized];
    });
  }, []);

  const addTask = useCallback(
    (
      partial: Omit<TaskRecord, "id" | "documentNo" | "updates">,
      options?: { assigneeDisplayName?: string }
    ) => {
      let created!: TaskRecord;
      setTasks((prev) => {
        const base = createTask({ ...partial, updates: [] }, prev);
        const assignee = options?.assigneeDisplayName
          ? `${partial.assignmentType === "user" ? "user" : "role"} ${options.assigneeDisplayName}`
          : describeAssignee(base);
        created = logTaskUpdate(base, {
          byUserId: partial.createdByUserId,
          byName: partial.createdBy,
          action: "created",
          summary: `Created and assigned to ${assignee}`,
          detail: partial.entityLabel
            ? `Linked to ${partial.entityLabel}.`
            : partial.description || "",
        });
        return [...prev, stampRecordAudit(created, true)];
      });
      void persistRemote((supabase) => saveTask(supabase, created));
      trackProcessExecution({
        processId: "assign-task",
        entityType: partial.entityType ?? "task",
        entityId: created.id,
        entityLabel: created.documentNo,
        detail: created.description || created.documentNo,
      });
      return created;
    },
    [persistRemote]
  );

  const mutateTask = useCallback((id: string, mutator: (task: TaskRecord) => TaskRecord) => {
    let updated!: TaskRecord;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = normalizeTask(mutator(t));
        updated = stampRecordAudit(next, false);
        return updated;
      })
    );
    if (updated) {
      void persistRemote((supabase) => saveTask(supabase, updated));
    }
  }, [persistRemote]);

  const relinkEntityTasks = useCallback(
    (
      fromType: TaskEntityType,
      fromId: string,
      toType: TaskEntityType,
      toId: string,
      toLabel: string
    ) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.entityType !== fromType || t.entityId !== fromId) return t;
          return normalizeTask({
            ...t,
            entityType: toType,
            entityId: toId,
            entityLabel: toLabel,
          });
        })
      );
    },
    []
  );

  const getTasksByEntity = useCallback(
    (entityType: TaskEntityType, entityId: string) =>
      tasks.filter((t) => t.entityType === entityType && t.entityId === entityId),
    [tasks]
  );

  const getIncidentsForClient = useCallback(
    (clientId: string) => incidentsLinkedToClient(incidents, clientId),
    [incidents]
  );

  const getIncidentsForEmployee = useCallback(
    (employeeId: string) => incidentsLinkedToEmployee(incidents, employeeId),
    [incidents]
  );

  const getIncidentsForLocation = useCallback(
    (locationId: string) => incidentsLinkedToLocation(incidents, locationId),
    [incidents]
  );

  const getTaskById = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks]);

  const value = useMemo(
    () => ({
      enquiries,
      incidents,
      clients,
      contracts,
      products,
      priceLists,
      serviceAgreements,
      supportPlans,
      planDocuments,
      employees,
      locations,
      tasks,
      taskAutomations,
      hydrated,
      source,
      addEnquiry,
      updateEnquiry,
      addIncident,
      updateIncident,
      upsertClient,
      addContract,
      upsertContract,
      upsertProduct,
      upsertPriceList,
      upsertServiceAgreement,
      upsertSupportPlan,
      upsertEmployee,
      addEmployee,
      upsertLocation,
      addLocation,
      getEmployeeById,
      getClientByEnquiryId,
      getContractsByClientId,
      getServiceAgreementsByClientId,
      getSupportPlanByClientId,
      getPlanDocumentsByClientId,
      upsertTask,
      addTask,
      addAutomationTasks,
      upsertTaskAutomation,
      deleteTaskAutomation: deleteTaskAutomationRule,
      mutateTask,
      relinkEntityTasks,
      getTasksByEntity,
      getIncidentsForClient,
      getIncidentsForEmployee,
      getIncidentsForLocation,
      getTaskById,
    }),
    [
      enquiries,
      incidents,
      clients,
      contracts,
      products,
      priceLists,
      serviceAgreements,
      supportPlans,
      planDocuments,
      employees,
      locations,
      tasks,
      taskAutomations,
      hydrated,
      source,
      addEnquiry,
      updateEnquiry,
      addIncident,
      updateIncident,
      upsertClient,
      addContract,
      upsertContract,
      upsertProduct,
      upsertPriceList,
      upsertServiceAgreement,
      upsertSupportPlan,
      upsertEmployee,
      addEmployee,
      upsertLocation,
      addLocation,
      getEmployeeById,
      getClientByEnquiryId,
      getContractsByClientId,
      getServiceAgreementsByClientId,
      getSupportPlanByClientId,
      getPlanDocumentsByClientId,
      upsertTask,
      addTask,
      addAutomationTasks,
      upsertTaskAutomation,
      deleteTaskAutomationRule,
      mutateTask,
      relinkEntityTasks,
      getTasksByEntity,
      getIncidentsForClient,
      getIncidentsForEmployee,
      getIncidentsForLocation,
      getTaskById,
    ]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function useConvertEnquiry() {
  const { enquiries, clients, updateEnquiry, upsertClient, relinkEntityTasks } = useData();

  return (enquiryId: string): ClientRecord | null => {
    const enquiry = enquiries.find((e) => e.id === enquiryId);
    if (!enquiry) return null;
    const existing = clients.find((c) => c.enquiryId === enquiryId);
    if (existing) return existing;

    const client = convertEnquiryToClient(enquiry, clients);
    const updatedEnquiry: EnquiryRecord = {
      ...enquiry,
      status: "4_Converted",
      outcome:
        enquiry.outcome || `Converted to client ${client.searchKey} on ${new Date().toLocaleDateString("en-AU")}.`,
      updatedBy: "SuperUser",
    };
    updateEnquiry(updatedEnquiry, { skip: true });
    upsertClient(client, {
      action: "converted",
      summary: `Client ${client.searchKey} created from enquiry ${enquiry.documentNo}`,
      detail: client.name,
    });
    relinkEntityTasks(
      "enquiry",
      enquiryId,
      "client",
      client.id,
      `${client.searchKey} — ${client.name}`
    );
    logRecordAudit(
      "enquiry",
      enquiryId,
      "converted",
      `Enquiry ${enquiry.documentNo} converted to client`,
      { byUserId: "", byName: updatedEnquiry.updatedBy },
      `Status: ${enquiry.status} → 4_Converted\nClient: ${client.searchKey} — ${client.name}`
    );
    trackProcessExecution({
      processId: "enquiry-to-client",
      entityType: "enquiry",
      entityId: enquiryId,
      entityLabel: enquiry.documentNo,
      detail: `Client ${client.searchKey}`,
    });
    return client;
  };
}
