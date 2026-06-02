import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { depositStore, cleanupDeposits } from "@/lib/pawapay-store";

const BASE_URL =
  process.env.PAWAPAY_ENVIRONMENT === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    amount:       number;
    currency?:    string;
    phone:        string;
    operator:     string;
    clientId?:    string | null;
    clientEmail?: string | null;
    cartItems?:   unknown[];
    totalUSD?:    number;
    totalRWF?:    number;
  };

  const {
    amount, phone, operator,
    clientId    = "",
    clientEmail = "",
    cartItems   = [],
    totalUSD    = 0,
    totalRWF    = amount,
  } = body;
  const currency  = body.currency ?? "RWF";
  const depositId = randomUUID();

  // Send deposit request to PawaPay
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

  // Persist full order context for the callback handler
  cleanupDeposits();
  depositStore.set(depositId, {
    clientId:    String(clientId ?? ""),
    clientEmail: String(clientEmail ?? ""),
    cartItems,
    totalUSD,
    totalRWF,
    createdAt:   Date.now(),
  });

  console.log("[pawapay/initiate] deposit created", { depositId, clientId, totalUSD, totalRWF, items: cartItems.length });

  return NextResponse.json({ success: true, depositId, status: data.status ?? "ACCEPTED" });
}
