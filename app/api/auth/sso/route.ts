import { NextRequest, NextResponse } from "next/server";
import { getClientDetails, generateImpersonateToken, verifyImpersonateToken } from "@/lib/whmcs";
import { config } from "@/lib/config";

/* ─── GET — admin mints a short-lived impersonation token ───────────────── */
export async function GET(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== config.adminPassword) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const clientId = Number(req.nextUrl.searchParams.get("clientId"));
  if (!clientId) {
    return NextResponse.json({ success: false, error: "Missing clientId" }, { status: 400 });
  }

  const { token, expires } = generateImpersonateToken(clientId);
  return NextResponse.json({ success: true, token, expires });
}

/* ─── POST — /impersonate redeems a token or admin key for client details ── */
export async function POST(req: NextRequest) {
  try {
    const { clientId, token, adminKey } = (await req.json()) as { clientId?: number; token?: string; adminKey?: string };
    if (!clientId || (!token && !adminKey)) {
      return NextResponse.json({ success: false, error: "Missing clientId or credentials" }, { status: 400 });
    }

    // Two ways to authorize: a single-use HMAC token (admin panel "Login as Client"
    // link), or the shared admin key (WHMCS hook redirect, which can't mint a token).
    const authorized = token
      ? verifyImpersonateToken(Number(clientId), token)
      : adminKey === config.adminPassword;

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const client = await getClientDetails(Number(clientId));
    return NextResponse.json({
      success: true,
      client: {
        id:        client.id,
        email:     client.email,
        firstname: client.firstname,
        fullname:  `${client.firstname} ${client.lastname}`.trim(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch client details";
    console.error("[auth/sso]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
