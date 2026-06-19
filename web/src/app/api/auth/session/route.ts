import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildAuthSession,
  createSessionToken,
  getAuthSessionFromRequest,
  readSessionTokenFromCookies,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session.server";
import {
  generateSessionId,
  recordLogout,
  recordRoleChange,
  recordSuccessfulLogin,
} from "@/lib/session-audit/server";
import { clientIpFromRequest, parseUserAgent } from "@/lib/session-audit/parse-user-agent";

function sessionErrorResponse(err: unknown, fallback: string) {
  console.error(fallback, err);
  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

async function attachSessionCookie(
  session: NonNullable<Awaited<ReturnType<typeof buildAuthSession>>>,
  userId: string,
  roleId: string,
  sessionId: string
) {
  const token = createSessionToken(userId, roleId, sessionId);
  const jar = await cookies();
  jar.set(sessionCookieOptions(token));
  return NextResponse.json({ session: { ...session, sessionId } });
}

export async function GET() {
  try {
    const token = await readSessionTokenFromCookies();
    const session = await getAuthSessionFromRequest();
    if (!session) {
      return NextResponse.json({ session: null }, { status: 401 });
    }
    return NextResponse.json({ session: { ...session, sessionId: token?.sessionId ?? "" } });
  } catch (err) {
    return sessionErrorResponse(err, "session GET failed");
  }
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

  try {
    const session = await buildAuthSession(userId, roleId);
    if (!session) {
      return NextResponse.json({ error: "Invalid user or role" }, { status: 403 });
    }
    const sessionId = generateSessionId();
    const ipAddress = clientIpFromRequest(request);
    const userAgent = request.headers.get("user-agent") ?? "";
    try {
      await recordSuccessfulLogin({
        sessionId,
        userId,
        userName: session.displayName,
        roleId,
        roleName: session.activeRoleName,
        ipAddress,
        userAgent,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start session";
      if (message.includes("Concurrent sessions")) {
        return NextResponse.json({ error: message }, { status: 403 });
      }
    }
    return await attachSessionCookie(session, userId, roleId, sessionId);
  } catch (err) {
    return sessionErrorResponse(err, "session POST failed");
  }
}

export async function DELETE() {
  try {
    const token = await readSessionTokenFromCookies();
    if (token?.sessionId) {
      await recordLogout(token.sessionId, "logged_out");
    }
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
  } catch (err) {
    return sessionErrorResponse(err, "session DELETE failed");
  }
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

  try {
    const session = await buildAuthSession(current.userId, roleId);
    if (!session) {
      return NextResponse.json({ error: "Invalid role for this user" }, { status: 403 });
    }
    if (current.sessionId) {
      await recordRoleChange(current.sessionId, roleId, session.activeRoleName);
    }
    return await attachSessionCookie(session, current.userId, roleId, current.sessionId || generateSessionId());
  } catch (err) {
    return sessionErrorResponse(err, "session PATCH failed");
  }
}
