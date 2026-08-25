import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { config } from "@/lib/config";

/* Direct SMTP notification to the admin inbox — independent of whether the
   WHMCS ticket creation below succeeds, since OpenSupportTicket doesn't
   reliably reach admin@bshopafrica.com in this WHMCS install. Best-effort:
   a failure here never fails the contact form submission itself. */
async function notifyAdminBySmtp(name: string, email: string, subject: string, message: string): Promise<boolean> {
  if (!config.smtpPass) {
    console.warn("[/api/contact] SMTP_PASS not set — skipping admin notification email");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host:   config.smtpHost,
      port:   config.smtpPort,
      secure: config.smtpPort === 465,
      auth:   { user: config.smtpUser, pass: config.smtpPass },
    });
    await transporter.sendMail({
      from:    "The B.Shop Africa Website <admin@bshopafrica.com>",
      to:      "admin@bshopafrica.com",
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      text:    `New contact form submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html:    `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p><strong>New contact form submission</strong></p>
        <p><strong>Name:</strong> ${name}<br/>
        <strong>Email:</strong> ${email}<br/>
        <strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>`,
    });
    return true;
  } catch (err) {
    console.error("[/api/contact] Admin SMTP notification failed:", err);
    return false;
  }
}

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

  // Guaranteed delivery channel to the admin inbox — sent regardless of
  // whether the WHMCS ticket below succeeds.
  const smtpSent = await notifyAdminBySmtp(name, email, subject, fullMessage);

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
    // If the admin was already emailed above, the message did get through —
    // don't fail the whole submission just because the WHMCS ticket mirror failed.
    if (smtpSent) return NextResponse.json({ success: true, ticketId: "" });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
