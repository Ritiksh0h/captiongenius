import type { Metadata } from "next";
import {
  Staatliches,
  Albert_Sans,
  Montserrat,
  Inter,
  JetBrains_Mono,
  Bricolage_Grotesque,
} from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/providers";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Legacy fonts (used by old components)
const staatliches = Staatliches({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-staatliches",
  weight: ["400"],
});
const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["700"],
});
const albertSans = Albert_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-AlbertSans",
  weight: ["200", "400", "700"],
});

// v0 design-system fonts (Inter substitutes Geist for Next.js 14 compatibility)
const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CaptionGenius — Your photo. Five perfect captions. Three seconds.",
  description:
    "Upload any photo. Pick a vibe. Get captions that don't sound like a robot wrote them.",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${staatliches.variable} ${montserrat.variable} ${albertSans.variable} ${geistSans.variable} ${geistMono.variable} ${bricolage.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers session={session}>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
