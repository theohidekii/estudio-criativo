import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Estúdio Criativo" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav><strong>Estúdio Criativo</strong><Link href="/">Painel</Link><Link href="/perfis">Perfis</Link><Link href="/ideias">Ideias</Link><Link href="/agentes">Agente local</Link></nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
