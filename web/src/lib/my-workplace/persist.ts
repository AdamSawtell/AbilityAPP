import type { AuthSession } from "@/lib/access/types";
import type {
  EmployeeActivityRow,
  EmployeeCredentialRow,
  EmployeeEmergencyContactRow,
  EmployeeLeaveRequestRow,
  EmployeeLocationRow,
} from "@/lib/employee";
import type { MyProfilePayload } from "@/lib/my-workplace/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function replaceEmployeeChildRows(
  supabase: SupabaseClient,
  table: "employee_location" | "employee_emergency_contact",
  employeeId: string
) {
  const { error } = await supabase.from(table).delete().eq("employee_id", employeeId);
  if (error) throw error;
}

export async function persistMyProfile(
  supabase: SupabaseClient,
  employeeId: string,
  session: AuthSession,
  payload: MyProfilePayload
): Promise<void> {
  const name = `${payload.firstName} ${payload.lastName}`.trim();
  const { error } = await supabase
    .from("employee")
    .update({
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      preferred_name: payload.preferredName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      mobile: payload.mobile.trim(),
      name: name || undefined,
      updated_by: session.displayName,
    })
    .eq("id", employeeId);
  if (error) throw error;

  await replaceEmployeeChildRows(supabase, "employee_location", employeeId);
  if (payload.locations.length) {
    const { error: locError } = await supabase.from("employee_location").insert(
      payload.locations.map((l: EmployeeLocationRow) => ({
        id: l.id,
        employee_id: employeeId,
        line_no: l.lineNo,
        name: l.name,
        address_type: l.addressType,
        address1: l.address1,
        address2: l.address2,
        address3: l.address3,
        city: l.city,
        state: l.state,
        postcode: l.postcode,
        country: l.country,
        phone: l.phone,
        mobile: l.mobile,
        email: l.email,
        primary_address: l.primaryAddress,
        active: l.active,
        valid_from: l.validFrom || null,
        valid_to: l.validTo || null,
        access_notes: l.accessNotes,
        description: l.description,
      }))
    );
    if (locError) throw locError;
  }

  await replaceEmployeeChildRows(supabase, "employee_emergency_contact", employeeId);
  if (payload.emergencyContacts.length) {
    const { error: ecError } = await supabase.from("employee_emergency_contact").insert(
      payload.emergencyContacts.map((c: EmployeeEmergencyContactRow) => ({
        id: c.id,
        employee_id: employeeId,
        line_no: c.lineNo,
        contact_type: c.contactType,
        name: c.name,
        relationship: c.relationship,
        phone: c.phone,
        mobile: c.mobile,
        email: c.email,
        call_order: c.callOrder,
        primary_contact: c.primaryContact,
        notes: c.notes,
      }))
    );
    if (ecError) throw ecError;
  }
}

export async function persistMyLeaveRequest(
  supabase: SupabaseClient,
  employeeId: string,
  request: EmployeeLeaveRequestRow,
  activity: EmployeeActivityRow
): Promise<void> {
  const { error } = await supabase.from("employee_leave_request").insert({
    id: request.id,
    employee_id: employeeId,
    line_no: request.lineNo,
    leave_type: request.leaveType,
    start_date: request.startDate,
    end_date: request.endDate,
    days_requested: request.daysRequested,
    status: request.status,
    notes: request.notes,
    submitted_at: request.submittedAt ?? null,
    reviewed_at: request.reviewedAt ?? null,
    reviewed_by: request.reviewedBy ?? "",
    decline_reason: request.declineReason ?? "",
  });
  if (error) throw error;

  const { error: actError } = await supabase.from("employee_activity").insert({
    id: activity.id,
    employee_id: employeeId,
    line_no: activity.lineNo,
    activity_date: activity.date || null,
    activity_type: activity.activityType,
    subject: activity.subject,
    description: activity.description,
    created_by: activity.createdBy,
  });
  if (actError) throw actError;
}

export async function persistMyCredential(
  supabase: SupabaseClient,
  employeeId: string,
  credential: EmployeeCredentialRow,
  activity: EmployeeActivityRow
): Promise<void> {
  const fullRow = {
    id: credential.id,
    employee_id: employeeId,
    line_no: credential.lineNo,
    credential_type: credential.credentialType,
    credential_number: credential.credentialNumber,
    issuing_body: credential.issuingBody,
    issue_date: credential.issueDate || null,
    expiry_date: credential.expiryDate || null,
    status: credential.status,
    document_ref: credential.evidenceRef?.trim() || credential.documentRef,
    evidence_ref: credential.evidenceRef ?? "",
    notes: credential.notes,
    staff_submitted: credential.staffSubmitted ?? false,
    submitted_at: credential.submittedAt ?? null,
    submitted_by_user_id: credential.submittedByUserId ?? "",
    reviewed_at: credential.reviewedAt ?? null,
    reviewed_by: credential.reviewedBy ?? "",
    review_notes: credential.reviewNotes ?? "",
    created_by: credential.createdBy,
    updated_by: credential.updatedBy,
  };

  let { error } = await supabase.from("employee_credential").insert(fullRow);
  if (error?.message?.includes("evidence_ref")) {
    const { evidence_ref: _e, staff_submitted: _s, submitted_at: _sa, submitted_by_user_id: _su, reviewed_at: _ra, reviewed_by: _rb, review_notes: _rn, ...baseRow } = fullRow;
    ({ error } = await supabase.from("employee_credential").insert(baseRow));
  }
  if (error) throw error;

  const { error: actError } = await supabase.from("employee_activity").insert({
    id: activity.id,
    employee_id: employeeId,
    line_no: activity.lineNo,
    activity_date: activity.date || null,
    activity_type: activity.activityType,
    subject: activity.subject,
    description: activity.description,
    created_by: activity.createdBy,
  });
  if (actError) throw actError;
}
