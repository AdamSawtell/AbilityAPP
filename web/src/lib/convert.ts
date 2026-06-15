import { emptyClientFromEnquiry, type ClientRecord } from "@/lib/client";
import type { EnquiryRecord } from "@/lib/enquiry";

function makeSearchKey(firstName: string, lastName: string, existing: ClientRecord[]): string {
  const base = `${firstName}${lastName}`.replace(/[^a-zA-Z]/g, "").slice(0, 8) || "client";
  let key = base.charAt(0).toUpperCase() + base.slice(1, 4).toLowerCase();
  let n = 1;
  while (existing.some((c) => c.searchKey.toLowerCase() === key.toLowerCase())) {
    key = `${base.slice(0, 3)}${n}`;
    n += 1;
  }
  return key;
}

export function convertEnquiryToClient(enquiry: EnquiryRecord, existingClients: ClientRecord[]): ClientRecord {
  const searchKey = makeSearchKey(enquiry.firstName, enquiry.lastName, existingClients);
  return emptyClientFromEnquiry(enquiry, searchKey);
}
