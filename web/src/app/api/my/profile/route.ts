import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { loadMyEmployee, requireMyWorkplace, saveMyProfile, type MyProfilePayload } from "@/lib/my-workplace/server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-profile");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) return NextResponse.json({ error: "No linked employee record" }, { status: 404 });

  return NextResponse.json({
    firstName: employee.firstName,
    lastName: employee.lastName,
    preferredName: employee.preferredName,
    email: employee.email,
    phone: employee.phone,
    mobile: employee.mobile,
    jobTitle: employee.jobTitle,
    department: employee.department,
    employmentType: employee.employmentType,
    emergencyContacts: employee.emergencyContacts,
    locations: employee.locations,
  });
}

export async function PATCH(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-profile");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: MyProfilePayload;
  try {
    body = (await request.json()) as MyProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const employee = await saveMyProfile(ctx, body);
    return NextResponse.json({ employee });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
