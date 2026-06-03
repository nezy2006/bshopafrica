import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };
  const expectedEmail    = "admin@bshopafrica.com";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  if (email === expectedEmail && password === expectedPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
}
