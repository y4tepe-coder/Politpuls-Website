import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Display = Bricolage Grotesque · Body = Schibsted Grotesk · Mono = JetBrains Mono */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Politpuls — Politik. Spielen. Verstehen.",
  description:
    "Politpuls erklärt Tagespolitik als kurzen, spielerischen Entscheidungs-Loop: verstehen, Rolle einnehmen, entscheiden, Folgen sehen.",
  applicationName: "Politpuls",
  appleWebApp: { capable: true, title: "Politpuls", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1F1D17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
