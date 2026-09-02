import type { Metadata } from "next";
import { IBM_Plex_Mono, Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["500", "700"],
});

const ibm = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "DEF CON Talk Archive",
    template: "%s — DEF CON Talk Archive",
  },
  description:
    "Searchable archive of DEF CON village talks, with YouTube video and a written summary for every talk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${ibm.variable} font-mono antialiased`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-void focus:px-3 focus:py-2 focus:text-acid"
        >
          Skip to content
        </a>
        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader />
          <main
            id="content"
            className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6"
          >
            {children}
          </main>
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
