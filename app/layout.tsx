import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The B.Shop — Your Digital Story Starts Here",
  description:
    "Professional web hosting built for African businesses. Fast, reliable, and transparently priced. Register your domain and get online today.",
  keywords: "web hosting, domain registration, Africa, bshopafrica",
  icons: {
    icon:     "/logo.png",
    shortcut: "/logo.png",
    apple:    "/logo.png",
  },
  openGraph: {
    title: "The B.Shop — Your Digital Story Starts Here",
    description: "Professional web hosting built for African businesses.",
    url: "https://bshopafrica.com",
    siteName: "The B.Shop",
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
