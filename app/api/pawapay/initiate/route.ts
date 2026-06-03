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
  };

  const {
    amount,
    phone,
    clientId    = "",
    clientEmail = "",
    cartItems   = [],
    totalUSD    = 0,
    totalRWF    = amount,
  } = body;
  const currency  = body.currency ?? "RWF";
  const depositId = randomUUID();
  const orderId   = randomUUID();

  // Validate phone and get canonical provider via predict-provider
  const intlPhone = toInternational(phone);
  const predicted = await predictProvider(intlPhone);

  if (!predicted) {
    console.error("[pawapay/initiate] predict-provider failed for phone:", intlPhone);
    // Fall back to client-supplied operator rather than blocking the payment
  }

  const finalPhone    = predicted?.phoneNumber ?? intlPhone;
  const finalProvider = predicted?.provider    ?? body.operator ?? "MTN_MOMO_RWA";

  console.log("[pawapay/initiate]", { finalPhone, finalProvider, totalUSD, totalRWF });

  const res = await fetch(`${BASE_URL}/v2/deposits`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${config.pawapayApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[pawapay/initiate] deposit failed:", res.status, text);
    return NextResponse.json({ success: false, error: "PawaPay request failed" }, { status: 502 });
  }

  const data = (await res.json()) as { status?: string };

  cleanupDeposits();
  depositStore.set(depositId, {
    clientId:    String(clientId ?? ""),
    clientEmail: String(clientEmail ?? ""),
    cartItems,
    totalUSD,
    totalRWF,
    createdAt:   Date.now(),
  });

  return NextResponse.json({ success: true, depositId, status: data.status ?? "ACCEPTED" });
}
