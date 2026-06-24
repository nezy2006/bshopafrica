import { NextRequest, NextResponse } from "next/server";
import { createSsoToken } from "@/lib/whmcs";
import { config } from "@/lib/config";

export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== config.adminPassword) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { clientId } = (await req.json()) as { clientId?: number };
    if (!clientId) {
      return NextResponse.json({ success: false, error: "Missing clientId" }, { status: 400 });
    }

    const { redirectUrl } = await createSsoToken(Number(clientId), "clientarea");
    return NextResponse.json({ success: true, redirectUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create SSO token";
    console.error("[auth/sso]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
