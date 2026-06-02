import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { depositStore, cleanupDeposits } from "@/lib/pawapay-store";

const BASE_URL =
  process.env.PAWAPAY_ENVIRONMENT === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.cloud";

/** Convert local Rwanda number to international format (250XXXXXXXXX). */
function toInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return digits;      // already international
  if (digits.startsWith("0"))   return "250" + digits.slice(1); // 07X → 2507X
  return "250" + digits;
}

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
  const currency      = body.currency ?? "RWF";
  const depositId     = randomUUID();
  const orderId       = randomUUID();
  const phoneIntl     = toInternational(phone);

  const res = await fetch(`${BASE_URL}/v2/deposits`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${process.env.PAWAPAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      depositId,
      payer: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phoneIntl,
          provider:    operator,
        },
      },
      amount:            String(amount),
      currency,
      clientReferenceId: orderId,
      customerMessage:   "BShop Africa Payment",
      metadata: [
        { orderId  },
        { clientId: String(clientId ?? "") },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[pawapay/initiate]", res.status, text);
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

  console.log("[pawapay/initiate] deposit created", { depositId, phoneIntl, operator, totalUSD, totalRWF });

  return NextResponse.json({ success: true, depositId, status: data.status ?? "ACCEPTED" });
}
