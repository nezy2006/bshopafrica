import { NextRequest, NextResponse } from "next/server";

async function callWhmcs(action: string, params: Record<string, string | number>) {
  const url        = process.env.WHMCS_URL        ?? "";
  const identifier = process.env.WHMCS_IDENTIFIER ?? "";
  const secret     = process.env.WHMCS_SECRET     ?? "";
  const body = new URLSearchParams({
    identifier, secret, action, responsetype: "json",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const res  = await fetch(`${url}/includes/api.php`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
    cache:   "no-store",
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export async function POST(req: NextRequest) {
  let name = "", email = "", phone = "", subject = "", message = "";
  try {
    const body = (await req.json()) as Record<string, string>;
    name    = (body.name    ?? "").trim();
    email   = (body.email   ?? "").trim();
    phone   = (body.phone   ?? "").trim();
    subject = (body.subject ?? "General Inquiry").trim();
    message = (body.message ?? "").trim();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ success: false, error: "Name, email, and message are required" }, { status: 400 });
  }

  const fullMessage = phone ? `Phone: ${phone}\n\n${message}` : message;

  try {
    const data = await callWhmcs("OpenSupportTicket", {
      name,
      email,
      subject,
      message: fullMessage,
      deptid:   1,
      priority: "Medium",
    });

    if (data.result === "error") {
      throw new Error(typeof data.message === "string" ? data.message : "WHMCS error");
    }

    return NextResponse.json({
      success:  true,
      ticketId: String(data.tid ?? data.id ?? ""),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create ticket";
    console.error("[/api/contact]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
