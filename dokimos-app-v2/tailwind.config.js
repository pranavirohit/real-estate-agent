/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dokimos: {
          navy: "#0F1B4C",
          /** Consumer canvas — warm gray */
          canvas: "#F9FAFB",
          /**
           * Product UI canvas (onboarding, /app/*) — aligns with marketing landing stone.
           */
          productCanvas: "#FAFAF9",
          /** Shared core black */
          core: "#1A1A1A",
          /**
           * Primary accent — teal (Plaid-style marketing + consumer journey).
           */
          accent: "#0d9488",
          accentHover: "#0f766e",
          accentPressed: "#115e59",
          /** Surfaces tinted with accent (selected row, soft panels) */
          accentSoft: "#f0fdfa",
          accentTint: "#ccfbf1",
          /** Consumer vs verifier success greens */
          successWarm: "#059669",
          successCool: "#10B981",
        },
      },
      fontFamily: {
        /** Plaid-style marketing (see Plus Jakarta in root layout) */
        landing: [
          "var(--font-landing-sans)",
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "monospace",
        ],
        serif: [
          "var(--font-instrument-serif)",
          "Instrument Serif",
          "Georgia",
          "serif",
        ],
      },
    },
  },
  plugins: [],
}
