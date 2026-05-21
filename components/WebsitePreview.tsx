"use client";

import { useState } from "react";

export interface SiteData {
  siteName:        string;
  tagline:         string;
  colorPrimary:    string;
  colorSecondary:  string;
  colorAccent:     string;
  pages: {
    home?: {
      heroHeadline?: string;
      heroSubtext?:  string;
      heroButtonText?: string;
      aboutTitle?:   string;
      aboutText?:    string;
      servicesTitle?: string;
      services?:     Array<{ name: string; description: string; icon?: string }>;
      ctaText?:      string;
      ctaButton?:    string;
    };
    contact?: {
      address?: string;
      phone?:   string;
      email?:   string;
    };
  };
  footer?: {
    tagline?:   string;
    copyright?: string;
  };
}

type ViewMode = "desktop" | "mobile";

export default function WebsitePreview({ siteData }: { siteData: SiteData }) {
  const [view, setView] = useState<ViewMode>("desktop");

  const primary   = siteData.colorPrimary   || "#6B21A8";
  const secondary = siteData.colorSecondary || "#4c1d95";
  const home      = siteData.pages?.home    ?? {};
  const services  = home.services           ?? [];

  const frameWidth = view === "desktop" ? "100%" : "375px";

  return (
    <div className="flex flex-col gap-3">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-gray-100 p-1 text-xs">
          {(["desktop", "mobile"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${view === v ? "bg-white shadow text-[#6B21A8]" : "text-gray-500"}`}>
              {v === "desktop" ? "🖥 Desktop" : "📱 Mobile"}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{siteData.siteName}</span>
      </div>

      {/* Browser frame */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-gray-100">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 border-b border-gray-300">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono truncate">
            https://{siteData.siteName.toLowerCase().replace(/\s+/g, "")}.com
          </div>
        </div>

        {/* Scrollable site preview */}
        <div className="overflow-auto bg-white" style={{ maxHeight: 520 }}>
          <div style={{ width: frameWidth, margin: "0 auto", transition: "width 0.3s ease" }}>
            {/* Nav */}
            <div style={{ background: primary, padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: "1rem" }}>{siteData.siteName}</span>
              {view === "desktop" && (
                <div style={{ display: "flex", gap: "1.25rem" }}>
                  {["Home", "About", "Services", "Contact"].map(l => (
                    <span key={l} style={{ color: "rgba(255,255,255,.8)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>{l}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Hero */}
            <div style={{
              background: `linear-gradient(135deg, ${secondary}, ${primary})`,
              color: "#fff",
              padding: view === "mobile" ? "3rem 1.25rem" : "4rem 2rem",
              textAlign: "center",
            }}>
              <h1 style={{ fontSize: view === "mobile" ? "1.5rem" : "2.25rem", fontWeight: 900, lineHeight: 1.15, marginBottom: "1rem" }}>
                {home.heroHeadline || siteData.siteName}
              </h1>
              <p style={{ opacity: 0.85, marginBottom: "1.5rem", fontSize: "0.95rem", maxWidth: 480, margin: "0 auto 1.5rem" }}>
                {home.heroSubtext || siteData.tagline}
              </p>
              <span style={{
                display: "inline-block", padding: "0.7rem 2rem",
                background: "#fff", color: primary, fontWeight: 700,
                borderRadius: 50, fontSize: "0.875rem", cursor: "pointer",
              }}>
                {home.heroButtonText || "Get Started"}
              </span>
            </div>

            {/* About */}
            {home.aboutText && (
              <div style={{ background: "#f9fafb", padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <h2 style={{ fontWeight: 900, fontSize: "1.25rem", marginBottom: "0.75rem", color: "#111" }}>
                  {home.aboutTitle || "About Us"}
                </h2>
                <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.65, maxWidth: 600, margin: "0 auto" }}>
                  {home.aboutText}
                </p>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div style={{ padding: "2.5rem 1.5rem" }}>
                <h2 style={{ fontWeight: 900, fontSize: "1.25rem", textAlign: "center", marginBottom: "1.5rem", color: "#111" }}>
                  {home.servicesTitle || "Our Services"}
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: view === "mobile" ? "1fr" : "repeat(3, 1fr)",
                  gap: "1rem",
                }}>
                  {services.slice(0, 3).map((s, i) => (
                    <div key={i} style={{
                      background: "#fff", border: "1px solid #e5e7eb",
                      borderRadius: 12, padding: "1.25rem", textAlign: "center",
                      boxShadow: "0 1px 6px rgba(0,0,0,.05)",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${primary}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 0.75rem", fontSize: "1.25rem",
                      }}>⭐</div>
                      <h3 style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.4rem", color: "#111" }}>{s.name}</h3>
                      <p style={{ color: "#666", fontSize: "0.8rem", lineHeight: 1.5 }}>{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ background: "#111", color: "#aaa", padding: "1.25rem", textAlign: "center", fontSize: "0.8rem" }}>
              {siteData.footer?.tagline && <p style={{ marginBottom: "0.25rem" }}>{siteData.footer.tagline}</p>}
              <p>{siteData.footer?.copyright || `© 2025 ${siteData.siteName}. All rights reserved.`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
