import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";

interface BlogRow { id: number; title: string; slug: string; excerpt: string; content: string; category: string; author: string; published: number; coverImage: string | null; readTime: string; createdAt: string; updatedAt: string; }

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const post = /^\d+$/.test(id)
      ? await queryOne<BlogRow>("SELECT * FROM BlogPost WHERE id = ?", [Number(id)])
      : await queryOne<BlogRow>("SELECT * FROM BlogPost WHERE slug = ?", [id]);
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: post });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;
    const sets = Object.keys(body).map(k => `\`${k}\` = ?`).join(", ");
    const vals = [...Object.values(body).map(v => (v === undefined ? null : v) as string | number | boolean | null), Number(id)];
    await execute(`UPDATE BlogPost SET ${sets}, updatedAt = NOW() WHERE id = ?`, vals);
    const post = await queryOne<BlogRow>("SELECT * FROM BlogPost WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true, data: post });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await execute("DELETE FROM BlogPost WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 });
  }
}
