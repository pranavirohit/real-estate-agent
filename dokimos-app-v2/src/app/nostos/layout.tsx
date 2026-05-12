import type { ReactNode } from "react";
import { Hedvig_Letters_Serif } from "next/font/google";

const hedvig = Hedvig_Letters_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-nostos-serif",
  display: "swap",
});

export const metadata = {
  title: "Nostos — NYC rentals, tours, and applications",
  description:
    "Find apartments in New York, coordinate tours with help from an assistant, and apply when you are ready. Identity verified once with EigenCloud-backed proof for landlords.",
};

export default function NostosLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`nostos-shell ${hedvig.variable} min-h-dvh`}
      style={
        {
          "--nostos-canvas": "#F7F5F2",
          "--nostos-surface": "#FFFFFF",
          "--nostos-ink": "#1C1917",
          "--nostos-ink-secondary": "#57534E",
          "--nostos-muted": "#A8A29E",
          "--nostos-accent": "#C2410C",
          "--nostos-accent-hover": "#9A3412",
          "--nostos-accent-soft": "#FFF7ED",
          "--nostos-border": "#E7E5E4",
          "--nostos-border-strong": "#D6D3D1",
          background: "var(--nostos-canvas)",
          color: "var(--nostos-ink)",
          fontFamily: "var(--font-landing-sans), system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
