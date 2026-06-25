import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import {
  defaultAvailabilityRows,
  loadMyAvailability,
  saveMyAvailability,
} from "@/lib/my-workplace/server";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import { loadMyEmployee } from "@/lib/my-workplace/server";

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "workforce-planning") && !sessionHasWindow(session, "employees")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employeeId = new URL(request.url).searchParams.get("employeeId")?.trim();
  if (!employeeId) return NextResponse.json({ error: "employeeId is required" }, { status: 400 });

  const employee = await loadMyEmployee(employeeId);
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  let rows = await loadMyAvailability(employeeId);
  if (!rows.length) rows = defaultAvailabilityRows();

  return NextResponse.json({ employeeId, rows });
}

export async function PUT(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "workforce-planning")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { employeeId?: string; rows?: EmployeeAvailabilityRow[]; allowEmpty?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  if (!employeeId || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "employeeId and rows are required" }, { status: 400 });
  }

  if (body.rows.length === 0 && body.allowEmpty !== true) {
    return NextResponse.json(
      { error: "No availability rows to save — reload the page and try again before saving." },
      { status: 400 }
    );
  }

  const employee = await loadMyEmployee(employeeId);
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  try {
    const result = await saveMyAvailability({ session, employeeId }, body.rows, {
      allowEmpty: body.allowEmpty === true,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
