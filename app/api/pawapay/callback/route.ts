import { NextRequest, NextResponse } from "next/server";
import { depositStore } from "@/lib/pawapay-store";
import { createPawapayOrder, addPaymentToInvoice, acceptOrder, WHMCS_PAWAPAY_GATEWAY } from "@/lib/whmcs";

const TERMINAL_FAILED = new Set(["FAILED", "REJECTED", "TIMED_OUT", "DUPLICATE_IGNORED"]);

/** PawaPay's failureReason is either a plain string or a { failureCode, failureMessage }
 *  object depending on endpoint/version — normalise to just the failure code. */
function extractFailureCode(raw: unknown): string {
  if (typeof raw === "string" && raw) return raw;
  if (raw && typeof raw === "object") {
    const code = (raw as Record<string, unknown>).failureCode;
    if (typeof code === "string" && code) return code;
  }
  return "UNSPECIFIED_FAILURE";
}

export async function POST(req: NextRequest) {
  // PawaPay always expects HTTP 200 — never return an error status
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: true });
  }

  const depositId = typeof body.depositId === "string" ? body.depositId : undefined;
  const status    = typeof body.status    === "string" ? body.status    : undefined;

  console.log("[pawapay/callback]", { depositId, status });

  if (!depositId || !status) return NextResponse.json({ success: true });

  // ── Payment failed — record the reason for status polling, then leave it
  //    for cleanupDeposits() to purge after 24h rather than deleting now ────
  if (TERMINAL_FAILED.has(status)) {
    console.log("[pawapay/callback] payment not completed:", status, depositId);
    const stored = depositStore.get(depositId);
    if (stored) {
      stored.status = status;
      stored.failureReason = extractFailureCode(body.failureReason);
      depositStore.set(depositId, stored);
    }
    return NextResponse.json({ success: true });
  }

  // ── Payment completed — create and provision WHMCS order ─────────────────
  if (status === "COMPLETED") {
    const stored = depositStore.get(depositId);
    if (!stored) {
      console.warn("[pawapay/callback] no record found for depositId:", depositId);
      return NextResponse.json({ success: true });
    }

    // ── Direct invoice payment (renewal) — just mark the existing invoice paid ──
    if (stored.invoiceId) {
      try {
        await addPaymentToInvoice(
          stored.invoiceId,
          stored.totalUSD,
          depositId,
          WHMCS_PAWAPAY_GATEWAY,
        );
        console.log("[pawapay/callback] ✅ invoice paid directly", { invoiceId: stored.invoiceId, depositId });
        depositStore.delete(depositId);
      } catch (e) {
        console.error("[pawapay/callback] ❌ direct invoice payment failed for", depositId, e);
      }
      return NextResponse.json({ success: true });
    }

    const clientId = Number(stored.clientId);
    if (!clientId) {
      console.error("[pawapay/callback] invalid clientId stored for:", depositId);
      depositStore.delete(depositId);
      return NextResponse.json({ success: true });
    }

    try {
      // 1. Create WHMCS order(s) from cart items
      const { orderId, invoiceId, allOrderIds } = await createPawapayOrder(
        clientId,
        stored.cartItems as { type: string; [k: string]: unknown }[],
      );
      console.log("[pawapay/callback] order created", { orderId, invoiceId, allOrderIds });

      // 2. Mark invoice as paid — this records the PawaPay transaction in WHMCS
      await addPaymentToInvoice(
        invoiceId,
        stored.totalUSD,
        depositId,
        process.env.WHMCS_PAWAPAY_GATEWAY ?? "banktransfer",
      );
      console.log("[pawapay/callback] invoice paid", { invoiceId, amount: stored.totalUSD });

      // 3. Accept every order — this triggers WHMCS automation:
      //    • Create cPanel account via WHM API
      //    • Register domain with Enom / OpenSRS
      //    • Send "New Account Information" welcome email
      //    • Send "Order Confirmation" email
      //    • Activate all services
      for (const oid of allOrderIds) {
        if (oid > 0) {
          await acceptOrder(oid);
          console.log("[pawapay/callback] order accepted", oid);
        }
      }

      depositStore.delete(depositId);
      console.log("[pawapay/callback] ✅ provisioning complete for deposit", depositId);
    } catch (e) {
      // Log the error but do NOT delete the record — allows manual retry
      console.error("[pawapay/callback] ❌ provisioning failed for deposit", depositId, e);
    }
  }

  return NextResponse.json({ success: true });
}
