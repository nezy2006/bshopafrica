import { NextRequest, NextResponse } from "next/server";
import { createPaypalOrder } from "@/lib/whmcs";
import { pushAdminNotification } from "@/lib/admin-notifications";

export async function POST(req: NextRequest) {
  try {
    const { clientId, cartItems } = await req.json() as {
      clientId:  number;
      cartItems: { type: string; [k: string]: unknown }[];
    };

    console.log("[checkout/create-order] request:", { clientId, cartItems });

    if (!clientId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { orderId, invoiceId, allOrderIds } = await createPaypalOrder(clientId, cartItems);
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
