import { NextRequest, NextResponse } from "next/server";
import { createPaypalOrder, getAffiliateById } from "@/lib/whmcs";
import { pushAdminNotification } from "@/lib/admin-notifications";

export async function POST(req: NextRequest) {
  try {
    const { clientId, cartItems, promoCode, affid: requestedAffid } = await req.json() as {
      clientId:  number;
      cartItems: { type: string; [k: string]: unknown }[];
      promoCode?: string;
      affid?:    number;
    };

    console.log("[checkout/create-order] request:", { clientId, cartItems, promoCode, affid: requestedAffid });

    if (!clientId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    // The client-side check in checkout/page.tsx (via /api/affiliate/validate)
    // is only a UX nicety — re-verify server-side that the affid doesn't
    // belong to the client placing this order, since affid arrives as a raw
    // number a client could send directly without ever hitting that check.
    // Silently drop it rather than failing the order: self-referral should
    // just mean no commission, not a blocked purchase.
    let affid = requestedAffid || undefined;
    if (affid) {
      const affiliate = await getAffiliateById(affid).catch(() => null);
      if (affiliate && affiliate.clientId === clientId) {
        console.warn("[checkout/create-order] dropped self-referral affid", { clientId, affid });
        affid = undefined;
      }
    }

    const { orderId, invoiceId, allOrderIds } = await createPaypalOrder(clientId, cartItems, promoCode || undefined, affid);
    console.log("[checkout/create-order] WHMCS order created:", { orderId, invoiceId, allOrderIds });

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "Order created but no invoice returned" }, { status: 500 });
    }

    void pushAdminNotification("new_order", `New order #${orderId}`, `Invoice #${invoiceId} — awaiting payment`, "/admin/orders");

    // Payment now happens on-site via the PayPal JS SDK (components/PayPalCheckoutButton) —
    // no WHMCS invoice URL / redirect is generated here anymore.
    return NextResponse.json({ success: true, orderId, invoiceId, allOrderIds });
  } catch (e) {
    console.error("[checkout/create-order]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to create order" },
      { status: 500 },
    );
  }
}
