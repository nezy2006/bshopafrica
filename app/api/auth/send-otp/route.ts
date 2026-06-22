import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { otpStore } from "@/lib/otp-store";

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
    const expiry      = now + 10 * 60 * 1000; // 10 minutes
    const isNewWindow = !existing || now - existing.windowStart >= ONE_HOUR;

    otpStore.set(email, {
      code,
      expiry,
      requestCount: isNewWindow ? 1 : (existing?.requestCount ?? 0) + 1,
      windowStart:  isNewWindow ? now : (existing?.windowStart ?? now),
    });

    // Always log to server console for debugging/monitoring
    console.log(`[OTP] ${email} (clientId=${clientId}) → ${code}`);

    // Send via WHMCS SendEmail — customvars must be base64("key=value&key2=value2")
    const messageBody =
      `Your B.Shop login verification code is: ${code}\n\n` +
      `This code expires in 10 minutes.\n\n` +
      `If you did not request this code, you can safely ignore this email.`;

    const customvars = Buffer.from(
      `subject=Your B.Shop Login Code&message=${messageBody}`
    ).toString("base64");

    const params = new URLSearchParams({
      identifier:   config.whmcsIdentifier,
      secret:       config.whmcsSecret,
      action:       "SendEmail",
      messagename:  "General Message",
      id:           String(clientId),
      customvars,
      responsetype: "json",
    });

    let emailSent = false;
    try {
      const whmcsRes  = await fetch(`${config.whmcsUrl}/includes/api.php`, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    params.toString(),
      });
      const whmcsData = (await whmcsRes.json()) as { result?: string; message?: string };
      emailSent = whmcsData.result === "success";
      if (!emailSent) {
        console.warn("[OTP] WHMCS SendEmail failed:", whmcsData.result, whmcsData.message ?? "");
      }
    } catch (err) {
      console.error("[OTP] WHMCS SendEmail request error:", err);
    }

    // If email delivery failed, return code as fallback so login can still proceed.
    // The frontend shows it in a yellow notice box.
    return NextResponse.json({
      success: true,
      ...(!emailSent && { devCode: code }),
    });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
