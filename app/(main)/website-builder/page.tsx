"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addToCart } from "@/lib/cart";
import type { CartWebsiteBuilder } from "@/lib/cart";
import WebsitePreview, { type SiteData } from "@/components/WebsitePreview";
import { Wand2 } from "lucide-react";
import Link from "next/link";

type Ease = [number, number, number, number];
const EASE: Ease = [0.22, 1, 0.36, 1];

const INPUT =
  "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-medium text-black placeholder-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(107,33,168,0.1)]";

const BUSINESS_TYPES = [
  "Restaurant/Cafe",
  "Hair Salon/Beauty",
  "Clothing/Fashion Store",
  "Professional Services",
  "Healthcare/Medical",
  "Education/Training",
  "NGO/Non-profit",
  "Technology",
  "Construction/Real Estate",
  "Other",
];

const COLOR_OPTIONS = [
  { label: "Purple",      value: "purple",      hex: "#6B21A8" },
  { label: "Blue",        value: "blue",        hex: "#1d4ed8" },
  { label: "Green",       value: "green",       hex: "#15803d" },
  { label: "Red/Orange",  value: "red/orange",  hex: "#ea580c" },
  { label: "Black/Dark",  value: "black/dark",  hex: "#111827" },
  { label: "Gold/Yellow", value: "gold/yellow", hex: "#b45309" },
];

const PAGE_OPTIONS = [
  { value: "About Us",          label: "About Us"          },
  { value: "Services/Menu",     label: "Services / Menu"   },
  { value: "Gallery/Portfolio", label: "Gallery / Portfolio" },
  { value: "Contact",           label: "Contact"           },
  { value: "Book Appointment",  label: "Book Appointment"  },
  { value: "Online Shop",       label: "Online Shop"       },
];

const GENERATE_STEPS = [
  "Analyzing your business...",
  "Writing homepage content...",
  "Creating service descriptions...",
  "Designing your layout...",
  "Almost ready...",
];

/* ─── Step indicator ─────────────────────────────────────────────────────── */
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            n < current  ? "bg-green-500 text-white" :
            n === current ? "bg-[#6B21A8] text-white shadow-[0_0_0_4px_rgba(107,33,168,0.2)]" :
                            "bg-gray-100 text-gray-400"
          }`}>
            {n < current ? "✓" : n}
          </div>
          {n < 4 && <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${n < current ? "bg-green-500" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Step 1 — Business Info ─────────────────────────────────────────────── */
interface FormData {
  businessName: string;
  businessType: string;
  location:     string;
  phone:        string;
  email:        string;
  tagline:      string;
  colorScheme:  string;
  pages:        string[];
  specialRequests: string;
}

function Step1({ data, onChange, onNext }: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
  onNext: () => void;
}) {
  const canContinue = data.businessName.trim() && data.businessType && data.location.trim();

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: EASE }}>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">Your Business</h2>
        <p className="text-gray-500 text-sm mt-1">Tell us about your business so AI can write the right content.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name <span className="text-red-500">*</span></label>
          <input value={data.businessName} onChange={e => onChange({ businessName: e.target.value })}
            placeholder="e.g. Bella's Hair Salon" className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Type <span className="text-red-500">*</span></label>
          <select value={data.businessType} onChange={e => onChange({ businessType: e.target.value })} className={INPUT}>
            <option value="">Select type...</option>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location (City, Country) <span className="text-red-500">*</span></label>
          <input value={data.location} onChange={e => onChange({ location: e.target.value })}
            placeholder="e.g. Kigali, Rwanda" className={INPUT} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <input value={data.phone} onChange={e => onChange({ phone: e.target.value })}
              placeholder="+250 700 000 000" className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={data.email} onChange={e => onChange({ email: e.target.value })}
              placeholder="hello@business.com" className={INPUT} />
          </div>
        </div>
        <button onClick={onNext} disabled={!canContinue}
          className="w-full mt-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Next → Your Style
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Step 2 — Style & Pages ─────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function togglePage(val: string) {
    const pages = data.pages.includes(val)
      ? data.pages.filter(p => p !== val)
      : [...data.pages, val];
    onChange({ pages });
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: EASE }}>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">Your Style</h2>
        <p className="text-gray-500 text-sm mt-1">Choose colors and which pages to include.</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline / Slogan</label>
          <input value={data.tagline} onChange={e => onChange({ tagline: e.target.value })}
            placeholder="Quality you can trust" className={INPUT} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map(c => (
              <button key={c.value} onClick={() => onChange({ colorScheme: c.value })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  data.colorScheme === c.value ? "border-[#6B21A8] bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <span className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ background: c.hex }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pages to Include</label>
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              <span className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>
              Home (always included)
            </div>
            {PAGE_OPTIONS.map(p => (
              <label key={p.value} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div onClick={() => togglePage(p.value)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    data.pages.includes(p.value) ? "bg-[#6B21A8] border-[#6B21A8]" : "border-gray-300"
                  }`}>
                  {data.pages.includes(p.value) && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
                <span className="text-sm text-gray-700">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Special Requests</label>
          <textarea value={data.specialRequests} onChange={e => onChange({ specialRequests: e.target.value })}
            placeholder="Any specific features, tone, or style preferences..."
            rows={3} className={`${INPUT} resize-none`} />
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-gray-300 transition-colors">
            ← Back
          </button>
          <button onClick={onNext} className="flex-1 py-3 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-colors">
            Next → Generate
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Step 3 — Generate ──────────────────────────────────────────────────── */
function Step3({ data, onDone, onBack }: {
  data: FormData;
  onDone: (siteData: SiteData) => void;
  onBack: () => void;
}) {
  const [generating,    setGenerating]    = useState(false);
  const [genStep,       setGenStep]       = useState(0);
  const [error,         setError]         = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setGenStep(0);

    // Animate progress steps while API call runs
    const stepInterval = setInterval(() => {
      setGenStep(s => (s < GENERATE_STEPS.length - 1 ? s + 1 : s));
    }, 1400);

    try {
      const res = await fetch("/api/website-builder", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:          "generate",
          businessName:    data.businessName,
          businessType:    data.businessType,
          location:        data.location,
          phone:           data.phone,
          email:           data.email,
          tagline:         data.tagline,
          colorScheme:     data.colorScheme,
          pages:           ["Home", ...data.pages],
          specialRequests: data.specialRequests,
        }),
      });

      clearInterval(stepInterval);
      setGenStep(GENERATE_STEPS.length - 1);

      const json = (await res.json()) as { success: boolean; siteData?: SiteData; error?: string };

      if (!json.success || !json.siteData) {
        setError(json.error ?? "Generation failed. Please try again.");
        setGenerating(false);
        return;
      }

      // Short pause so user sees the last progress step
      await new Promise(r => setTimeout(r, 600));
      onDone(json.siteData);

    } catch {
      clearInterval(stepInterval);
      setError("Network error. Please try again.");
      setGenerating(false);
    }
  }

  const pct = generating ? Math.round(((genStep + 1) / GENERATE_STEPS.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: EASE }}>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">Generate Your Site</h2>
        <p className="text-gray-500 text-sm mt-1">Review your details then generate your website.</p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 space-y-2 text-sm">
        {[
          ["Business",  data.businessName],
          ["Type",      data.businessType],
          ["Location",  data.location],
          ["Color",     data.colorScheme],
          ["Pages",     ["Home", ...data.pages].join(", ")],
        ].map(([label, value]) => value && (
          <div key={label} className="flex items-center gap-3">
            <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
            <span className="font-semibold text-gray-800">{value}</span>
          </div>
        ))}
      </div>

      {/* Generate area */}
      {!generating ? (
        <div className="space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            className="w-full py-5 bg-gradient-to-r from-[#6B21A8] to-[#4c1d95] text-white font-black text-lg rounded-2xl hover:shadow-[0_0_40px_rgba(107,33,168,0.5)] transition-shadow flex items-center justify-center gap-3"
          >
            <Wand2 className="w-6 h-6" />
            Generate My Website
          </motion.button>
          <button onClick={onBack} className="w-full py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-gray-300 transition-colors">
            ← Edit Details
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#6B21A8] to-purple-400 rounded-full"
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {GENERATE_STEPS.map((step, i) => (
              <motion.div key={step}
                initial={{ opacity: 0, x: -12 }}
                animate={genStep >= i ? { opacity: 1, x: 0 } : { opacity: 0.3, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 text-sm ${genStep >= i ? "text-gray-800" : "text-gray-300"}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  genStep > i  ? "bg-green-500 text-white" :
                  genStep === i ? "bg-[#6B21A8] text-white" :
                                  "bg-gray-200 text-gray-400"
                }`}>
                  {genStep > i ? "✓" : genStep === i ? (
                    <span className="w-2.5 h-2.5 border-2 border-white/50 border-t-white rounded-full animate-spin block" />
                  ) : "○"}
                </span>
                {step}
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Powered by Claude AI · Usually takes 15–30 seconds
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Step 4 — Preview & Purchase ────────────────────────────────────────── */
function Step4({ siteData, onRegenerate, onEditDetails }: {
  siteData: SiteData;
  onRegenerate: () => void;
  onEditDetails: () => void;
}) {
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    const item: CartWebsiteBuilder = {
      id:           "website_builder",
      type:         "website_builder",
      name:         "AI Website Builder",
      productId:    Number(process.env.NEXT_PUBLIC_WEBSITE_BUILDER_PRODUCT_ID ?? 34),
      price:        29,
      siteData:     JSON.stringify(siteData),
      businessName: siteData.siteName,
    };
    // Store generated site in localStorage for checkout access
    if (typeof window !== "undefined") {
      localStorage.setItem("bshop_generated_site", JSON.stringify(siteData));
    }
    addToCart(item);
    setAdded(true);
  }

  const INCLUDES = [
    "Complete website (all selected pages)",
    "Hosted on your B.Shop hosting",
    "Connected to your domain",
    "SSL certificate included",
    "Mobile responsive design",
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: EASE }}>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">Your Website is Ready!</h2>
        <p className="text-gray-500 text-sm mt-1">Review the preview and get it live for $29.</p>
      </div>

      {/* Preview */}
      <div className="mb-6">
        <WebsitePreview siteData={siteData} />
      </div>

      {/* Purchase box */}
      {!added ? (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-black text-gray-900 text-lg">Love it? Get it live for</p>
            <span className="text-3xl font-black text-[#6B21A8]">$29 <span className="text-base font-semibold text-gray-400">one-time</span></span>
          </div>
          <ul className="space-y-1.5 mb-5">
            {INCLUDES.map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            className="w-full py-4 bg-[#6B21A8] text-white font-black text-base rounded-2xl hover:shadow-[0_0_30px_rgba(107,33,168,0.45)] transition-shadow mb-3"
          >
            Add to Cart — $29
          </motion.button>
          <div className="flex gap-2">
            <button onClick={onRegenerate} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              ↺ Regenerate
            </button>
            <button onClick={onEditDetails} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              ✏ Edit Details
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-black text-green-800 text-xl mb-2">Added to Cart!</h3>
          <p className="text-green-700 text-sm mb-5">Your website builder package is in your cart.</p>
          <Link href="/cart"
            className="inline-block px-8 py-3 bg-[#6B21A8] text-white font-bold rounded-full hover:bg-[#581c87] transition-colors">
            View Cart & Checkout →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative bg-[#0a0a0a] pt-36 pb-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#6B21A8]/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium mb-8"
        >
          <Wand2 className="w-4 h-4 text-purple-400" />
          Powered by Claude AI
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
        >
          Build Your Professional<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Website with AI
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.65 }}
          className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto"
        >
          Answer a few questions. Our AI builds your complete website in 30 seconds.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="px-10 py-4 bg-[#6B21A8] text-white font-black text-lg rounded-full hover:shadow-[0_0_40px_rgba(107,33,168,0.6)] transition-shadow"
          >
            Start Building — $29
          </motion.button>
          <div className="flex gap-4 text-sm text-white/40">
            <span>✓ No coding</span>
            <span>✓ 30 seconds</span>
            <span>✓ Fully hosted</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
const defaultForm: FormData = {
  businessName:    "",
  businessType:    "",
  location:        "",
  phone:           "",
  email:           "",
  tagline:         "",
  colorScheme:     "purple",
  pages:           ["About Us", "Services/Menu", "Contact"],
  specialRequests: "",
};

export default function WebsiteBuilderPage() {
  const [formStep,  setFormStep]  = useState<1 | 2 | 3 | 4>(1);
  const [formData,  setFormData]  = useState<FormData>(defaultForm);
  const [siteData,  setSiteData]  = useState<SiteData | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const formRef = typeof window !== "undefined" ? document.getElementById("builder-form") : null;

  function scrollToForm() {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("builder-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function update(partial: Partial<FormData>) {
    setFormData(prev => ({ ...prev, ...partial }));
  }

  function handleGenDone(data: SiteData) {
    setSiteData(data);
    setFormStep(4);
  }

  return (
    <>
      <Hero onStart={scrollToForm} />

      {/* Social proof strip */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-6 justify-center text-sm text-gray-500">
          {["✓ AI-powered content", "✓ Mobile-ready design", "✓ SSL included", "✓ Connected to your domain", "✓ One-time $29 price"].map(f => (
            <span key={f} className="font-medium">{f}</span>
          ))}
        </div>
      </div>

      {/* Builder form section */}
      <section id="builder-form" className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div key="cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="text-center py-16">
                <div className="text-6xl mb-6">🚀</div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Ready to Build?</h2>
                <p className="text-gray-500 mb-8">Fill out a short form and our AI will create your complete professional website.</p>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowForm(true)}
                  className="px-10 py-4 bg-[#6B21A8] text-white font-black text-lg rounded-full hover:shadow-[0_0_30px_rgba(107,33,168,0.5)] transition-shadow"
                >
                  Start Building — $29
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
                      Step {formStep} of 4
                    </p>
                    <span className="text-xs font-bold text-[#6B21A8]">$29 one-time</span>
                  </div>
                  <StepDots current={formStep} />

                  <AnimatePresence mode="wait">
                    {formStep === 1 && (
                      <div key="s1">
                        <Step1 data={formData} onChange={update} onNext={() => setFormStep(2)} />
                      </div>
                    )}
                    {formStep === 2 && (
                      <div key="s2">
                        <Step2 data={formData} onChange={update}
                          onNext={() => setFormStep(3)} onBack={() => setFormStep(1)} />
                      </div>
                    )}
                    {formStep === 3 && (
                      <div key="s3">
                        <Step3 data={formData}
                          onDone={handleGenDone}
                          onBack={() => setFormStep(2)} />
                      </div>
                    )}
                    {formStep === 4 && siteData && (
                      <div key="s4">
                        <Step4 siteData={siteData}
                          onRegenerate={() => setFormStep(3)}
                          onEditDetails={() => setFormStep(2)} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Trust line */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  🔒 Secure · Powered by Claude AI · 30-day money-back guarantee
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
