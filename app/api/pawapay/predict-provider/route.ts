import { NextRequest, NextResponse } from "next/server";

const BASE_URL =
  process.env.PAWAPAY_ENVIRONMENT === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

export async function POST(req: NextRequest) {
  const { phoneNumber } = (await req.json()) as { phoneNumber?: string };
  if (!phoneNumber)
    return NextResponse.json({ success: false, error: "Missing phoneNumber" }, { status: 400 });

  const res = await fetch(`${BASE_URL}/v2/predict-provider`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${process.env.PAWAPAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phoneNumber }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[predict-provider]", res.status, text);
    return NextResponse.json({ success: false, error: "Could not detect operator" });
  }

  const data = (await res.json()) as { country?: string; provider?: string; phoneNumber?: string };
  if (!data.provider)
    return NextResponse.json({ success: false, error: "Operator not supported" });

  return NextResponse.json({ success: true, ...data });
}
