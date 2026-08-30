import { NextRequest, NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/paypal";
import { addPaymentToInvoice, acceptOrder, WHMCS_PAYPAL_GATEWAY } from "@/lib/whmcs";
import { pushAdminNotification } from "@/lib/admin-notifications";

export async function POST(req: NextRequest) {
  try {
    const { orderID, invoiceId, orderIds, invoiceAmount, discountAmount, promoCode } = (await req.json()) as {
      orderID:   string;
      invoiceId: number;
      orderIds?: number[]; // secondary WHMCS orders (website builder / transfer) from create-order, new-order checkout only
      invoiceAmount?:  number; // full invoice amount before discount (renewals) — see lib/pawapay-store.ts
      discountAmount?: number;
      promoCode?:      string;
    };

    if (!orderID || !invoiceId) {
      return NextResponse.json({ success: false, error: "Missing orderID or invoiceId" }, { status: 400 });
    }

    const capture = await capturePaypalOrder(orderID);

    // The order was created with reference_id = invoiceId (lib/paypal.ts createPaypalOrderForInvoice).
    // A mismatch means this captured order is being replayed against a different invoice than it paid for.
    if (capture.referenceId && capture.referenceId !== String(invoiceId)) {
      console.error("[paypal-capture] reference_id mismatch:", { expected: invoiceId, got: capture.referenceId });
      return NextResponse.json({ success: false, error: "Payment does not match this invoice" }, { status: 400 });
    }

    // Money has already moved at this point — always report success to the user from here on,
    // even if the WHMCS-side bookkeeping below has a partial failure. Log for manual follow-up.
    //
    // Affiliate commission: nothing to do here explicitly. The order behind this
    // invoice was created with `affid` already attached (see createOrderWithGateway
    // in lib/whmcs.ts, called from /api/checkout/create-order) — WHMCS's affiliate
    // module only actually credits that commission once the invoice is marked
    // Paid, which is exactly what addPaymentToInvoice below does. So a signup
    // alone, or an order that never gets captured, never earns a commission;
    // only a real, captured payment does.
    try {
      // If a promo discount was applied, the client only paid the discounted amount via
      // PayPal but the WHMCS invoice is for the full price. Recording only the discounted
      // amount leaves the invoice partially paid, so WHMCS never marks it Paid and the
      // service never renews. Record the full invoice amount instead — the discount is
      // absorbed as a promotional cost, not passed through to WHMCS.
      const paymentAmount =
        discountAmount && discountAmount > 0 && invoiceAmount
          ? invoiceAmount
          : parseFloat(capture.amount);
      await addPaymentToInvoice(invoiceId, paymentAmount, capture.captureId, WHMCS_PAYPAL_GATEWAY);
      console.log("[paypal-capture] invoice marked paid:", { invoiceId, amount: paymentAmount, actualPaid: capture.amount, captureId: capture.captureId, promoCode });
      void pushAdminNotification("payment_received", `PayPal payment received — $${capture.amount}`, `Invoice #${invoiceId}`, "/admin/billing/transactions");
    } catch (e) {
      console.error("[paypal-capture] addPaymentToInvoice failed for captured payment", { invoiceId, captureId: capture.captureId }, e);
    }

    if (Array.isArray(orderIds)) {
      for (const oid of orderIds) {
        if (oid > 0) {
          try {
            await acceptOrder(oid);
            console.log("[paypal-capture] order accepted:", oid);
          } catch (e) {
            console.error("[paypal-capture] acceptOrder failed for", oid, e);
          }
        }
      }
    }

    return NextResponse.json({ success: true, captureId: capture.captureId });
  } catch (e) {
    console.error("[paypal-capture]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Payment capture failed" },
      { status: 500 },
    );
  }
}
