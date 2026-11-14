import Link from "next/link";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { agentes } from "@estudio/db";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";
import { Nav } from "./Nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const uid = await usuarioAtual();
  const meus = uid ? db().select().from(agentes).where(eq(agentes.usuarioId, uid)).all() : [];
  const online = meus.some((a) => a.ultimoContato && Date.now() - a.ultimoContato.getTime() < 30000);
  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca"><i aria-hidden="true" />Estúdio Criativo</div>
        <Nav />
        <Link href="/agentes" className="estado" title="O agente roda no seu computador e executa as tarefas de IA">
          <span className={`ponto${online ? " on" : ""}`} />
          <span>{online ? "Agente conectado" : meus.length ? "Agente desconectado" : "Conectar agente"}</span>
        </Link>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  );
}
