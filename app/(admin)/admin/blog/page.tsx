"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, TableCard, THead, SkeletonRows, EmptyState, SearchBar } from "@/lib/admin-utils";

interface Post { id: number; title: string; slug: string; category: string; published: boolean; createdAt: string; author: string; }

export default function BlogListPage() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res  = await fetch("/api/blog");
      const json = await res.json() as { success: boolean; data?: Post[] };
      if (json.success && json.data) setPosts(json.data);
    } catch { /* db not connected yet */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = search
    ? posts.filter(p => `${p.title} ${p.category} ${p.author}`.toLowerCase().includes(search.toLowerCase()))
    : posts;

  const togglePublish = async (post: Post) => {
    try {
      await fetch(`/api/blog/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !post.published }) });
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
    } catch { /* handle error */ }
  };

  const deletePost = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    try {
      await fetch(`/api/blog/${id}`, { method: "DELETE" });
      setPosts(ps => ps.filter(p => p.id !== id));
    } catch { /* handle error */ }
  };

  return (
    <div>
      <PageHeader
        title="Blog Posts"
        subtitle={`${posts.length} posts`}
        action={<Link href="/admin/blog/new" className="px-5 py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87] transition-colors">+ New Post</Link>}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search posts…" />

      <TableCard>
        <THead cols={["Title", "Category", "Author", "Date", "Status", "Actions"]} />
        <tbody>
          {loading ? <SkeletonRows cols={6} /> : filtered.length === 0 ? <EmptyState icon="📝" message="No blog posts yet" /> : filtered.map(p => (
            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-black max-w-xs truncate">{p.title}</td>
              <td className="px-5 py-3.5"><span className="px-2.5 py-0.5 bg-purple-100 text-[#6B21A8] rounded-full text-xs font-bold">{p.category}</span></td>
              <td className="px-5 py-3.5 text-gray-500">{p.author}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
              <td className="px-5 py-3.5">
                <button onClick={() => togglePublish(p)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${p.published ? "bg-green-500" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${p.published ? "left-5" : "left-0.5"}`} />
                </button>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex gap-2">
                  <Link href={`/admin/blog/${p.id}/edit`} className="text-xs text-[#6B21A8] font-semibold hover:underline">Edit</Link>
                  <button onClick={() => deletePost(p.id)} className="text-xs text-red-500 font-semibold hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}
