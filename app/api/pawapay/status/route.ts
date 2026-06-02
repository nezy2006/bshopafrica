import { NextRequest, NextResponse } from "next/server";

const BASE_URL =
  process.env.PAWAPAY_ENVIRONMENT === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

export async function GET(req: NextRequest) {
  const depositId = req.nextUrl.searchParams.get("depositId");
  if (!depositId)
    return NextResponse.json({ success: false, error: "Missing depositId" }, { status: 400 });

  const res = await fetch(`${BASE_URL}/v2/deposits/${depositId}`, {
    headers: { Authorization: `Bearer ${process.env.PAWAPAY_API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok)
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 502 });

  const data = (await res.json()) as unknown;
  const deposit = Array.isArray(data)
    ? (data as Record<string, unknown>[])[0]
    : (data as Record<string, unknown>);

  return NextResponse.json({
    success: true,
    status:  String(deposit?.status ?? "PENDING"),
    deposit,
  });
}
