import { NextResponse } from "next/server";
import {
  assertPasskeyAvailable,
  attachPasskeyChallenge,
  clearPasskeyChallengeCookie,
  createPasskeyLoginOptions,
  verifyPasskeyLogin,
} from "@/lib/auth/passkey.server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

export async function POST(request: Request) {
  try {
    await assertPasskeyAvailable(request);
    const options = await createPasskeyLoginOptions(request);
    const response = NextResponse.json(options);
    attachPasskeyChallenge(response, { challenge: options.challenge, kind: "authentication" });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start Face ID sign-in";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  let body: { response?: AuthenticationResponseJSON };
  try {
    body = (await request.json()) as { response?: AuthenticationResponseJSON };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.response) {
    return NextResponse.json({ error: "Missing passkey response" }, { status: 400 });
  }

  try {
    await assertPasskeyAvailable(request);
    const result = await verifyPasskeyLogin(request, body.response);
    const response = NextResponse.json(result);
    clearPasskeyChallengeCookie(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Face ID sign-in failed";
    const status = message.includes("Concurrent sessions") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
