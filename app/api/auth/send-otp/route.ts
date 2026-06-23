import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { config } from "@/lib/config";
import { otpStore } from "@/lib/otp-store";

/* ─── Email template ─────────────────────────────────────────────────────── */
function buildEmailHtml(code: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your B.Shop Login Code</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3b0764,#6B21A8);padding:36px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">The B.Shop</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">bshopafrica.com</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              Your login verification code for <strong style="color:#111827;">The B.Shop</strong> is:
            </p>
            <!-- OTP code box -->
            <div style="text-align:center;margin:0 0 28px;">
              <div style="display:inline-block;background:#f5f3ff;border:2px solid #c4b5fd;border-radius:12px;padding:18px 40px;">
                <span style="font-size:42px;font-weight:900;letter-spacing:0.25em;color:#6B21A8;">${code}</span>
              </div>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;">
              This code expires in <strong style="color:#111827;">10 minutes</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
              If you did not request this code, you can safely ignore this email. Your account remains secure.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
            <p style="margin:0;font-size:13px;color:#9ca3af;">
              The B.Shop Africa Team<br />
              <a href="https://bshopafrica.com" style="color:#6B21A8;text-decoration:none;">https://bshopafrica.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailText(code: string) {
  return (
    `Hi,\n\n` +
    `Your login verification code for The B.Shop is:\n\n` +
    `  ${code}\n\n` +
    `This code expires in 10 minutes.\n\n` +
    `If you did not request this code, you can safely ignore this email.\n\n` +
    `The B.Shop Africa Team\n` +
    `https://bshopafrica.com`
  );
}

/* ─── WHMCS SendEmail ────────────────────────────────────────────────────── */
async function sendViaWhmcs(clientId: number, code: string): Promise<boolean> {
  const messageBody =
    `Your B.Shop login verification code is: ${code}. Valid for 10 minutes.`;

  const customvars = Buffer.from(
    `subject=Your B.Shop Login Code&message=${messageBody}`
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
async function sendViaSmtp(email: string, code: string): Promise<boolean> {
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
      from:    `"The B.Shop" <${config.smtpUser}>`,
      to:      email,
      subject: "Your B.Shop Login Code",
      text:    buildEmailText(code),
      html:    buildEmailHtml(code),
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
    const { email, clientId } = (await req.json()) as { email?: string; clientId?: number };
    if (!email || !clientId) {
      return NextResponse.json({ success: false, error: "Missing email or clientId" }, { status: 400 });
    }

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
      emailSent = await sendViaSmtp(email, code);
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
