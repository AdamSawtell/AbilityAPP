import { toast } from "sonner";

/** Shared id so a new save replaces the previous toast instead of stacking. */
export const SAVE_SUCCESS_TOAST_ID = "save-success";

/** Brief green confirmation after a successful save or submit. */
export function showSuccessToast(message: string) {
  toast.success(message, {
    id: SAVE_SUCCESS_TOAST_ID,
    duration: 3000,
  });
}

export const SAVE_TOAST_MESSAGES = {
  availability: "Availability saved ✓",
  shift: "Shift saved ✓",
  timesheetSubmit: "Timesheet submitted ✓",
  client: "Client saved ✓",
  activityNote: "Activity note saved ✓",
  leaveSubmit: "Leave request submitted ✓",
  settings: "Settings saved ✓",
  location: "Location saved ✓",
  staff: "Staff saved ✓",
  documentUpload: "Document uploaded ✓",
  saved: "Saved ✓",
  goals: "Goals saved ✓",
  progressReviews: "Progress reviews saved ✓",
} as const;
