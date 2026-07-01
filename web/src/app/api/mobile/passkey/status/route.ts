import { NextResponse } from "next/server";
import { getPasskeyStatus } from "@/lib/auth/passkey.server";
import { readSessionTokenFromCookies } from "@/lib/auth/session.server";

export async function GET() {
  try {
    const token = await readSessionTokenFromCookies();
    const status = await getPasskeyStatus(token?.userId);
    return NextResponse.json(status);
  } catch (err) {
    console.error("passkey status failed", err);
    return NextResponse.json({ supported: false, enrolled: false, count: 0 });
  }
}
