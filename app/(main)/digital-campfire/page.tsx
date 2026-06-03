"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, ArrowRight, Flame, Calendar, User } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
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

function stripHtml(html: string, max = 150) {
  const text = html.replace(/<[^>]+>/g, "").trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export default function DigitalCampfirePage() {
  const [posts,          setPosts]          = useState<Post[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [email,          setEmail]          = useState("");
  const [submitted,      setSubmitted]      = useState(false);
  const [subLoading,     setSubLoading]     = useState(false);

  useEffect(() => {
    fetch("/api/blog")
      .then(r => r.json() as Promise<{ success: boolean; data?: Post[] }>)
      .then(json => { if (json.success && json.data) setPosts(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(posts.map(p => p.category))).sort()];
  const featured = posts[0] ?? null;
  const rest = posts.slice(1).filter(p => activeCategory === "All" || p.category === activeCategory);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubLoading(true);
    try {
      await fetch("/api/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    finally { setSubLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-[#0d0118] pt-36 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(107,33,168,0.3) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#6B21A8]/30 border border-[#6B21A8]/40 rounded-full text-purple-300 text-sm font-medium mb-6">
            <Flame className="w-4 h-4" />The Digital Campfire
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Stories, Strategies &amp; Insights
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-white/60 text-lg max-w-xl mx-auto">
            For African businesses building their digital presence — practical guides, success stories, and industry insights.
          </motion.p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
              <Flame className="w-10 h-10 text-purple-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">The Campfire is Warming Up</h2>
            <p className="text-gray-500 max-w-md">
              Great stories and insights are on their way. Check back soon — the first posts will be live shortly.
            </p>
          </motion.div>
        )}

        {/* Featured post */}
        {!loading && featured && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="bg-gradient-to-r from-[#3b0764] to-[#6B21A8] rounded-3xl overflow-hidden text-white relative">
            {featured.coverImage && (
              <div className="absolute inset-0">
                <Image src={featured.coverImage} alt={featured.title} fill className="object-cover opacity-20" />
              </div>
            )}
            <div className="relative z-10 p-8 sm:p-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide">Featured</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[featured.category] ?? "bg-white/20 text-white"}`}>
                  {featured.category}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">{featured.title}</h2>
              <p className="text-white/70 mb-6 leading-relaxed line-clamp-3">{stripHtml(featured.excerpt, 200)}</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-white/50 text-sm">
                  <User className="w-4 h-4" />{featured.author}
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-sm">
                  <Calendar className="w-4 h-4" />{formatDate(featured.createdAt)}
                </div>
                {featured.readTime && (
                  <div className="flex items-center gap-1.5 text-white/50 text-sm">
                    <Clock className="w-4 h-4" />{featured.readTime}
                  </div>
                )}
                <Link href={`/digital-campfire/${featured.slug}`}
                  className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#6B21A8] font-bold rounded-full hover:shadow-lg transition-shadow text-sm">
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category filter */}
        {!loading && posts.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-[#6B21A8] text-white shadow"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-[#6B21A8]"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Articles grid */}
        {!loading && rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post, i) => (
              <motion.div key={post.id}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
                whileHover={{ y: -6 }}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-44 relative bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
                  {post.coverImage
                    ? <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                    : <BookOpen className="w-12 h-12 text-purple-200" />
                  }
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#6B21A8] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{stripHtml(post.excerpt)}</p>
                  <div className="flex items-center gap-3 mb-3 text-gray-400 text-xs">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    {post.readTime && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />{post.readTime}
                      </div>
                    )}
                    <Link href={`/digital-campfire/${post.slug}`}
                      className="text-xs font-semibold text-[#6B21A8] hover:underline flex items-center gap-1 ml-auto">
                      Read More <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Newsletter CTA */}
        <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="bg-[#6B21A8] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.6) 0%, transparent 50%)" }} />
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="flex justify-center mb-4">
              <Flame className="w-8 h-8 text-orange-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Join the Newsletter</h2>
            <p className="text-white/70 mb-8">Get the latest insights delivered to your inbox every week. No fluff, just value.</p>
            {submitted ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 rounded-2xl text-white font-semibold">
                You&apos;re subscribed! Watch your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-3 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/50 outline-none focus:bg-white/30 transition-colors text-sm" />
                <button type="submit" disabled={subLoading || !email.trim()}
                  className="px-6 py-3 bg-white text-[#6B21A8] font-bold rounded-2xl hover:shadow-lg transition-shadow disabled:opacity-60 text-sm whitespace-nowrap">
                  {subLoading ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
