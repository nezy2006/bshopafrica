import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { depositStore } from "@/lib/pawapay-store";

const BASE_URL =
  process.env.PAWAPAY_ENVIRONMENT === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    amount: number;
    currency?: string;
    phone: string;
    operator: string;
    orderId?: number;
    invoiceId?: number;
    clientId?: string | null;
  };

  const { amount, phone, operator, orderId = 0, invoiceId = 0 } = body;
  const currency = body.currency ?? "RWF";
  const depositId = randomUUID();

  const res = await fetch(`${BASE_URL}/deposits`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${process.env.PAWAPAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      depositId,
      amount:               String(amount),
      currency,
      correspondent:        operator,
      payer:                { type: "MSISDN", address: { value: phone } },
      customerTimestamp:    new Date().toISOString(),
      statementDescription: "BShop Africa Payment",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[pawapay/initiate]", res.status, text);
    return NextResponse.json({ success: false, error: "PawaPay request failed" }, { status: 502 });
  }

  const data = (await res.json()) as { status?: string };

  depositStore.set(depositId, { invoiceId, orderId, amount });

  return NextResponse.json({ success: true, depositId, status: data.status ?? "ACCEPTED" });
}
