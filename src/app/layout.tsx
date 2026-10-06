import type { Metadata, Viewport } from "next";
import { Epilogue, Geist, Geist_Mono } from "next/font/google";

import { AppHeader } from "./_components/AppHeader";
import { MobileTabBar } from "./_components/MobileTabBar";
import { Providers } from "./_components/Providers";
import { SiteFooter } from "./_components/SiteFooter";
import "./globals.css";

// Citrus Talent's typeface, for display type: geometric, confident, theirs (ADR-028).
const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Citrus Talent Studio: real talent, AI-made ads",
    template: "%s · Citrus Talent Studio",
  },
  description:
    "Brief an ad, cast a real creator from Citrus Talent's roster, compare three storyboarded concepts and get a finished ad. Every talent signed a release.",
  applicationName: "Citrus Talent Studio",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${epilogue.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <AppHeader />
          {/* The skip link's target. */}
          <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </div>
          <SiteFooter />
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
