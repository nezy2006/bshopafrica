import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/whmcs";

export async function GET(req: NextRequest) {
  const invoiceId = Number(req.nextUrl.searchParams.get("invoiceId") ?? "0");

  if (!invoiceId) {
    return NextResponse.json({ success: false, error: "Missing invoiceId" }, { status: 400 });
  }

  try {
    const invoice = await getInvoice(invoiceId);
    return NextResponse.json({ success: true, invoice });
  } catch (e) {
    console.error("[checkout/complete]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}
