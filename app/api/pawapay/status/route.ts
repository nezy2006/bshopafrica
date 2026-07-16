import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

const BASE_URL =
  config.pawapayEnvironment === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

/** PawaPay's failureReason is either a plain string or a { failureCode, failureMessage }
 *  object depending on endpoint/version — normalise to just the failure code. */
function extractFailureCode(raw: unknown): string | null {
  if (typeof raw === "string" && raw) return raw;
  if (raw && typeof raw === "object") {
    const code = (raw as Record<string, unknown>).failureCode;
    if (typeof code === "string" && code) return code;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const depositId = req.nextUrl.searchParams.get("depositId");
  if (!depositId)
    return NextResponse.json({ success: false, error: "Missing depositId" }, { status: 400 });

  const res = await fetch(`${BASE_URL}/v2/deposits/${depositId}`, {
    headers: { Authorization: `Bearer ${config.pawapayApiKey}` },
    cache: "no-store",
  });

  if (!res.ok)
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 502 });

  const data = (await res.json()) as unknown;
  const deposit = Array.isArray(data)
    ? (data as Record<string, unknown>[])[0]
    : (data as Record<string, unknown>);

  const status = String(deposit?.status ?? "PENDING");

  return NextResponse.json({
    success: true,
    status,
    failureReason: extractFailureCode(deposit?.failureReason),
    deposit,
  });
}
