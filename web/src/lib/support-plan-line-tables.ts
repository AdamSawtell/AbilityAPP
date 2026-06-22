import { newLineId } from "@/lib/client-line-tables";
import type { GenericTableConfig } from "@/components/line-item-table";
import type {
  SupportPlanAssistiveTechnologyLine,
  SupportPlanDiagnosisLine,
  SupportPlanHealthPlanLine,
  SupportPlanMedicationLine,
  SupportPlanSupportRequirementLine,
} from "@/lib/support-plan";

export const medicationTableConfig: GenericTableConfig<SupportPlanMedicationLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "medicationName", label: "Medication name", type: "text", required: true },
    { key: "dosage", label: "Dosage", type: "text" },
    { key: "purpose", label: "Purpose", type: "textarea", className: "min-w-[160px]" },
    { key: "administrationRequirements", label: "Administration requirements", type: "textarea", className: "min-w-[180px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("med"),
    lineNo,
    medicationName: "",
    dosage: "",
    purpose: "",
    administrationRequirements: "",
  }),
  addLabel: "Add medication",
  emptyMessage: "No medications recorded. Add each medication with dosage and administration instructions.",
};

export const diagnosisTableConfig: GenericTableConfig<SupportPlanDiagnosisLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "diagnosis", label: "Diagnosis", type: "text", required: true },
    { key: "condition", label: "Condition", type: "text" },
    { key: "treatingPractitioner", label: "Treating practitioner", type: "text" },
    { key: "impactOnDailyLiving", label: "Impact on daily living", type: "textarea", className: "min-w-[180px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("dx"),
    lineNo,
    diagnosis: "",
    condition: "",
    treatingPractitioner: "",
    impactOnDailyLiving: "",
  }),
  addLabel: "Add diagnosis",
  emptyMessage: "No diagnoses recorded.",
};

export const healthPlanTableConfig: GenericTableConfig<SupportPlanHealthPlanLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "planType", label: "Plan type", type: "select", optionsKey: "healthPlanType", required: true },
    { key: "attachmentReference", label: "Attachment / reference", type: "text" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[180px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("hp"),
    lineNo,
    planType: "",
    attachmentReference: "",
    notes: "",
  }),
  addLabel: "Add health plan",
  emptyMessage: "No health plans attached. Record medication, seizure, diabetes, PEG, or dysphagia plans.",
};

export const supportRequirementTableConfig: GenericTableConfig<SupportPlanSupportRequirementLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "supportArea", label: "Support area", type: "select", optionsKey: "supportRequirementArea", required: true },
    { key: "supportRequirement", label: "Support requirement", type: "text", required: true },
    { key: "levelOfAssistance", label: "Level of assistance", type: "select", optionsKey: "supportAssistanceLevel" },
    { key: "frequency", label: "Frequency", type: "select", optionsKey: "supportFrequency" },
    { key: "specialInstructions", label: "Special instructions", type: "textarea", className: "min-w-[180px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("req"),
    lineNo,
    supportArea: "",
    supportRequirement: "",
    levelOfAssistance: "",
    frequency: "",
    specialInstructions: "",
  }),
  addLabel: "Add support requirement",
  emptyMessage: "No structured support requirements. Workers use this section daily.",
};

export const assistiveTechnologyTableConfig: GenericTableConfig<SupportPlanAssistiveTechnologyLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "equipment", label: "Equipment", type: "text", required: true },
    { key: "serialNumber", label: "Serial number", type: "text" },
    { key: "maintenanceSchedule", label: "Maintenance schedule", type: "text" },
    { key: "trainingRequired", label: "Training required", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("at"),
    lineNo,
    equipment: "",
    serialNumber: "",
    maintenanceSchedule: "",
    trainingRequired: "",
  }),
  addLabel: "Add equipment",
  emptyMessage: "No assistive technology recorded.",
};
