import { Inter } from "next/font/google";
import "./eigen-landing.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-eigen-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function EigenLandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} eigen-landing-root`} suppressHydrationWarning>
      {children}
    </div>
  );
}
