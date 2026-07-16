import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bshopafrica.com";

const ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/",                 priority: 1.0, changeFrequency: "daily"   },
  { path: "/about",            priority: 0.6, changeFrequency: "monthly" },
  { path: "/domains",          priority: 0.9, changeFrequency: "daily"   },
  { path: "/hosting",          priority: 0.9, changeFrequency: "weekly"  },
  { path: "/website-builder",  priority: 0.7, changeFrequency: "monthly" },
  { path: "/digital-campfire", priority: 0.6, changeFrequency: "weekly"  },
  { path: "/contact",          priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms",            priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy",          priority: 0.3, changeFrequency: "monthly" },
  { path: "/refund",           priority: 0.3, changeFrequency: "monthly" },
  { path: "/login",            priority: 0.4, changeFrequency: "monthly" },
  { path: "/signup",           priority: 0.4, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map(r => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
