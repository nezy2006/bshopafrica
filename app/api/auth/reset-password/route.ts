import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getClientDetails } from "@/lib/whmcs";
import { config } from "@/lib/config";
import { resetTokenStore, cleanupResetTokens } from "@/lib/reset-token-store";

const TOKEN_TTL = 30 * 60 * 1000; // 30 minutes

/* ─── Email template ─────────────────────────────────────────────────────── */
function buildEmailHtml(resetUrl: string, firstname: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <img src="https://bshopafrica.com/logo.png" alt="The B.Shop Africa" style="height: 40px; margin-bottom: 24px;" />
      <p style="font-size: 16px; color: #333;">Hi ${firstname || "there"},</p>
      <p style="font-size: 14px; color: #555;">We received a request to reset your B.Shop Africa password. Click the button below to choose a new one:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #6B21A8; color: #fff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 10px; font-size: 15px;">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #999;">This link expires in <strong>30 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">The B.Shop Africa · bshopafrica.com · admin@bshopafrica.com</p>
    </div>
  `;
}

function buildEmailText(resetUrl: string) {
  return `Reset your B.Shop Africa password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\nThe B.Shop Africa Team\nbshopafrica.com`;
}

/* ─── WHMCS SendEmail ────────────────────────────────────────────────────── */
async function sendViaWhmcs(clientId: number, resetUrl: string): Promise<boolean> {
  const messageBody = buildEmailText(resetUrl);
  const customvars = Buffer.from(
    `subject=Reset your B.Shop Africa password&message=${messageBody}`
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
    console.log("[reset-password] WHMCS SendEmail response:", JSON.stringify(data));
    return data.result === "success";
  } catch (err) {
    console.error("[reset-password] WHMCS SendEmail error:", err);
    return false;
  }
}

/* ─── Nodemailer SMTP ────────────────────────────────────────────────────── */
async function sendViaSmtp(email: string, resetUrl: string, firstname: string): Promise<boolean> {
  if (!config.smtpPass) {
    console.warn("[reset-password] SMTP_PASS not set — skipping nodemailer");
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
      from:    "The B.Shop Africa <admin@bshopafrica.com>",
      to:      email,
      replyTo: "admin@bshopafrica.com",
      subject: "Reset your B.Shop Africa password",
      text:    buildEmailText(resetUrl),
      html:    buildEmailHtml(resetUrl, firstname),
    });
    console.log("[reset-password] SMTP sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("[reset-password] SMTP error:", err);
    return false;
  }
}

/* ─── Route handler ──────────────────────────────────────────────────────── */
// Intentionally does NOT call WHMCS's native ResetPassword API — that emails
// WHMCS's own template with a link to /billing/index.php?rp=/password/reset/...
// which takes clients off-site. Instead we mint our own token, store it
// server-side, and email a link to our own /reset-password page.
export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }
    const clean = email.trim().toLowerCase();

    let client;
    try {
      client = await getClientDetails(0, clean);
    } catch {
      client = null;
    }
    if (!client || !client.id) {
      return NextResponse.json({ success: false, error: "No account found with that email address." });
    }

    cleanupResetTokens();
    const token = crypto.randomBytes(32).toString("hex");
    resetTokenStore.set(token, {
      clientId: client.id,
      email:    client.email || clean,
      expiry:   Date.now() + TOKEN_TTL,
    });

    const resetUrl = `${config.appUrl}/reset-password?token=${token}`;

    const whmcsOk   = await sendViaWhmcs(client.id, resetUrl);
    let emailSent = whmcsOk;
    if (!whmcsOk) {
      emailSent = await sendViaSmtp(client.email || clean, resetUrl, client.firstname);
    }
    if (!emailSent) {
      console.warn(`[reset-password] All delivery methods failed for ${clean}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
