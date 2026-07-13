import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { depositStore, cleanupDeposits } from "@/lib/pawapay-store";
import { config } from "@/lib/config";

const BASE_URL =
  config.pawapayEnvironment === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

/** Normalise phone to international format (e.g. 0785094435 → 250785094435). */
function toInternational(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("250")) return d;
  if (d.startsWith("0"))   return "250" + d.slice(1);
  return "250" + d;
}

/** Call PawaPay predict-provider to validate phone and get canonical provider + phoneNumber. */
async function predictProvider(
  phoneNumber: string,
): Promise<{ provider: string; phoneNumber: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/v2/predict-provider`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${config.pawapayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { provider?: string; phoneNumber?: string };
    if (!d.provider) return null;
    return { provider: d.provider, phoneNumber: d.phoneNumber ?? phoneNumber };
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  // Not gated behind a session — this endpoint only ever starts a PawaPay
  // deposit against a phone number/amount the caller supplies, it never reads
  // another client's data, so a missing x-session-token cannot be "blocking"
  // it. Logged here only to help correlate with server-session debugging.
  console.log("[pawapay/initiate] x-session-token present:", !!req.headers.get("x-session-token"));

  const body = (await req.json()) as {
    amount:       number;
    currency?:    string;
    phone:        string;
    operator?:    string;   // client hint — overridden by predict-provider
    clientId?:    string | null;
    clientEmail?: string | null;
    cartItems?:   unknown[];
    totalUSD?:    number;
    totalRWF?:    number;
    invoiceId?:   number;
  };

  console.log("[pawapay/initiate] request body:", JSON.stringify(body));

  const {
    amount,
    phone,
    clientId    = "",
    clientEmail = "",
    cartItems   = [],
    totalUSD    = 0,
    totalRWF    = amount,
    invoiceId,
  } = body;
  const currency  = body.currency ?? "RWF";
  const depositId = randomUUID();
  const orderId   = randomUUID();

  // Validate phone and get canonical provider via predict-provider
  const intlPhone = toInternational(phone);
  const predicted = await predictProvider(intlPhone);

  if (!predicted) {
    console.error("[pawapay/initiate] predict-provider failed for phone:", intlPhone);
    // Fall back to client-supplied operator (already validated client-side by the
    // same predict-provider call) rather than blocking the payment outright.
  }

  const finalPhone    = predicted?.phoneNumber ?? intlPhone;
  const finalProvider = predicted?.provider    ?? body.operator;

  // Never guess a provider. A wrong network (e.g. an Airtel number routed as
  // MTN_MOMO_RWA) gets synchronously REJECTED by PawaPay — no USSD is ever sent,
  // but the old fallback of defaulting to "MTN_MOMO_RWA" masked that as if it
  // had worked, so the UI showed a live 120s countdown for a dead request.
  if (!finalProvider) {
    return NextResponse.json({
      success: false,
      error:   "Could not detect a mobile money provider for this number. Please double-check it and try again.",
    }, { status: 400 });
  }

  console.log("[pawapay/initiate]", { finalPhone, finalProvider, totalUSD, totalRWF });

  const pawapayRequest = {
    depositId,
    payer: {
      type: "MMO",
      accountDetails: {
        phoneNumber: finalPhone,
        provider:    finalProvider,
      },
    },
    amount:            String(amount),
    currency,
    clientReferenceId: orderId,
    customerMessage:   "BShop Africa Payment",
    metadata: [
      { orderId },
      { clientId: String(clientId ?? "") },
    ],
  };
  console.log("[pawapay/initiate] sending to PawaPay:", JSON.stringify(pawapayRequest));

  const res = await fetch(`${BASE_URL}/v2/deposits`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${config.pawapayApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pawapayRequest),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[pawapay/initiate] deposit failed:", res.status, text);
    return NextResponse.json({ success: false, error: "PawaPay request failed" }, { status: 502 });
  }

  const data = (await res.json()) as {
    status?:        string;
    failureReason?: { failureCode?: string; failureMessage?: string };
  };
  console.log("[pawapay/initiate] PawaPay response:", JSON.stringify(data));

  // PawaPay can accept the HTTP request (200 OK) but still reject the deposit
  // itself (e.g. failureCode "INVALID_PHONE_NUMBER") — no USSD prompt will ever
  // be sent for it. Report that as a failure now instead of letting the UI show
  // a 120s countdown for a deposit that's already dead.
  if (data.status && data.status !== "ACCEPTED") {
    console.error("[pawapay/initiate] deposit rejected:", data.status, data.failureReason);
    return NextResponse.json({
      success: false,
      error:   data.failureReason?.failureMessage ?? "This mobile money provider declined the request. Please check the number and try again.",
    }, { status: 400 });
  }

  cleanupDeposits();
  depositStore.set(depositId, {
    clientId:    String(clientId ?? ""),
    clientEmail: String(clientEmail ?? ""),
    cartItems,
    totalUSD,
    totalRWF,
    ...(invoiceId ? { invoiceId } : {}),
    createdAt:   Date.now(),
  });

  return NextResponse.json({ success: true, depositId, status: data.status ?? "ACCEPTED" });
}
