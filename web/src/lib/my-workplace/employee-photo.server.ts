import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmployeeRecord } from "@/lib/employee";
import { loadMyEmployee, type MyWorkplaceContext } from "@/lib/my-workplace/server";

export const EMPLOYEE_PHOTO_BUCKET = "employee-evidence";
export const EMPLOYEE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function photoExtension(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export function validateEmployeePhotoFile(file: File): void {
  if (!file.type || !ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP photo.");
  }
  if (file.size > EMPLOYEE_PHOTO_MAX_BYTES) {
    throw new Error("Photo must be 5 MB or smaller.");
  }
}

async function publicPhotoUrl(supabase: SupabaseClient, storagePath: string): Promise<string> {
  const { data } = supabase.storage.from(EMPLOYEE_PHOTO_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function saveEmployeeProfilePhoto(
  supabase: SupabaseClient,
  ctx: MyWorkplaceContext,
  file: File
): Promise<EmployeeRecord> {
  validateEmployeePhotoFile(file);
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const storagePath = `${ctx.employeeId}/profile-${Date.now()}.${photoExtension(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(EMPLOYEE_PHOTO_BUCKET).upload(storagePath, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const pictureUrl = await publicPhotoUrl(supabase, storagePath);
  const { error } = await supabase
    .from("employee")
    .update({
      picture_url: pictureUrl,
      updated_by: ctx.session.displayName,
    })
    .eq("id", ctx.employeeId);
  if (error) throw new Error(error.message);

  const reloaded = await loadMyEmployee(ctx.employeeId);
  if (!reloaded) throw new Error("Employee record not found");
  return reloaded;
}

export async function clearEmployeeProfilePhoto(
  supabase: SupabaseClient,
  ctx: MyWorkplaceContext
): Promise<EmployeeRecord> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const { error } = await supabase
    .from("employee")
    .update({
      picture_url: "",
      updated_by: ctx.session.displayName,
    })
    .eq("id", ctx.employeeId);
  if (error) throw new Error(error.message);

  const reloaded = await loadMyEmployee(ctx.employeeId);
  if (!reloaded) throw new Error("Employee record not found");
  return reloaded;
}
