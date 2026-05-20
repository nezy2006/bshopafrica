"use client";

import { useEffect } from "react";

// Replace TAWK_PROPERTY_ID and TAWK_WIDGET_ID with your actual Tawk.to IDs
// from https://dashboard.tawk.to → Administration → Chat Widget
const TAWK_PROPERTY_ID = "YOUR_PROPERTY_ID";
const TAWK_WIDGET_ID   = "default";

export default function TawkChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (TAWK_PROPERTY_ID === "YOUR_PROPERTY_ID") return; // placeholder — skip until configured

    const w = window as unknown as Record<string, unknown>;
    w.Tawk_API       = w.Tawk_API || {};
    w.Tawk_LoadStart = new Date();

    const s = document.createElement("script");
    s.async  = true;
    s.src    = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.head.appendChild(s);

    return () => {
      document.head.removeChild(s);
    };
  }, []);

  return null;
}
