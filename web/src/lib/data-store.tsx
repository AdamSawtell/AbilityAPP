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

type DataStore = {
  enquiries: EnquiryRecord[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  supportPlans: SupportPlanRecord[];
  planDocuments: PlanAssessmentDocument[];
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

function isPersisted(value: unknown): value is Persisted {
  if (!value || typeof value !== "object") return false;
  const v = value as Persisted;
  return Array.isArray(v.enquiries) && Array.isArray(v.clients);
}

function load(): Required<Omit<Persisted, never>> & {
  enquiries: EnquiryRecord[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
} {
  const defaults = {
    enquiries: seedEnquiries,
    clients: seedClients,
    contracts: seedContracts,
    products: seedProducts,
    priceLists: seedPriceLists.map(normalizePriceList),
    serviceAgreements: seedServiceAgreements.map(normalizeServiceAgreement),
    supportPlans: seedSupportPlans.map(normalizeSupportPlan),
    planDocuments: seedPlanDocuments,
  };
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(seedEnquiries);
  const [clients, setClients] = useState<ClientRecord[]>(seedClients);
  const [contracts, setContracts] = useState<ContractRecord[]>(seedContracts);
  const [products, setProducts] = useState<ProductRecord[]>(seedProducts);
  const [priceLists, setPriceLists] = useState<PriceListRecord[]>(seedPriceLists.map(normalizePriceList));
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreementRecord[]>(
    seedServiceAgreements.map(normalizeServiceAgreement)
  );
  const [supportPlans, setSupportPlans] = useState<SupportPlanRecord[]>(
    seedSupportPlans.map(normalizeSupportPlan)
  );
  const [planDocuments, setPlanDocuments] = useState<PlanAssessmentDocument[]>(seedPlanDocuments);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const data = load();
      setEnquiries(data.enquiries);
      setClients(data.clients);
      setContracts(data.contracts);
      setProducts(data.products);
      setPriceLists(data.priceLists);
      setServiceAgreements(data.serviceAgreements);
      setSupportPlans(data.supportPlans);
      setPlanDocuments(data.planDocuments);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enquiries, clients, contracts, products, priceLists, serviceAgreements, supportPlans, planDocuments })
      );
    } catch {
      // ignore quota errors
    }
  }, [enquiries, clients, contracts, products, priceLists, serviceAgreements, supportPlans, planDocuments, hydrated]);

  const addEnquiry = useCallback((partial: EnquiryRecord) => {
    let created!: EnquiryRecord;
    setEnquiries((prev) => {
      created = createEnquiry(partial, prev);
      return [...prev, created];
    });
    return created;
  }, []);

  const updateEnquiry = useCallback((record: EnquiryRecord) => {
    setEnquiries((prev) => prev.map((e) => (e.id === record.id ? record : e)));
  }, []);

  const upsertClient = useCallback((client: ClientRecord) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      return exists ? prev.map((c) => (c.id === client.id ? client : c)) : [...prev, client];
    });
  }, []);

  const addContract = useCallback((partial: ContractRecord) => {
    let created!: ContractRecord;
    setContracts((prev) => {
      created = createContract(partial, prev);
      return [...prev, created];
    });
    return created;
  }, []);

  const upsertContract = useCallback((contract: ContractRecord) => {
    setContracts((prev) => {
      const exists = prev.some((c) => c.id === contract.id);
      return exists ? prev.map((c) => (c.id === contract.id ? contract : c)) : [...prev, contract];
    });
  }, []);

  const upsertProduct = useCallback((product: ProductRecord) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [...prev, product];
    });
  }, []);

  const upsertPriceList = useCallback((list: PriceListRecord) => {
    setPriceLists((prev) => {
      const normalized = normalizePriceList(list);
      const exists = prev.some((p) => p.id === normalized.id);
      return exists ? prev.map((p) => (p.id === normalized.id ? normalized : p)) : [...prev, normalized];
    });
  }, []);

  const upsertServiceAgreement = useCallback((record: ServiceAgreementRecord) => {
    setServiceAgreements((prev) => {
      const normalized = normalizeServiceAgreement(record);
      const exists = prev.some((r) => r.id === normalized.id);
      return exists ? prev.map((r) => (r.id === normalized.id ? normalized : r)) : [...prev, normalized];
    });
  }, []);

  const upsertSupportPlan = useCallback((record: SupportPlanRecord) => {
    setSupportPlans((prev) => {
      const normalized = normalizeSupportPlan(record);
      const exists = prev.some((r) => r.id === normalized.id);
      return exists ? prev.map((r) => (r.id === normalized.id ? normalized : r)) : [...prev, normalized];
    });
  }, []);

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
    (clientId: string) => supportPlans.find((r) => r.clientId === clientId && r.active) ?? supportPlans.find((r) => r.clientId === clientId),
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
