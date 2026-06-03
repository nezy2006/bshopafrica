import { NextRequest, NextResponse } from "next/server";
import { createPaypalOrder } from "@/lib/whmcs";

const WHMCS_URL = process.env.WHMCS_URL ?? "https://bshopafrica.com/billing";

export async function POST(req: NextRequest) {
  try {
    const { clientId, cartItems } = await req.json() as {
      clientId:  number;
      cartItems: { type: string; [k: string]: unknown }[];
    };

    if (!clientId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { orderId, invoiceId } = await createPaypalOrder(clientId, cartItems);

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "Order created but no invoice returned" }, { status: 500 });
    }

    const paymentUrl = `${WHMCS_URL}/viewinvoice.php?id=${invoiceId}&paynow=1`;

    return NextResponse.json({ success: true, orderId, invoiceId, paymentUrl });
  } catch (e) {
    console.error("[checkout/create-order]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to create order" },
      { status: 500 },
    );
  }
}
