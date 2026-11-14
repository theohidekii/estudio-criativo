import "./globals.css";
import { Instrument_Sans, JetBrains_Mono, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

const serif = Newsreader({ subsets: ["latin"], variable: "--fonte-serif", display: "swap", style: ["normal", "italic"] });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--fonte-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono", display: "swap" });

export const metadata = { title: "Estúdio Criativo" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
