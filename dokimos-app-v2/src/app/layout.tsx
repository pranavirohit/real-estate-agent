import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
/** Same-directory import: most reliable for Next.js PostCSS/Tailwind pipeline (avoid alias resolution quirks). */
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { DokimosAppProvider } from "@/contexts/DokimosAppContext";

const geistSans = GeistSans;
const geistMono = GeistMono;

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

/** Plaid uses proprietary Cern; Plus Jakarta Sans matches the geometric marketing feel closely. */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dokimos - Identity Verification Vault",
  description: "Verify once. Share everywhere.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f9fafb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${plusJakarta.variable} font-sans antialiased`}
    >
      <body
        className={`${geistSans.className} flex h-full min-h-[100dvh] flex-col bg-[var(--dokimos-bg-secondary)] font-sans text-[var(--dokimos-text-primary)]`}
      >
        <SessionProvider>
          <DokimosAppProvider>{children}</DokimosAppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
