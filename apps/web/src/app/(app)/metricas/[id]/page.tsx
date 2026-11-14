import { desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Rede } from "@estudio/redes";
import { contasSociais, metricasSnapshot, publicacoes, videos } from "@estudio/db";
import { db } from "@/lib/db";
import { fmt, fmtPct, fmtTempo } from "@/lib/metricas";
import { NOMES_REDE } from "@/lib/redes";
import { PageHead } from "../../PageHead";
import { Grafico } from "../Grafico";

export const dynamic = "force-dynamic";
const n = (v: FormDataEntryValue | null) => (String(v ?? "").trim() === "" ? null : Number(String(v).replace(",", ".")));

export default async function Publicacao({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = db();
  const pub = d.select().from(publicacoes).where(eq(publicacoes.id, id)).get();
  if (!pub) notFound();
  const conta = d.select().from(contasSociais).where(eq(contasSociais.id, pub.contaId)).get();
  const snaps = d.select().from(metricasSnapshot).where(eq(metricasSnapshot.publicacaoId, id)).orderBy(desc(metricasSnapshot.coletadoEm)).all();
  const vs = d.select().from(videos).all();
  const serie = [...snaps].reverse().map((s) => ({ x: s.coletadoEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), y: s.views }));

  async function snapshotManual(form: FormData) {
    "use server";
    db().insert(metricasSnapshot).values({ publicacaoId: id, views: n(form.get("views")) ?? 0, curtidas: n(form.get("curtidas")) ?? 0, comentarios: n(form.get("comentarios")) ?? 0, compartilhamentos: n(form.get("compartilhamentos")) ?? 0, salvamentos: n(form.get("salvamentos")) ?? 0, alcance: n(form.get("alcance")), tempoMedio: n(form.get("tempo")), retencao: n(form.get("retencao")), fonte: "manual" }).run();
    revalidatePath(`/metricas/${id}`);
  }
  async function vincular(form: FormData) {
    "use server";
    db().update(publicacoes).set({ videoId: Number(form.get("videoId")) || null }).where(eq(publicacoes.id, id)).run();
    revalidatePath(`/metricas/${id}`);
  }
  async function excluir() { "use server"; db().delete(publicacoes).where(eq(publicacoes.id, id)).run(); redirect("/metricas"); }

  return (
    <>
      <PageHead titulo={pub.titulo || "(sem título)"} descricao={<span className="mono">{NOMES_REDE[pub.rede as Rede]} · {conta?.nomeExibicao}{pub.publicadoEm ? ` · publicado em ${pub.publicadoEm.toLocaleDateString("pt-BR")}` : ""}</span>}>
        {pub.url && <a href={pub.url} target="_blank" rel="noreferrer" className="btn sec">Abrir na rede</a>}
        <a href="/metricas" className="btn sec">Todas as métricas</a>
      </PageHead>

      <h2 style={{ marginTop: 0 }}>Views ao longo do tempo</h2>
      {snaps.length < 2 ? <p className="mudo">O gráfico aparece a partir da segunda coleta. Hoje há {snaps.length}.</p> : <Grafico pontos={serie} rotulo="Views por coleta" />}

      <h2>Histórico de coletas</h2>
      {snaps.length === 0 ? (
        <div className="vazio"><strong>Sem coletas</strong>Lance os números abaixo ou conecte a conta.</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}><div style={{ minWidth: 760 }}>
          <div className="cab"><span style={{ width: 150 }}>Coleta</span><span style={{ width: 70, textAlign: "right" }}>Views</span><span style={{ width: 60, textAlign: "right" }}>Curt.</span><span style={{ width: 70, textAlign: "right" }}>Coment.</span><span style={{ width: 70, textAlign: "right" }}>Compart.</span><span style={{ width: 56, textAlign: "right" }}>Salv.</span><span style={{ width: 70, textAlign: "right" }}>Alcance</span><span style={{ width: 56, textAlign: "right" }}>Tempo</span><span style={{ width: 50, textAlign: "right" }}>Ret.</span><span className="grow" style={{ textAlign: "right" }}>Fonte</span></div>
          <div className="lista" style={{ borderTop: 0 }}>
            {snaps.slice(0, 40).map((s) => (
              <div key={s.id}>
                <span className="mono" style={{ width: 150 }}>{s.coletadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                {[fmt(s.views), fmt(s.curtidas), fmt(s.comentarios), fmt(s.compartilhamentos), fmt(s.salvamentos), fmt(s.alcance), fmtTempo(s.tempoMedio), fmtPct(s.retencao)].map((v, i) => <span key={i} className="mono" style={{ width: [70, 60, 70, 70, 56, 70, 56, 50][i], textAlign: "right" }}>{v}</span>)}
                <span className="mono mudo grow" style={{ textAlign: "right" }}>{s.fonte}</span>
              </div>
            ))}
          </div>
          </div></div>
        </>
      )}

      <h2>Vídeo do sistema</h2>
      <form action={vincular} className="linha" style={{ alignItems: "flex-end" }}>
        <label className="grow" style={{ margin: 0 }}>Ligar esta publicação a um vídeo feito aqui
          <select name="videoId" defaultValue={pub.videoId ?? ""} style={{ marginBottom: 0 }}><option value="">Nenhum</option>{vs.map((v) => <option key={v.id} value={v.id}>{v.titulo}</option>)}</select>
        </label>
        <button className="sec">Salvar</button>
      </form>

      <h2>Lançar novos números</h2>
      <form action={snapshotManual} className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0 16px" }}>
          {[["views", "Views"], ["curtidas", "Curtidas"], ["comentarios", "Comentários"], ["compartilhamentos", "Compartilhamentos"], ["salvamentos", "Salvamentos"], ["alcance", "Alcance"], ["tempo", "Tempo médio (s)"], ["retencao", "Retenção (%)"]].map(([k, nome]) => <label key={k}>{nome}<input name={k} type="number" step="any" min="0" /></label>)}
        </div>
        <div className="linha" style={{ justifyContent: "space-between" }}>
          <button>Adicionar ao histórico</button>
        </div>
      </form>
      <form action={excluir} style={{ marginTop: 24 }}><button className="perigo">Excluir publicação e histórico</button></form>
    </>
  );
}
