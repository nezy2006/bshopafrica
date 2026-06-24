import { NextRequest, NextResponse } from "next/server";
import { getClientDetails } from "@/lib/whmcs";
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
