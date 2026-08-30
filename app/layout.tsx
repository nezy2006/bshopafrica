import type { Metadata, Viewport } from "next";
import "./globals.css";
import SupportChat from "@/components/SupportChat";
import ReferralCapture from "@/components/ReferralCapture";
import ToastHost from "@/components/ToastHost";

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
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.ico",
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

export const viewport: Viewport = {
  themeColor: "#6B21A8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">
        {children}
        <ReferralCapture />
        <ToastHost />
        <SupportChat />
      </body>
    </html>
  );
}
