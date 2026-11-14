"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GRUPOS: { titulo: string; itens: { href: string; nome: string; n?: string }[] }[] = [
  { titulo: "Produção", itens: [
    { href: "/ideias", nome: "Ideias", n: "1" },
    { href: "/roteiros", nome: "Roteiros", n: "2" },
    { href: "/videos", nome: "Vídeos", n: "3" },
    { href: "/studio", nome: "Editor", n: "4" },
  ] },
  { titulo: "Publicar e medir", itens: [
    { href: "/agendamento", nome: "Agendamento" },
    { href: "/metricas", nome: "Métricas" },
  ] },
  { titulo: "Biblioteca", itens: [
    { href: "/perfis", nome: "Perfis" },
    { href: "/vozes", nome: "Vozes" },
    { href: "/estilos", nome: "Estilos" },
    { href: "/contas", nome: "Contas" },
  ] },
];

export function Nav() {
  const atual = usePathname();
  const ativo = (h: string) => atual === h || atual.startsWith(h + "/");
  return (
    <nav aria-label="Principal">
      <div className="nav">
        <Link href="/" aria-current={atual === "/" ? "page" : undefined}><span className="n" />Painel</Link>
      </div>
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <div className="grupo">{g.titulo}</div>
          <div className="nav">
            {g.itens.map((i) => <Link key={i.href} href={i.href} aria-current={ativo(i.href) ? "page" : undefined}><span className="n">{i.n}</span>{i.nome}</Link>)}
          </div>
        </div>
      ))}
    </nav>
  );
}
