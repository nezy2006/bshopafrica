import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { config } from "@/lib/config";
import { otpStore } from "@/lib/otp-store";

/* ─── Email template ─────────────────────────────────────────────────────── */
function buildEmailHtml(code: string, firstname: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <img src="https://bshopafrica.com/logo.png" alt="The B.Shop Africa" style="height: 40px; margin-bottom: 24px;" />
      <p style="font-size: 16px; color: #333;">Hi ${firstname || ""},</p>
      <p style="font-size: 14px; color: #555;">Your login verification code for B.Shop Africa is:</p>
      <div style="background: #f3eafa; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #6B21A8; letter-spacing: 8px;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #555;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="font-size: 13px; color: #999;">If you did not request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">The B.Shop Africa · bshopafrica.com · admin@bshopafrica.com</p>
    </div>
  `;
}

function buildEmailText(code: string) {
  return `Your B.Shop Africa login code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\nThe B.Shop Africa Team\nbshopafrica.com`;
}

function buildEmailSubject(code: string) {
  return `${code} is your B.Shop login code`;
}

/* ─── WHMCS SendEmail ────────────────────────────────────────────────────── */
async function sendViaWhmcs(clientId: number, code: string): Promise<boolean> {
  const messageBody = buildEmailText(code);

  const customvars = Buffer.from(
    `subject=${buildEmailSubject(code)}&message=${messageBody}`
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

    const mailOptions = {
      from:    "The B.Shop Africa <admin@bshopafrica.com>",
      to:      email,
      replyTo: "admin@bshopafrica.com",
      subject: buildEmailSubject(code),
      text:    buildEmailText(code),
      html:    buildEmailHtml(code, firstname),
    };

    const info = await transporter.sendMail(mailOptions);
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
    const whmcsOk = await sendViaWhmcs(clientId, code);

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
