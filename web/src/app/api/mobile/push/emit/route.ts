import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { handlePushEmit, type PushEmitKind } from "@/lib/mobile/push-events.server";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: {
    kind?: PushEmitKind;
    shiftId?: string;
    before?: RosterShiftRecord;
    after?: RosterShiftRecord;
    taskId?: string;
    notePreview?: string;
    employeeUserId?: string;
    dedupeKey?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.kind) {
    return NextResponse.json({ error: "kind is required" }, { status: 400 });
  }

  try {
    const result = await handlePushEmit(session, { ...body, kind: body.kind });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Push emit failed";
    const status = message.includes("Not allowed") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
