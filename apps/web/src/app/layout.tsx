import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Estúdio Criativo" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav><strong>Estúdio Criativo</strong><Link href="/">Painel</Link><Link href="/perfis">Perfis</Link></nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
