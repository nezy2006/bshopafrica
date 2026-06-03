import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };
  const expectedEmail    = "admin@bshopafrica.com";
  const expectedPassword = config.adminPassword;

  if (email === expectedEmail && password === expectedPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
}
