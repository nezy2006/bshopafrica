import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export interface WhmAccount {
  user: string;
  domain: string;
  diskused: string;
  disklimit: string;
  suspended: boolean;
}

export async function GET() {
  try {
    const url = `${config.whmHost}/json-api/listaccts?api.version=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `whm ${config.whmUser}:${config.whmToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `WHM returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const accts: WhmAccount[] = (data?.data?.acct ?? []).map((a: Record<string, unknown>) => ({
      user:      a.user,
      domain:    a.domain,
      diskused:  a.diskused,
      disklimit: a.disklimit,
      suspended: a.suspended === 1 || a.suspended === "1" || a.suspended === true,
    }));

    return NextResponse.json({ success: true, accounts: accts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
