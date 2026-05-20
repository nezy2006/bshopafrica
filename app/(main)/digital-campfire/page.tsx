"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, Flame, Tag } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CATEGORIES = ["All", "Web Hosting", "Domains", "Business Tips", "Digital Marketing", "Success Stories"];

const ARTICLES = [
  {
    id: 1, featured: true,
    category: "Business Tips",
    title: "Why Every African Business Needs a Professional Website in 2026",
    excerpt: "In an era where 73% of buying decisions begin online, having a professional website isn't optional — it's your digital storefront, your 24/7 salesperson, and your credibility signal all in one.",
    readTime: "6 min read",
    date: "May 18, 2026",
    image: null,
  },
  {
    id: 2,
    category: "Web Hosting",
    title: "cPanel vs Plesk: Which Control Panel is Right for Your Business?",
    excerpt: "Choosing the right hosting control panel can make or break your server management experience. We break down the pros and cons of both for African businesses.",
    readTime: "5 min read",
    date: "May 15, 2026",
  },
  {
    id: 3,
    category: "Domains",
    title: "How to Choose the Perfect Domain Name for Your African Brand",
    excerpt: "Your domain name is your digital address. Get it right from day one with these proven strategies used by the continent's most successful online businesses.",
    readTime: "4 min read",
    date: "May 12, 2026",
  },
  {
    id: 4,
    category: "Digital Marketing",
    title: "SEO for African Businesses: A Practical Guide to Getting Found Online",
    excerpt: "Search Engine Optimization doesn't have to be complicated. Learn the fundamentals that will get your business discovered by customers across Africa and beyond.",
    readTime: "8 min read",
    date: "May 10, 2026",
  },
  {
    id: 5,
    category: "Success Stories",
    title: "How Kigali Boutique Grew Revenue 340% After Launching Their Website",
    excerpt: "Meet Amina, a fashion entrepreneur who transformed her physical store into a thriving online business. Her story will inspire your digital journey.",
    readTime: "3 min read",
    date: "May 8, 2026",
  },
  {
    id: 6,
    category: "Web Hosting",
    title: "SSL Certificates Explained: Why HTTPS Matters for Your Website",
    excerpt: "HTTPS isn't just a padlock icon — it's trust, security, and a Google ranking signal. Here's everything you need to know about SSL for your business site.",
    readTime: "4 min read",
    date: "May 5, 2026",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Web Hosting":      "bg-purple-100 text-purple-700",
  "Domains":          "bg-blue-100   text-blue-700",
  "Business Tips":    "bg-green-100  text-green-700",
  "Digital Marketing":"bg-orange-100 text-orange-700",
  "Success Stories":  "bg-pink-100   text-pink-700",
};

export default function DigitalCampfirePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const featured = ARTICLES.find(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured && (activeCategory === "All" || a.category === activeCategory));

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    finally { setLoading(false); }
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
        {/* Featured article */}
        {featured && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="bg-gradient-to-r from-[#3b0764] to-[#6B21A8] rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide">Featured</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[featured.category] ?? "bg-white/20"}`}>{featured.category}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">{featured.title}</h2>
              <p className="text-white/70 mb-6 leading-relaxed">{featured.excerpt}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Clock className="w-4 h-4" />{featured.readTime}
                </div>
                <span className="text-white/30">·</span>
                <span className="text-white/50 text-sm">{featured.date}</span>
                <Link href={`/digital-campfire/${featured.id}`}
                  className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#6B21A8] font-bold rounded-full hover:shadow-lg transition-shadow text-sm">
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
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

        {/* Articles grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article, i) => (
            <motion.div key={article.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
              whileHover={{ y: -6 }} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Card image placeholder */}
              <div className="h-44 bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-purple-200" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {article.category}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#6B21A8] transition-colors">{article.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />{article.readTime}
                  </div>
                  <Link href={`/digital-campfire/${article.id}`}
                    className="text-xs font-semibold text-[#6B21A8] hover:underline flex items-center gap-1">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
                <button type="submit" disabled={loading || !email.trim()}
                  className="px-6 py-3 bg-white text-[#6B21A8] font-bold rounded-2xl hover:shadow-lg transition-shadow disabled:opacity-60 text-sm whitespace-nowrap">
                  {loading ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
