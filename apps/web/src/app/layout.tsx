import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

const sans = Geist({ subsets: ["latin"], variable: "--fonte-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--fonte-mono", display: "swap" });

export const metadata = { title: "Estúdio Criativo" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
