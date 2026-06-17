import type { EnquiryRecord } from "@/lib/enquiry";

export type EnquiryAutomationEvent =
  | { type: "enquiry.created"; enquiry: EnquiryRecord }
  | { type: "enquiry.status_changed"; enquiry: EnquiryRecord; beforeStatus: string };

export function enquiryEventsFromSave(
  enquiry: EnquiryRecord,
  before?: EnquiryRecord
): EnquiryAutomationEvent[] {
  if (!before) {
    return [{ type: "enquiry.created", enquiry }];
  }

  const events: EnquiryAutomationEvent[] = [];
  if (before.status !== enquiry.status) {
    events.push({
      type: "enquiry.status_changed",
      enquiry,
      beforeStatus: before.status,
    });
  }
  return events;
}
