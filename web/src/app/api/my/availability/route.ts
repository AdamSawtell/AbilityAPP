import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import {
  defaultAvailabilityRows,
  loadMyAvailability,
  requireMyWorkplace,
  saveMyAvailability,
} from "@/lib/my-workplace/server";
import type { EmployeeAvailabilityRow } from "@/lib/employee";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-availability");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await loadMyAvailability(ctx.employeeId);
  return NextResponse.json({
    rows: rows.length ? rows : defaultAvailabilityRows(),
  });
}

export async function PUT(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-availability");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { rows?: EmployeeAvailabilityRow[]; allowEmpty?: boolean };
  try {
    body = (await request.json()) as { rows?: EmployeeAvailabilityRow[]; allowEmpty?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  if (body.rows.length === 0 && body.allowEmpty !== true) {
    return NextResponse.json(
      { error: "No availability rows to save — reload the page and try again before saving." },
      { status: 400 }
    );
  }

  try {
    const { employee, rows } = await saveMyAvailability(ctx, body.rows, { allowEmpty: body.allowEmpty === true });
    return NextResponse.json({ employee, rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
