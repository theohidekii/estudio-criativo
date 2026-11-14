import Link from "next/link";
import { desc } from "drizzle-orm";
import { notificacoes, roteiros, series, versoesVideo, videos } from "@estudio/db";
import { db } from "@/lib/db";
import { PageHead } from "./PageHead";
import { ETAPAS, NOME_ETAPA, Trilha } from "./Trilha";

export const dynamic = "force-dynamic";

export default function Painel() {
  const d = db();
  const todos = d.select().from(roteiros).all();
  const nVid = d.select().from(videos).all().length;
  const prontos = d.select().from(versoesVideo).all().filter((v) => v.status === "pronto").length;
  const avisos = d.select().from(notificacoes).orderBy(desc(notificacoes.id)).limit(6).all();
  const serie = new Map(d.select().from(series).all().map((s) => [s.id, s.nome]));
  const emProducao = todos.filter((r) => r.etapa !== "publicado").sort((a, b) => ETAPAS.indexOf(b.etapa) - ETAPAS.indexOf(a.etapa)).slice(0, 8);
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", ".");
  return (
    <>
      <PageHead slate={hoje} titulo="Painel" descricao={<><span className="mono">{todos.length}</span> roteiros, <span className="mono">{nVid}</span> vídeos e <span className="mono">{prontos}</span> versões renderizadas. Métricas de views e agendamento entram nas próximas fases.</>} />

      <h2 style={{ marginTop: 0 }}>Em produção</h2>
      {emProducao.length === 0 ? (
        <div className="vazio"><strong>Nada em produção</strong>Crie um roteiro para ele aparecer aqui, com a trilha da etapa em que está.</div>
      ) : (
        <div className="lista">
          {emProducao.map((r) => (
            <Link key={r.id} href={`/roteiros/${r.id}`}>
              <span className="grow"><span className="titulo">{r.titulo}</span>{r.serieId && <span className="mudo pequeno"> · {serie.get(r.serieId)}</span>}</span>
              <span className="mudo pequeno">{NOME_ETAPA[r.etapa]}</span>
              <Trilha etapa={r.etapa} />
            </Link>
          ))}
        </div>
      )}

      <h2>Avisos</h2>
      {avisos.length === 0 ? (
        <div className="vazio"><strong>Nenhum aviso</strong>Renders concluídos e falhas da IA aparecem aqui.</div>
      ) : (
        <div className="lista">{avisos.map((a) => <div key={a.id}><span className="grow"><span className="titulo">{a.titulo}</span><span className="mudo pequeno"> · {a.mensagem}</span></span></div>)}</div>
      )}
    </>
  );
}
