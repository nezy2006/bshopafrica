import { NextRequest, NextResponse } from "next/server";
import { checkEmailExists, resetClientPassword } from "@/lib/whmcs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string };
    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }
    const clean = email.trim().toLowerCase();

    const exists = await checkEmailExists(clean);
    if (!exists) {
      return NextResponse.json({ success: false, error: "No account found with that email address." });
    }

    await resetClientPassword(clean);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
