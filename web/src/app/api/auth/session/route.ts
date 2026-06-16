import { NextResponse } from "next/server";
import {
  buildAuthSession,
  createSessionToken,
  getAuthSessionFromRequest,
  readSessionTokenFromCookies,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session.server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  let body: { userId?: string; roleId?: string };
  try {
    body = (await request.json()) as { userId?: string; roleId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = body.userId?.trim() ?? "";
  const roleId = body.roleId?.trim() ?? "";
  if (!userId || !roleId) {
    return NextResponse.json({ error: "userId and roleId are required" }, { status: 400 });
  }

  const session = await buildAuthSession(userId, roleId);
  if (!session) {
    return NextResponse.json({ error: "Invalid user or role" }, { status: 403 });
  }

  const token = createSessionToken(userId, roleId);
  const res = NextResponse.json({ session });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/** Switch active role while keeping the same signed-in user. */
export async function PATCH(request: Request) {
  const current = await readSessionTokenFromCookies();
  if (!current) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { roleId?: string };
  try {
    body = (await request.json()) as { roleId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const roleId = body.roleId?.trim() ?? "";
  if (!roleId) {
    return NextResponse.json({ error: "roleId is required" }, { status: 400 });
  }

  const session = await buildAuthSession(current.userId, roleId);
  if (!session) {
    return NextResponse.json({ error: "Invalid role for this user" }, { status: 403 });
  }

  const token = createSessionToken(current.userId, roleId);
  const res = NextResponse.json({ session });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
