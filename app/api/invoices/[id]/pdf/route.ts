import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getInvoice, type InvoiceDetails } from "@/lib/whmcs";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!invoiceId) return NextResponse.json({ success: false, error: "Invalid invoice id" }, { status: 400 });

  try {
    const invoice = await getInvoice(invoiceId);
    const pdf = await renderInvoicePdf(invoice);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate invoice PDF";
    console.error("[api/invoices/pdf]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function renderInvoicePdf(invoice: InvoiceDetails): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const purple = rgb(0.42, 0.13, 0.66);
  const dark   = rgb(0.07, 0.07, 0.07);
  const gray   = rgb(0.4, 0.4, 0.4);
  const line   = rgb(0.87, 0.87, 0.87);

  const left  = 50;
  const right = 545;
  let y = 792;

  const draw = (text: string, x: number, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {}) => {
    const size = opts.size ?? 10;
    const f    = opts.bold ? fontBold : font;
    const color = opts.color ?? dark;
    const width = opts.align === "right" ? f.widthOfTextAtSize(text, size) : 0;
    page.drawText(text, { x: opts.align === "right" ? x - width : x, y, size, font: f, color });
  };

  draw("The B.Shop", left, { size: 20, bold: true, color: purple }); y -= 16;
  draw("bshopafrica.com", left, { size: 10, color: gray }); y -= 30;

  draw(`Invoice #${invoice.id}`, left, { size: 16, bold: true }); y -= 22;
  draw(`Status: ${invoice.status}`, left, { color: gray }); y -= 14;
  draw(`Date: ${invoice.date}`, left, { color: gray }); y -= 14;
  draw(`Due Date: ${invoice.duedate}`, left, { color: gray }); y -= 28;

  draw("Description", left, { bold: true });
  draw("Amount", right, { bold: true, align: "right" });
  y -= 8;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: line }); y -= 18;

  for (const item of invoice.items) {
    draw(item.description, left, { color: gray });
    draw(`$${item.amount}`, right, { color: gray, align: "right" });
    y -= 18;
  }

  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: line }); y -= 20;

  draw(`Subtotal: $${invoice.subtotal}`, right, { bold: true, align: "right" }); y -= 16;
  draw(`Total: $${invoice.total}`, right, { bold: true, align: "right" });

  return doc.save();
}
