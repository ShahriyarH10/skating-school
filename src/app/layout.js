import { Inter } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Online Skating School",
    template: "%s · Online Skating School",
  },
  description: "Bangladesh's leading roller skating academy — professional coaching for ages 3+",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Skating School",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0891B2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <PWARegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
