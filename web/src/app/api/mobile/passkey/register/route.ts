import { NextResponse } from "next/server";
import {
  assertPasskeyAvailable,
  attachPasskeyChallenge,
  clearPasskeyChallengeCookie,
  createPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "@/lib/auth/passkey.server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export async function POST(request: Request) {
  try {
    await assertPasskeyAvailable(request);
    const options = await createPasskeyRegistrationOptions(request);
    const response = NextResponse.json(options);
    attachPasskeyChallenge(response, { challenge: options.challenge, kind: "registration" });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start Face ID setup";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  let body: { response?: RegistrationResponseJSON; label?: string };
  try {
    body = (await request.json()) as { response?: RegistrationResponseJSON; label?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.response) {
    return NextResponse.json({ error: "Missing passkey response" }, { status: 400 });
  }

  try {
    await assertPasskeyAvailable(request);
    const result = await verifyPasskeyRegistration(request, body.response, body.label);
    const response = NextResponse.json(result);
    clearPasskeyChallengeCookie(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Face ID setup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
