"use client";

import { useEffect, useState } from "react";

// Kept in sync with the `h-9` class below — both the banner's own height and
// the CSS var other fixed elements (the black promo bar, Header, page content
// padding) read to shift themselves down when this banner is showing.
export const ANNOUNCEMENT_HEIGHT_PX = 36;

const TYPE_STYLES: Record<string, string> = {
  info:    "bg-blue-600 text-white",
  warning: "bg-amber-500 text-white",
  success: "bg-green-600 text-white",
  promo:   "bg-[#6B21A8] text-white",
};

interface AnnouncementState { enabled: boolean; text: string; type: string; }

export default function AnnouncementBanner() {
  const [state, setState] = useState<AnnouncementState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/content")
      .then(r => r.json())
      .then((json: { success: boolean; data?: Record<string, string> }) => {
        if (cancelled || !json.success || !json.data) return;
        const d = json.data;
        setState({
          enabled: d.announcement_enabled === "true" && !!d.announcement_text?.trim(),
          text:    d.announcement_text ?? "",
          type:    d.announcement_type ?? "info",
        });
      })
      .catch(() => { /* silent — banner just doesn't show */ });
    return () => { cancelled = true; };
  }, []);

  // Other fixed elements (the black promo bar, Header, main content padding)
  // read this CSS var so they shift down consistently without prop-drilling.
  useEffect(() => {
    const visible = !!state?.enabled;
    document.documentElement.style.setProperty("--announce-h", visible ? `${ANNOUNCEMENT_HEIGHT_PX}px` : "0px");
    return () => { document.documentElement.style.setProperty("--announce-h", "0px"); };
  }, [state?.enabled]);

  if (!state?.enabled) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] h-9 flex items-center justify-center px-4 text-sm font-semibold ${TYPE_STYLES[state.type] ?? TYPE_STYLES.info}`}
    >
      <p className="truncate">{state.text}</p>
    </div>
  );
}
