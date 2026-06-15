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
import { convertEnquiryToClient } from "@/lib/convert";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllData,
  saveClient,
  saveContract,
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
  getClientByEnquiryId: (enquiryId: string) => ClientRecord | undefined;
  getContractsByClientId: (clientId: string) => ContractRecord[];
  getServiceAgreementsByClientId: (clientId: string) => ServiceAgreementRecord[];
  getSupportPlanByClientId: (clientId: string) => SupportPlanRecord | undefined;
  getPlanDocumentsByClientId: (clientId: string) => PlanAssessmentDocument[];
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
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const data = await fetchAllData(supabase);
          if (!cancelled && data.enquiries.length) {
            setEnquiries(data.enquiries);
            setClients(data.clients);
            setContracts(data.contracts);
            setProducts(data.products);
            setPriceLists(data.priceLists);
            setServiceAgreements(data.serviceAgreements);
            setSupportPlans(data.supportPlans);
            setPlanDocuments(data.planDocuments);
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
        created = createEnquiry(partial, prev);
        return [...prev, created];
      });
      void persistRemote((supabase) => saveEnquiry(supabase, created));
      return created;
    },
    [persistRemote]
  );

  const updateEnquiry = useCallback(
    (record: EnquiryRecord) => {
      setEnquiries((prev) => prev.map((e) => (e.id === record.id ? record : e)));
      void persistRemote((supabase) => saveEnquiry(supabase, record));
    },
    [persistRemote]
  );

  const upsertClient = useCallback(
    (client: ClientRecord) => {
      const normalized = normalizeClient(client);
      setClients((prev) => {
        const exists = prev.some((c) => c.id === normalized.id);
        return exists ? prev.map((c) => (c.id === normalized.id ? normalized : c)) : [...prev, normalized];
      });
      void persistRemote((supabase) => saveClient(supabase, normalized));
    },
    [persistRemote]
  );

  const addContract = useCallback(
    (partial: ContractRecord) => {
      let created!: ContractRecord;
      setContracts((prev) => {
        created = createContract(partial, prev);
        return [...prev, created];
      });
      void persistRemote((supabase) => saveContract(supabase, created));
      return created;
    },
    [persistRemote]
  );

  const upsertContract = useCallback(
    (contract: ContractRecord) => {
      const normalized = normalizeContract(contract);
      setContracts((prev) => {
        const exists = prev.some((c) => c.id === normalized.id);
        return exists ? prev.map((c) => (c.id === normalized.id ? normalized : c)) : [...prev, normalized];
      });
      void persistRemote((supabase) => saveContract(supabase, normalized));
    },
    [persistRemote]
  );

  const upsertProduct = useCallback(
    (product: ProductRecord) => {
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [...prev, product];
      });
      void persistRemote((supabase) => saveProduct(supabase, product));
    },
    [persistRemote]
  );

  const upsertPriceList = useCallback(
    (list: PriceListRecord) => {
      const normalized = normalizePriceList(list);
      setPriceLists((prev) => {
        const exists = prev.some((p) => p.id === normalized.id);
        return exists ? prev.map((p) => (p.id === normalized.id ? normalized : p)) : [...prev, normalized];
      });
      void persistRemote((supabase) => savePriceList(supabase, normalized));
    },
    [persistRemote]
  );

  const upsertServiceAgreement = useCallback(
    (record: ServiceAgreementRecord) => {
      const normalized = normalizeServiceAgreement(record);
      setServiceAgreements((prev) => {
        const exists = prev.some((r) => r.id === normalized.id);
        return exists ? prev.map((r) => (r.id === normalized.id ? normalized : r)) : [...prev, normalized];
      });
      void persistRemote((supabase) => saveServiceAgreement(supabase, normalized));
    },
    [persistRemote]
  );

  const upsertSupportPlan = useCallback(
    (record: SupportPlanRecord) => {
      const normalized = normalizeSupportPlan(record);
      setSupportPlans((prev) => {
        const exists = prev.some((r) => r.id === normalized.id);
        return exists ? prev.map((r) => (r.id === normalized.id ? normalized : r)) : [...prev, normalized];
      });
      void persistRemote((supabase) => saveSupportPlan(supabase, normalized));
    },
    [persistRemote]
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
      getClientByEnquiryId,
      getContractsByClientId,
      getServiceAgreementsByClientId,
      getSupportPlanByClientId,
      getPlanDocumentsByClientId,
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
      getClientByEnquiryId,
      getContractsByClientId,
      getServiceAgreementsByClientId,
      getSupportPlanByClientId,
      getPlanDocumentsByClientId,
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
    return client;
  };
}
