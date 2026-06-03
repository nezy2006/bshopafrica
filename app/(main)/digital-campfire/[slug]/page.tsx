"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, Clock, Flame } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  coverImage: string | null;
  readTime: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Web Hosting":       "bg-purple-100 text-purple-700",
  "Domains":           "bg-blue-100   text-blue-700",
  "Business Tips":     "bg-green-100  text-green-700",
  "Digital Marketing": "bg-orange-100 text-orange-700",
  "Success Stories":   "bg-pink-100   text-pink-700",
  "General":           "bg-gray-100   text-gray-700",
  "Hosting Tips":      "bg-purple-100 text-purple-700",
  "Domain Guide":      "bg-blue-100   text-blue-700",
  "Business Growth":   "bg-green-100  text-green-700",
  "Tech News":         "bg-cyan-100   text-cyan-700",
  "Company News":      "bg-yellow-100 text-yellow-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    params.then(async ({ slug }) => {
      try {
        const res  = await fetch(`/api/blog/${slug}`);
        const json = await res.json() as { success: boolean; data?: Post };
        if (json.success && json.data) setPost(json.data);
        else setError(true);
      } catch { setError(true); }
      finally { setLoading(false); }
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-72 bg-gray-200 animate-pulse" />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-6">
          <Flame className="w-8 h-8 text-purple-300" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">Post Not Found</h1>
        <p className="text-gray-500 mb-8">This article may have been moved or removed.</p>
        <Link href="/digital-campfire"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-full hover:bg-[#581c87] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Digital Campfire
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover image */}
      {post.coverImage ? (
        <div className="relative w-full h-72 sm:h-96 bg-[#0d0118]">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover opacity-80" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-[#3b0764] to-[#6B21A8] flex items-center justify-center">
          <Flame className="w-16 h-16 text-white/30" />
        </div>
      )}

      {/* Article */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <Link href="/digital-campfire"
            className="inline-flex items-center gap-2 text-sm text-[#6B21A8] font-semibold hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Digital Campfire
          </Link>
        </motion.div>

        <motion.article initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          {/* Category */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-6">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#6B21A8]" />{post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#6B21A8]" />{formatDate(post.createdAt)}</span>
            {post.readTime && (
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#6B21A8]" />{post.readTime}</span>
            )}
          </div>

          {/* Content */}
          <div
            className="prose prose-lg prose-purple max-w-none
              prose-headings:font-black prose-headings:text-gray-900
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-[#6B21A8] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900
              prose-img:rounded-2xl prose-img:shadow-md
              prose-blockquote:border-l-[#6B21A8] prose-blockquote:text-gray-600
              prose-code:text-[#6B21A8] prose-code:bg-purple-50 prose-code:px-1 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </motion.article>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <Link href="/digital-campfire"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-full hover:bg-[#581c87] transition-colors">
            <ArrowLeft className="w-4 h-4" /> More from Digital Campfire
          </Link>
        </div>
      </div>
    </div>
  );
}
