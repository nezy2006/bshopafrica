"use client";

import { useEffect } from "react";

const STORAGE_KEY = "bshop_ref_code";

/** Captures a shared affiliate code/link from any landing page (?ref=CODE, or
 *  the legacy numeric ?affid=) and remembers it until signup, since visitors
 *  usually land on the homepage or a product page — not directly on /signup. */
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("affid");
      if (ref) localStorage.setItem(STORAGE_KEY, ref);
    } catch { /* localStorage unavailable — ref simply won't be remembered */ }
  }, []);
  return null;
}
