import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { config } from "@/lib/config";
import { otpStore } from "@/lib/otp-store";

/* ─── Email template ─────────────────────────────────────────────────────── */
function buildEmailHtml(code: string, firstname: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:15px;line-height:1.6;">
  <p>Hi ${firstname},</p>
  <p>Here is your login code for bshopafrica.com:</p>
  <p style="font-size:26px;font-weight:bold;letter-spacing:4px;">${code}</p>
  <p>This code expires in 10 minutes.</p>
  <p>If you didn't request this, please ignore this email.</p>
  <p>The B.Shop Africa Team</p>
</body>
</html>`;
}

function buildEmailText(code: string, firstname: string) {
  return (
    `Hi ${firstname},\n\n` +
    `Here is your login code for bshopafrica.com:\n\n` +
    `${code}\n\n` +
    `This code expires in 10 minutes.\n\n` +
    `If you didn't request this, please ignore this email.\n\n` +
    `The B.Shop Africa Team`
  );
}

/* ─── WHMCS SendEmail ────────────────────────────────────────────────────── */
async function sendViaWhmcs(clientId: number, code: string, firstname: string): Promise<boolean> {
  const messageBody = buildEmailText(code, firstname);

  const customvars = Buffer.from(
    `subject=Login code for bshopafrica.com&message=${messageBody}`
  ).toString("base64");

  const params = new URLSearchParams({
    identifier:   config.whmcsIdentifier,
    secret:       config.whmcsSecret,
    action:       "SendEmail",
    messagename:  "General Message",
    type:         "client",
    id:           String(clientId),
    customvars,
    responsetype: "json",
  });

  try {
    const res  = await fetch(`${config.whmcsUrl}/includes/api.php`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });
    const data = (await res.json()) as Record<string, unknown>;
    console.log("[OTP] WHMCS response:", JSON.stringify(data));
    return data.result === "success";
  } catch (err) {
    console.error("[OTP] WHMCS fetch error:", err);
    return false;
  }
}

/* ─── Nodemailer SMTP ────────────────────────────────────────────────────── */
async function sendViaSmtp(email: string, code: string, firstname: string): Promise<boolean> {
  if (!config.smtpPass) {
    console.warn("[OTP] SMTP_PASS not set — skipping nodemailer");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host:   config.smtpHost,
      port:   config.smtpPort,
      secure: config.smtpPort === 465,
      auth:   { user: config.smtpUser, pass: config.smtpPass },
    });

    const info = await transporter.sendMail({
      from:      "The B.Shop Africa <admin@bshopafrica.com>",
      to:        email,
      replyTo:   "admin@bshopafrica.com",
      subject:   "Login code for bshopafrica.com",
      text:      buildEmailText(code, firstname),
      html:      buildEmailHtml(code, firstname),
      messageId: `<otp-${Date.now()}@bshopafrica.com>`,
    });
    console.log("[OTP] SMTP sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("[OTP] SMTP error:", err);
    return false;
  }
}

/* ─── Route handler ──────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { email, clientId, firstname } = (await req.json()) as { email?: string; clientId?: number; firstname?: string };
    if (!email || !clientId) {
      return NextResponse.json({ success: false, error: "Missing email or clientId" }, { status: 400 });
    }
    const name = firstname?.trim() || "there";

    const now      = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const existing = otpStore.get(email);

    // Max 3 OTP requests per email per hour
    if (existing && now - existing.windowStart < ONE_HOUR && existing.requestCount >= 3) {
      return NextResponse.json({ success: false, error: "Too many OTP requests. Try again in an hour." });
    }

    const code        = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry      = now + 10 * 60 * 1000;
    const isNewWindow = !existing || now - existing.windowStart >= ONE_HOUR;

    otpStore.set(email, {
      code,
      expiry,
      requestCount: isNewWindow ? 1 : (existing?.requestCount ?? 0) + 1,
      windowStart:  isNewWindow ? now : (existing?.windowStart ?? now),
    });

    console.log(`[OTP] Generated for ${email} (clientId=${clientId}): ${code}`);
    console.log(`[OTP] Will send TO: ${email} FROM: ${config.smtpUser}`);

    // Method 1 — WHMCS SendEmail
    console.log("[OTP] Trying WHMCS SendEmail...");
    const whmcsOk = await sendViaWhmcs(clientId, code, name);

    let emailSent = whmcsOk;

    // Method 2 — nodemailer SMTP fallback
    if (!whmcsOk) {
      console.log("[OTP] WHMCS failed — trying SMTP fallback...");
      emailSent = await sendViaSmtp(email, code, name);
    }

    if (!emailSent) {
      console.warn(`[OTP] All delivery methods failed. Code for ${email}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      ...(!emailSent && { devCode: code }),
    });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
