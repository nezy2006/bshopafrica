import { NextRequest, NextResponse } from "next/server";
import { createPaypalOrderForInvoice } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, amount } = (await req.json()) as { invoiceId: number; amount: number };

    if (!invoiceId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Missing invoiceId or amount" }, { status: 400 });
    }

    const orderID = await createPaypalOrderForInvoice(invoiceId, amount);
    console.log("[paypal-create] order created:", { invoiceId, amount, orderID });

    return NextResponse.json({ success: true, orderID });
  } catch (e) {
    console.error("[paypal-create]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to start PayPal checkout" },
      { status: 500 },
    );
  }
}
