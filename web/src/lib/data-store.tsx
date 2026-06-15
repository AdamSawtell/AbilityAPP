"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createEnquiry, initialRecords as seedEnquiries, type EnquiryRecord } from "@/lib/enquiry";
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
  createTask,
  describeAssignee,
  initialTasks as seedTasks,
  logTaskUpdate,
  normalizeTask,
  type TaskEntityType,
  type TaskRecord,
} from "@/lib/task";
import { convertEnquiryToClient } from "@/lib/convert";
import { persistRecordAudit } from "@/lib/audit-mutation";
import { logRecordAudit } from "@/lib/audit-log";
import { stampRecordAudit } from "@/lib/audit";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllData,
  saveClient,
  saveContract,
  saveEmployee,
  saveEnquiry,
  savePriceList,
  saveProduct,
  saveServiceAgreement,
  saveSupportPlan,
} from "@/lib/supabase/data-api";

type DataStore = {
  enquiries: EnquiryRecord[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  supportPlans: SupportPlanRecord[];
  planDocuments: PlanAssessmentDocument[];
  employees: EmployeeRecord[];
  tasks: TaskRecord[];
  source: "supabase" | "local";
  addEnquiry: (record: EnquiryRecord) => EnquiryRecord;
  updateEnquiry: (record: EnquiryRecord) => void;
  upsertClient: (client: ClientRecord) => void;
  addContract: (record: ContractRecord) => ContractRecord;
  upsertContract: (contract: ContractRecord) => void;
  upsertProduct: (product: ProductRecord) => void;
  upsertPriceList: (list: PriceListRecord) => void;
  upsertServiceAgreement: (record: ServiceAgreementRecord) => void;
  upsertSupportPlan: (record: SupportPlanRecord) => void;
  upsertEmployee: (record: EmployeeRecord) => void;
  addEmployee: (partial: EmployeeRecord) => EmployeeRecord;
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
  mutateTask: (id: string, mutator: (task: TaskRecord) => TaskRecord) => void;
  getTasksByEntity: (entityType: TaskEntityType, entityId: string) => TaskRecord[];
  getTaskById: (id: string) => TaskRecord | undefined;
};

const DataContext = createContext<DataStore | null>(null);
const STORAGE_KEY = "abilityerp-clone-data";

type Persisted = {
  enquiries: EnquiryRecord[];
  clients: ClientRecord[];
  contracts?: ContractRecord[];
  products?: ProductRecord[];
  priceLists?: PriceListRecord[];
  serviceAgreements?: ServiceAgreementRecord[];
  supportPlans?: SupportPlanRecord[];
  planDocuments?: PlanAssessmentDocument[];
  employees?: EmployeeRecord[];
  tasks?: TaskRecord[];
};

function seedData(): Required<Persisted> {
  return {
    enquiries: seedEnquiries,
    clients: seedClients,
    contracts: seedContracts,
    products: seedProducts,
    priceLists: seedPriceLists.map(normalizePriceList),
    serviceAgreements: seedServiceAgreements.map(normalizeServiceAgreement),
    supportPlans: seedSupportPlans.map(normalizeSupportPlan),
    planDocuments: seedPlanDocuments,
    employees: seedEmployees.map(normalizeEmployee),
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
      enquiries: parsed.enquiries,
      clients: parsed.clients.map(normalizeClient),
      contracts: (parsed.contracts ?? seedContracts).map(normalizeContract),
      products: parsed.products ?? seedProducts,
      priceLists: (parsed.priceLists ?? seedPriceLists).map(normalizePriceList),
      serviceAgreements: (parsed.serviceAgreements ?? seedServiceAgreements).map(normalizeServiceAgreement),
      supportPlans: (parsed.supportPlans ?? seedSupportPlans).map(normalizeSupportPlan),
      planDocuments: parsed.planDocuments ?? seedPlanDocuments,
      employees: (parsed.employees ?? seedEmployees).map(normalizeEmployee),
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
  const [clients, setClients] = useState<ClientRecord[]>(defaults.clients);
  const [contracts, setContracts] = useState<ContractRecord[]>(defaults.contracts);
  const [products, setProducts] = useState<ProductRecord[]>(defaults.products);
  const [priceLists, setPriceLists] = useState<PriceListRecord[]>(defaults.priceLists);
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreementRecord[]>(defaults.serviceAgreements);
  const [supportPlans, setSupportPlans] = useState<SupportPlanRecord[]>(defaults.supportPlans);
  const [planDocuments, setPlanDocuments] = useState<PlanAssessmentDocument[]>(defaults.planDocuments);
  const [employees, setEmployees] = useState<EmployeeRecord[]>(defaults.employees);
  const [tasks, setTasks] = useState<TaskRecord[]>(defaults.tasks);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const data = await fetchAllData(supabase);
          if (!cancelled) {
            setEnquiries(data.enquiries);
            setClients(data.clients);
            setContracts(data.contracts);
            setProducts(data.products);
            setPriceLists(data.priceLists);
            setServiceAgreements(data.serviceAgreements);
            setSupportPlans(data.supportPlans);
            setPlanDocuments(data.planDocuments);
            setEmployees(data.employees);
            setTasks(loadLocal().tasks);
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
        setClients(data.clients);
        setContracts(data.contracts);
        setProducts(data.products);
        setPriceLists(data.priceLists);
        setServiceAgreements(data.serviceAgreements);
        setSupportPlans(data.supportPlans);
        setPlanDocuments(data.planDocuments);
        setEmployees(data.employees);
        setTasks(data.tasks);
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
      clients,
      contracts,
      products,
      priceLists,
      serviceAgreements,
      supportPlans,
      planDocuments,
      employees,
      tasks,
    });
  }, [
    enquiries,
    clients,
    contracts,
    products,
    priceLists,
    serviceAgreements,
    supportPlans,
    planDocuments,
    employees,
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

  const addEnquiry = useCallback(
    (partial: EnquiryRecord) => {
      let created!: EnquiryRecord;
      setEnquiries((prev) => {
        const next = createEnquiry(partial, prev);
        created = persistRecordAudit("enquiry", next, true, {
          summary: `Enquiry ${next.documentNo} created`,
        });
        return [...prev, created];
      });
      void persistRemote((supabase) => saveEnquiry(supabase, created));
      return created;
    },
    [persistRemote]
  );

  const updateEnquiry = useCallback(
    (record: EnquiryRecord) => {
      let stamped!: EnquiryRecord;
      setEnquiries((prev) => {
        stamped = persistRecordAudit("enquiry", record, false, {
          summary: `Enquiry ${record.documentNo} updated`,
        });
        return prev.map((e) => (e.id === stamped.id ? stamped : e));
      });
      void persistRemote((supabase) => saveEnquiry(supabase, stamped));
    },
    [persistRemote]
  );

  const upsertClient = useCallback(
    (client: ClientRecord) => {
      let stamped!: ClientRecord;
      setClients((prev) => {
        const normalized = normalizeClient(client);
        const exists = prev.some((c) => c.id === normalized.id);
        stamped = persistRecordAudit("client", normalized, !exists, {
          summary: exists ? `Client ${normalized.searchKey} updated` : `Client ${normalized.searchKey} created`,
        });
        return exists ? prev.map((c) => (c.id === stamped.id ? stamped : c)) : [...prev, stamped];
      });
      void persistRemote((supabase) => saveClient(supabase, stamped));
    },
    [persistRemote]
  );

  const addContract = useCallback(
    (partial: ContractRecord) => {
      let created!: ContractRecord;
      setContracts((prev) => {
        const next = createContract(partial, prev);
        created = persistRecordAudit("contract", next, true, {
          summary: `Contract ${next.documentNo} created`,
        });
        return [...prev, created];
      });
      void persistRemote((supabase) => saveContract(supabase, created));
      return created;
    },
    [persistRemote]
  );

  const upsertContract = useCallback(
    (contract: ContractRecord) => {
      let stamped!: ContractRecord;
      setContracts((prev) => {
        const normalized = normalizeContract(contract);
        const exists = prev.some((c) => c.id === normalized.id);
        stamped = persistRecordAudit("contract", normalized, !exists, {
          summary: exists ? `Contract ${normalized.documentNo} updated` : `Contract ${normalized.documentNo} created`,
        });
        return exists ? prev.map((c) => (c.id === stamped.id ? stamped : c)) : [...prev, stamped];
      });
      void persistRemote((supabase) => saveContract(supabase, stamped));
    },
    [persistRemote]
  );

  const upsertProduct = useCallback(
    (product: ProductRecord) => {
      let stamped!: ProductRecord;
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        stamped = persistRecordAudit("product", product, !exists, {
          summary: exists ? `Product ${product.name} updated` : `Product ${product.name} created`,
        });
        return exists ? prev.map((p) => (p.id === stamped.id ? stamped : p)) : [...prev, stamped];
      });
      void persistRemote((supabase) => saveProduct(supabase, stamped));
    },
    [persistRemote]
  );

  const upsertPriceList = useCallback(
    (list: PriceListRecord) => {
      let stamped!: PriceListRecord;
      setPriceLists((prev) => {
        const normalized = normalizePriceList(list);
        const exists = prev.some((p) => p.id === normalized.id);
        stamped = persistRecordAudit("price-list", normalized, !exists, {
          summary: exists ? `Price list ${normalized.name} updated` : `Price list ${normalized.name} created`,
        });
        return exists ? prev.map((p) => (p.id === stamped.id ? stamped : p)) : [...prev, stamped];
      });
      void persistRemote((supabase) => savePriceList(supabase, stamped));
    },
    [persistRemote]
  );

  const upsertServiceAgreement = useCallback(
    (record: ServiceAgreementRecord) => {
      let stamped!: ServiceAgreementRecord;
      setServiceAgreements((prev) => {
        const normalized = normalizeServiceAgreement(record);
        const exists = prev.some((r) => r.id === normalized.id);
        stamped = persistRecordAudit("service-agreement", normalized, !exists, {
          summary: exists
            ? `Service agreement ${normalized.searchKey} updated`
            : `Service agreement ${normalized.searchKey} created`,
        });
        return exists ? prev.map((r) => (r.id === stamped.id ? stamped : r)) : [...prev, stamped];
      });
      void persistRemote((supabase) => saveServiceAgreement(supabase, stamped));
    },
    [persistRemote]
  );

  const upsertSupportPlan = useCallback(
    (record: SupportPlanRecord) => {
      let stamped!: SupportPlanRecord;
      setSupportPlans((prev) => {
        const normalized = normalizeSupportPlan(record);
        const exists = prev.some((r) => r.id === normalized.id);
        stamped = persistRecordAudit("support-plan", normalized, !exists, {
          summary: exists ? `Support plan updated` : `Support plan created`,
        });
        return exists ? prev.map((r) => (r.id === stamped.id ? stamped : r)) : [...prev, stamped];
      });
      void persistRemote((supabase) => saveSupportPlan(supabase, stamped));
    },
    [persistRemote]
  );

  const upsertEmployee = useCallback(
    (record: EmployeeRecord) => {
      let stamped!: EmployeeRecord;
      setEmployees((prev) => {
        const normalized = normalizeEmployee(record);
        const exists = prev.some((e) => e.id === normalized.id);
        stamped = persistRecordAudit("employee", normalized, !exists, {
          summary: exists ? `Employee ${normalized.searchKey} updated` : `Employee ${normalized.searchKey} created`,
        });
        return exists ? prev.map((e) => (e.id === stamped.id ? stamped : e)) : [...prev, stamped];
      });
      void persistRemote((supabase) => saveEmployee(supabase, stamped));
    },
    [persistRemote]
  );

  const addEmployee = useCallback(
    (partial: EmployeeRecord) => {
      let created!: EmployeeRecord;
      setEmployees((prev) => {
        const next = createEmployee(partial, prev);
        created = persistRecordAudit("employee", next, true, {
          summary: `Employee ${next.searchKey} created`,
        });
        return [...prev, created];
      });
      void persistRemote((supabase) => saveEmployee(supabase, created));
      return created;
    },
    [persistRemote]
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
      return created;
    },
    []
  );

  const mutateTask = useCallback((id: string, mutator: (task: TaskRecord) => TaskRecord) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = normalizeTask(mutator(t));
        return stampRecordAudit(next, false);
      })
    );
  }, []);

  const getTasksByEntity = useCallback(
    (entityType: TaskEntityType, entityId: string) =>
      tasks.filter((t) => t.entityType === entityType && t.entityId === entityId),
    [tasks]
  );

  const getTaskById = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks]);

  const value = useMemo(
    () => ({
      enquiries,
      clients,
      contracts,
      products,
      priceLists,
      serviceAgreements,
      supportPlans,
      planDocuments,
      employees,
      tasks,
      source,
      addEnquiry,
      updateEnquiry,
      upsertClient,
      addContract,
      upsertContract,
      upsertProduct,
      upsertPriceList,
      upsertServiceAgreement,
      upsertSupportPlan,
      upsertEmployee,
      addEmployee,
      getEmployeeById,
      getClientByEnquiryId,
      getContractsByClientId,
      getServiceAgreementsByClientId,
      getSupportPlanByClientId,
      getPlanDocumentsByClientId,
      upsertTask,
      addTask,
      mutateTask,
      getTasksByEntity,
      getTaskById,
    }),
    [
      enquiries,
      clients,
      contracts,
      products,
      priceLists,
      serviceAgreements,
      supportPlans,
      planDocuments,
      employees,
      tasks,
      source,
      addEnquiry,
      updateEnquiry,
      upsertClient,
      addContract,
      upsertContract,
      upsertProduct,
      upsertPriceList,
      upsertServiceAgreement,
      upsertSupportPlan,
      upsertEmployee,
      addEmployee,
      getEmployeeById,
      getClientByEnquiryId,
      getContractsByClientId,
      getServiceAgreementsByClientId,
      getSupportPlanByClientId,
      getPlanDocumentsByClientId,
      upsertTask,
      addTask,
      mutateTask,
      getTasksByEntity,
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
  const { enquiries, clients, updateEnquiry, upsertClient } = useData();

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
    updateEnquiry(updatedEnquiry);
    upsertClient(client);
    logRecordAudit(
      "enquiry",
      enquiryId,
      "converted",
      `Enquiry ${enquiry.documentNo} converted to client`,
      { byUserId: "", byName: updatedEnquiry.updatedBy },
      `Client ${client.searchKey} — ${client.name}`
    );
    logRecordAudit(
      "client",
      client.id,
      "converted",
      `Client created from enquiry ${enquiry.documentNo}`,
      { byUserId: "", byName: client.updatedBy },
      client.name
    );
    return client;
  };
}
