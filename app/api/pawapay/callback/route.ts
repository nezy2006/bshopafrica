import { NextRequest, NextResponse } from "next/server";
import { depositStore } from "@/lib/pawapay-store";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { depositId?: string; status?: string };
  const { depositId, status } = body;

  if (status === "COMPLETED" && depositId) {
    const stored = depositStore.get(depositId);
    if (stored && (stored.invoiceId || stored.orderId)) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      try {
        if (stored.invoiceId) {
          await fetch(`${base}/api/whmcs`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              action: "addPayment",
              params: {
                invoiceId:     stored.invoiceId,
                amount:        +(stored.amount / 1400).toFixed(2),
                transactionId: depositId,
              },
            }),
          });
        }
        if (stored.orderId) {
          await fetch(`${base}/api/whmcs`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action: "adminAcceptOrder", params: { orderId: stored.orderId } }),
          });
        }
      } catch (e) {
        console.error("[pawapay/callback] WHMCS call failed:", e);
      }
      depositStore.delete(depositId);
    }
  }

  return NextResponse.json({ success: true });
}
