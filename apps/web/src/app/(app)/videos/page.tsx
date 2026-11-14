import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roteiros, versoesVideo, videos } from "@estudio/db";
import { db } from "@/lib/db";
import { ESTILOS_INFO } from "@/lib/estilos";
import { PageHead } from "../PageHead";

export const dynamic = "force-dynamic";

async function criar(form: FormData) {
  "use server";
  const d = db();
  const roteiroId = Number(form.get("roteiroId"));
  const r = d.select().from(roteiros).all().find((x) => x.id === roteiroId);
  if (!r) return;
  const estilo = ESTILOS_INFO.some((e) => e.id === form.get("estilo")) ? String(form.get("estilo")) : "classico";
  const v = d.insert(videos).values({ roteiroId, titulo: r.titulo, estilo }).returning().get();
  d.insert(versoesVideo).values({ videoId: v.id, numero: 1 }).run();
  redirect(`/videos/${v.id}`);
}

export default function Videos() {
  const d = db();
  const rs = d.select().from(roteiros).all().filter((r) => r.texto.trim());
  const vs = d.select().from(videos).orderBy(desc(videos.id)).all();
  const todasVersoes = d.select().from(versoesVideo).all();
  return (
    <>
      <PageHead titulo="Vídeos" descricao="Transforme um roteiro em narração, cenas animadas e um MP4 vertical." />
      {rs.length === 0 ? (
        <div className="vazio" style={{ marginBottom: 20 }}><strong>Nenhum roteiro com texto</strong>Escreva um roteiro primeiro. <Link href="/roteiros" style={{ textDecoration: "underline" }}>Ir para Roteiros</Link></div>
      ) : (
        <form action={criar} className="card linha" style={{ alignItems: "flex-end" }}>
          <label className="grow" style={{ margin: 0 }}>Roteiro
            <select name="roteiroId" style={{ marginBottom: 0 }}>{rs.map((r) => <option key={r.id} value={r.id}>{r.titulo}</option>)}</select>
          </label>
          <label style={{ margin: 0, minWidth: 180 }}>Estilo
            <select name="estilo" style={{ marginBottom: 0 }}>{ESTILOS_INFO.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
          </label>
          <button>Criar vídeo</button>
        </form>
      )}
      <h2>Seus vídeos</h2>
      {vs.length === 0 ? (
        <div className="vazio"><strong>Nenhum vídeo ainda</strong>Escolha um roteiro acima para começar.</div>
      ) : (
        <>
          <div className="cab"><span className="grow">Título</span><span style={{ width: 130 }}>Origem</span><span style={{ width: 70 }}>Versões</span><span style={{ width: 70 }}>Duração</span></div>
          <div className="lista" style={{ borderTop: 0 }}>
            {vs.map((v) => {
              const vers = todasVersoes.filter((x) => x.videoId === v.id);
              const ultima = [...vers].sort((a, b) => b.numero - a.numero).find((x) => x.duracao);
              return (
                <Link key={v.id} href={`/videos/${v.id}`}>
                  <span className="grow titulo">{v.titulo}</span>
                  <span style={{ width: 130 }}>{v.composicao ? <span className="etiqueta">{v.composicao}</span> : <span className="mudo pequeno">Gerado no sistema</span>}</span>
                  <span className="mono mudo" style={{ width: 70 }}>{vers.length}</span>
                  <span className="mono mudo" style={{ width: 70 }}>{ultima?.duracao ? `${ultima.duracao.toFixed(1)} s` : "–"}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
