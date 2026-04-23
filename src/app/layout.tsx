import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://take-home-calculator-nine.vercel.app"),
  title: "Take-Home Calculator · Tax Year 2026",
  description:
    "Model your 2026 federal, state, FICA, and supplemental-wage withholding, and see what you actually keep from salary, bonuses, and RSUs.",
  openGraph: {
    type: "website",
    title: "Take-Home Calculator · Tax Year 2026",
    description:
      "What you actually keep — 2026 federal, state, FICA, and supplemental-wage withholding.",
    url: "/",
    siteName: "Take-Home Calculator",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Take-Home Calculator · What you actually keep.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Take-Home Calculator · Tax Year 2026",
    description:
      "What you actually keep — 2026 federal, state, FICA, and supplemental-wage withholding.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
