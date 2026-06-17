import type { ClientAutomationEvent } from "@/lib/task-automation/client-triggers";
import type { EmployeeAutomationEvent } from "@/lib/task-automation/employee-triggers";
import type { EnquiryAutomationEvent } from "@/lib/task-automation/enquiry-triggers";
import type { IncidentAutomationEvent } from "@/lib/task-automation/incident-triggers";
import type { LocationAutomationEvent } from "@/lib/task-automation/location-triggers";
import type { TaskAutomationTriggerEvent } from "@/lib/task-automation";

export type AutomationEvent =
  | IncidentAutomationEvent
  | EnquiryAutomationEvent
  | EmployeeAutomationEvent
  | ClientAutomationEvent
  | LocationAutomationEvent;

export function automationEventModule(event: AutomationEvent): string {
  return event.type.split(".")[0];
}

export function automationTriggerForEvent(event: AutomationEvent): TaskAutomationTriggerEvent {
  return event.type as TaskAutomationTriggerEvent;
}
