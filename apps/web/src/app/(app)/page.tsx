import Link from "next/link";
import { desc } from "drizzle-orm";
import { notificacoes, roteiros, versoesVideo, videos } from "@estudio/db";
import { db } from "@/lib/db";
import { PageHead } from "./PageHead";

export const dynamic = "force-dynamic";

export default function Painel() {
  const d = db();
  const nRot = d.select().from(roteiros).all().length;
  const nVid = d.select().from(videos).all().length;
  const prontos = d.select().from(versoesVideo).all().filter((v) => v.status === "pronto").length;
  const avisos = d.select().from(notificacoes).orderBy(desc(notificacoes.id)).limit(5).all();
  const stats: [string, number, string][] = [["Roteiros", nRot, "/roteiros"], ["Vídeos", nVid, "/videos"], ["Versões renderizadas", prontos, "/videos"]];
  return (
    <>
      <PageHead titulo="Painel" descricao="Visão geral da produção. Métricas de views e agendamento chegam nas próximas fases." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
        {stats.map(([nome, n, href]) => (
          <Link key={nome} href={href} className="card" style={{ display: "block", marginBottom: 0 }}>
            <div className="mudo">{nome}</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 2 }} className="mono">{n}</div>
          </Link>
        ))}
      </div>
      <h2>Avisos</h2>
      {avisos.length === 0 ? (
        <div className="vazio"><strong>Nenhum aviso</strong>Renders concluídos e falhas da IA aparecem aqui.</div>
      ) : (
        <div className="lista">{avisos.map((a) => <div key={a.id}><div><div>{a.titulo}</div><div className="mudo pequeno">{a.mensagem}</div></div></div>)}</div>
      )}
    </>
  );
}
