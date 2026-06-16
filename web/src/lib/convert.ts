/**
 * Process: enquiry-to-client (see docs/processes/01-enquiry-to-client.md)
 */
import { emptyClientFromEnquiry, makeClientSearchKey, type ClientRecord } from "@/lib/client";
import type { EnquiryRecord } from "@/lib/enquiry";

export function convertEnquiryToClient(enquiry: EnquiryRecord, existingClients: ClientRecord[]): ClientRecord {
  const searchKey = makeClientSearchKey(enquiry.firstName, enquiry.lastName, existingClients);
  return emptyClientFromEnquiry(enquiry, searchKey);
}
