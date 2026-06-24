import { NextRequest, NextResponse } from "next/server";
import { createSsoToken } from "@/lib/whmcs";

export async function POST(req: NextRequest) {
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
