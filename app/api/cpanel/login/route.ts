import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ success: false, error: "username is required" }, { status: 400 });
  }

  try {
    const url = `${config.whmHost}/json-api/create_user_session?api.version=1&user=${encodeURIComponent(username)}&service=cpaneld`;
    const res = await fetch(url, {
      headers: {
        Authorization: `whm ${config.whmUser}:${config.whmToken}`,
      },
      // WHM uses a self-signed cert on some setups; skip verification server-side
      // @ts-expect-error - Node fetch agent option
      agent: undefined,
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `WHM returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const sessionUrl: string | undefined = data?.data?.url;

    if (!sessionUrl) {
      return NextResponse.json({ success: false, error: data?.metadata?.reason ?? "No session URL returned" }, { status: 502 });
    }

    return NextResponse.json({ success: true, url: sessionUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
