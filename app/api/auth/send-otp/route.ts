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
  <title>Login verification code</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#6B21A8;padding:36px 40px;text-align:center;">
            <div style="font-size:26px;font-weight:700;color:#ffffff;">The B.Shop Africa</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">bshopafrica.com</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              You requested to log in to your B.Shop Africa account. Use the code below to complete your login:
            </p>
            <!-- OTP code box -->
            <div style="text-align:center;margin:0 0 24px;">
              <div style="display:inline-block;background:#f5f3ff;border:2px solid #c4b5fd;border-radius:12px;padding:18px 40px;">
                <span style="font-size:40px;font-weight:700;letter-spacing:0.2em;color:#6B21A8;">${code}</span>
              </div>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;">
              This code is valid for <strong style="color:#111827;">10 minutes</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
              If you did not request this, you can safely ignore this email. Your account remains secure.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
            <!-- Footer -->
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.6;">
              This email was sent because you requested to log in to your B.Shop Africa account.
            </p>
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.6;">
              The B.Shop Africa &nbsp;|&nbsp;
              <a href="mailto:admin@bshopafrica.com" style="color:#9ca3af;text-decoration:none;">admin@bshopafrica.com</a> &nbsp;|&nbsp;
              <a href="https://bshopafrica.com" style="color:#9ca3af;text-decoration:none;">bshopafrica.com</a>
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;line-height:1.6;">
              To stop receiving these emails, contact
              <a href="mailto:admin@bshopafrica.com" style="color:#d1d5db;">admin@bshopafrica.com</a>
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
    `You requested to log in to your B.Shop Africa account.\n\n` +
    `Your verification code is: ${code}\n\n` +
    `This code is valid for 10 minutes.\n\n` +
    `If you did not request this, you can safely ignore this email.\n\n` +
    `---\n` +
    `This email was sent because you requested to log in to your B.Shop Africa account.\n` +
    `If you did not request this, you can safely ignore this email.\n\n` +
    `The B.Shop Africa | admin@bshopafrica.com | bshopafrica.com\n` +
    `To stop receiving these emails, contact admin@bshopafrica.com`
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
      from:      `"The B.Shop Africa" <${config.smtpUser}>`,
      to:        email,
      subject:   "Your login verification code",
      text:      buildEmailText(code),
      html:      buildEmailHtml(code),
      messageId: `<otp-${Date.now()}@bshopafrica.com>`,
      priority:  "high" as const,
      headers: {
        "X-Mailer":        "The B.Shop Africa Mailer",
        "X-Priority":      "1",
        "Importance":      "High",
        "List-Unsubscribe": "<mailto:admin@bshopafrica.com>",
      },
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
