import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { otpStore } from "@/lib/otp-store";

function phpSerialize(data: Record<string, string>): string {
  const entries = Object.entries(data);
  const inner = entries
    .map(([k, v]) => `s:${k.length}:"${k}";s:${Buffer.byteLength(v, "utf8")}:"${v}";`)
    .join("");
  return `a:${entries.length}:{${inner}}`;
}

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

    const message    = `Your B.Shop login code is: ${code}. Valid for 10 minutes. If you did not request this, ignore this email.`;
    const customvars = Buffer.from(phpSerialize({ subject: "Your B.Shop Login Code", message })).toString("base64");

    const params = new URLSearchParams({
      identifier:   config.whmcsIdentifier,
      secret:       config.whmcsSecret,
      action:       "SendEmail",
      messagename:  "General Message",
      id:           String(clientId),
      customvars,
      responsetype: "json",
    });

    await fetch(`${config.whmcsUrl}/includes/api.php`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    }).catch(err => console.error("[send-otp] WHMCS email error:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
