import "./globals.css";
import { Instrument_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--fonte-display", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--fonte-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono", display: "swap" });

export const metadata = { title: "Estúdio Criativo" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
