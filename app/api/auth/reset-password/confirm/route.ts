import { NextRequest, NextResponse } from "next/server";
import { updateClientPassword } from "@/lib/whmcs";
import { resetTokenStore, cleanupResetTokens } from "@/lib/reset-token-store";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = (await req.json()) as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "Token and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." });
    }

    cleanupResetTokens();
    const record = resetTokenStore.get(token);
    if (!record) {
      return NextResponse.json({ success: false, error: "This reset link is invalid or has expired." });
    }
    if (record.expiry < Date.now()) {
      resetTokenStore.delete(token);
      return NextResponse.json({ success: false, error: "This reset link has expired. Please request a new one." });
    }

    await updateClientPassword(record.clientId, newPassword);
    resetTokenStore.delete(token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password/confirm]", err);
    return NextResponse.json({ success: false, error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
