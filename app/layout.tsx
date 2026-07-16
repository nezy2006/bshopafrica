import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bshopafrica.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "The B.Shop — Your Digital Story Starts Here",
    template: "%s | The B.Shop Africa",
  },
  description:
    "Professional web hosting built for African businesses. Fast, reliable, and transparently priced. Register your domain and get online today.",
  keywords: "web hosting, domain registration, Africa, bshopafrica",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "The B.Shop — Your Digital Story Starts Here",
    description: "Professional web hosting built for African businesses.",
    url: APP_URL,
    siteName: "The B.Shop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The B.Shop — Your Digital Story Starts Here",
    description: "Professional web hosting built for African businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
