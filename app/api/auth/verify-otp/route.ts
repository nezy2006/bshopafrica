import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = (await req.json()) as { email?: string; otp?: string };
    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Missing email or OTP" }, { status: 400 });
    }

    const entry = otpStore.get(email);
    if (!entry) {
      return NextResponse.json({ success: false, error: "No OTP requested for this email" });
    }

    if (Date.now() > entry.expiry) {
      otpStore.delete(email);
      return NextResponse.json({ success: false, error: "Code expired, request a new one" });
    }

    if (entry.code !== otp) {
      return NextResponse.json({ success: false, error: "Invalid code" });
    }

    otpStore.delete(email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
