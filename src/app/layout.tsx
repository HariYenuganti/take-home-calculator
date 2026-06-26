import type { Metadata, Viewport } from "next";
import {
  Instrument_Serif,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--ff-serif",
  display: "swap",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--ff-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e3b2e" },
    { media: "(prefers-color-scheme: dark)", color: "#14120d" },
  ],
};

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
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          // Set the theme before paint to avoid a flash: explicit choice from
          // localStorage, else the OS preference.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
