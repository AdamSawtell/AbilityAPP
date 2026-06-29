import type { GenericTableConfig } from "@/components/line-item-table";
import { newLineId } from "@/lib/client-line-tables";
import { emptyMaintenancePhoto, type MaintenancePhotoRow } from "@/lib/maintenance-request";

export const maintenancePhotoTableConfig: GenericTableConfig<MaintenancePhotoRow> = {
  addLabel: "Add photo",
  emptyMessage: "No photos or documents attached yet.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "photoType", label: "Type", type: "select", optionsKey: "maintenancePhotoType" },
    { key: "fileUrl", label: "Photo URL", type: "text", required: true },
    { key: "caption", label: "Caption", type: "text" },
    { key: "uploadedBy", label: "Uploaded by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    ...emptyMaintenancePhoto(lineNo),
    id: newLineId("maint-photo"),
  }),
};
