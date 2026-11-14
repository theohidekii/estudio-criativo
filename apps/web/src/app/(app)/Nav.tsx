"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ic = (d: string) => <svg viewBox="0 0 16 16" aria-hidden="true"><path d={d} /></svg>;
const GRUPOS: { titulo: string; itens: { href: string; nome: string; icone: ReactNode }[] }[] = [
  { titulo: "Criar", itens: [
    { href: "/ideias", nome: "Ideias", icone: ic("M8 2a4 4 0 0 0-2 7.4V11h4V9.4A4 4 0 0 0 8 2ZM6.5 13.5h3") },
    { href: "/roteiros", nome: "Roteiros", icone: ic("M4 2h6l3 3v9H4V2ZM10 2v3h3M6 8h5M6 11h5") },
    { href: "/videos", nome: "Vídeos", icone: ic("M2 4h8v8H2V4ZM10 7l4-2v6l-4-2") },
  ] },
  { titulo: "Biblioteca", itens: [
    { href: "/perfis", nome: "Perfis", icone: ic("M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 14c.5-3 2.7-4 5.5-4s5 1 5.500 4") },
    { href: "/vozes", nome: "Vozes", icone: ic("M8 2v12M4.500 5v6M11.500 5v6M1.500 7v2M14.500 7v2") },
  ] },
];

export function Nav() {
  const atual = usePathname();
  const ativo = (h: string) => atual === h || atual.startsWith(h + "/");
  return (
    <nav aria-label="Principal">
      <div className="nav">
        <Link href="/" aria-current={atual === "/" ? "page" : undefined}>{ic("M2 7.5 8 2.5l6 5V14H2V7.5ZM6.5 14v-4h3v4")}Painel</Link>
      </div>
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <div className="grupo">{g.titulo}</div>
          <div className="nav">
            {g.itens.map((i) => <Link key={i.href} href={i.href} aria-current={ativo(i.href) ? "page" : undefined}>{i.icone}{i.nome}</Link>)}
          </div>
        </div>
      ))}
    </nav>
  );
}
