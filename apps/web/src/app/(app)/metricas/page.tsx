import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { lerCsv, type Rede } from "@estudio/redes";
import { metricasSnapshot, perfis, publicacoes, videos } from "@estudio/db";
import { db } from "@/lib/db";
import { carregar, fmt, fmtPct, fmtTempo, melhoresHorarios, serieViews, totais } from "@/lib/metricas";
import { NOMES_REDE, REDES, contaManual, salvarColeta } from "@/lib/redes";
import { PageHead } from "../PageHead";
import { Grafico } from "./Grafico";

export const dynamic = "force-dynamic";

const idManual = (rede: string, titulo: string, data: string) => "manual:" + createHash("sha1").update(`${rede}|${titulo}|${data}`).digest("hex").slice(0, 16);
const n = (v: FormDataEntryValue | null) => { const x = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(x) && String(v ?? "").trim() !== "" ? x : null; };

async function adicionarManual(form: FormData) {
  "use server";
  const rede = String(form.get("rede")) as Rede;
  const perfilId = Number(form.get("perfilId"));
  const titulo = String(form.get("titulo") ?? "").trim();
  if (!REDES.includes(rede) || !perfilId || !titulo) return;
  const data = String(form.get("data") ?? "");
  const contaId = contaManual(perfilId, rede);
  salvarColeta(contaId, rede, [{
    publicacao: { idExterno: idManual(rede, titulo, data), titulo, url: String(form.get("url") ?? ""), publicadoEm: data ? new Date(data + "T12:00:00") : null },
    metricas: { views: n(form.get("views")) ?? 0, curtidas: n(form.get("curtidas")) ?? 0, comentarios: n(form.get("comentarios")) ?? 0, compartilhamentos: n(form.get("compartilhamentos")) ?? 0, salvamentos: n(form.get("salvamentos")) ?? 0, alcance: n(form.get("alcance")), tempoMedio: n(form.get("tempo")), retencao: n(form.get("retencao")), seguidoresGanhos: null },
  }], "manual");
  const vid = Number(form.get("videoId"));
  if (vid) db().update(publicacoes).set({ videoId: vid }).where(and(eq(publicacoes.contaId, contaId), eq(publicacoes.idExterno, idManual(rede, titulo, data)))).run();
  revalidatePath("/metricas");
}

async function importarCsv(form: FormData) {
  "use server";
  const perfilId = Number(form.get("perfilId"));
  const arq = form.get("arquivo");
  if (!perfilId || !(arq instanceof File) || arq.size === 0) return;
  const { linhas, erros } = lerCsv(await arq.text());
  for (const l of linhas) {
    const contaId = contaManual(perfilId, l.rede);
    salvarColeta(contaId, l.rede, [{ publicacao: { idExterno: idManual(l.rede, l.titulo, l.publicadoEm?.toISOString().slice(0, 10) ?? ""), titulo: l.titulo, url: l.url, publicadoEm: l.publicadoEm }, metricas: l.metricas }], "manual");
  }
  revalidatePath("/metricas");
  redirect(`/metricas?dias=0&importadas=${linhas.length}${erros.length ? `&avisos=${encodeURIComponent(erros.slice(0, 5).join(" | "))}` : ""}`);
}

export default async function Metricas({ searchParams }: { searchParams: Promise<{ perfil?: string; dias?: string; importadas?: string; avisos?: string }> }) {
  const sp = await searchParams;
  const d = db();
  const ps = d.select().from(perfis).all();
  const vs = d.select().from(videos).all();
  const dias = ["7", "30", "90", "0"].includes(sp.dias ?? "") ? Number(sp.dias) : 30;
  const perfilId = Number(sp.perfil) || undefined;
  const { linhas, snaps } = carregar({ perfilId, desde: dias ? new Date(Date.now() - dias * 864e5) : undefined });
  const t = totais(linhas);
  const serie = serieViews(linhas, snaps, Math.min(dias || 90, 90));
  const ranking = [...linhas].sort((a, b) => (b.m?.views ?? 0) - (a.m?.views ?? 0)).slice(0, 15);
  const horarios = melhoresHorarios(linhas);
  const maxRede = Math.max(1, ...t.porRede.map(([, v]) => v));
  return (
    <>
      <PageHead titulo="Métricas" descricao="Views e engajamento de tudo o que foi publicado, somando as redes. Os números vêm das contas conectadas ou de lançamentos manuais.">
        <Link href="/contas" className="btn sec">Contas</Link>
      </PageHead>

      {sp.importadas && <div className={`aviso ${sp.avisos ? "" : "ok"}`} role="status">{sp.importadas} linha(s) importada(s).{sp.avisos && <> Não importei: {sp.avisos}</>}</div>}

      <form method="get" className="linha" style={{ marginBottom: 28, alignItems: "flex-end" }}>
        <label style={{ margin: 0 }}>Perfil
          <select name="perfil" defaultValue={perfilId ?? ""} style={{ marginBottom: 0, minWidth: 200 }}><option value="">Todos</option>{ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
        </label>
        <label style={{ margin: 0 }}>Publicados nos últimos
          <select name="dias" defaultValue={String(dias)} style={{ marginBottom: 0 }}><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="0">Todo o período</option></select>
        </label>
        <button className="sec">Filtrar</button>
      </form>

      {t.publicacoes === 0 ? (
        <div className="vazio">
          <strong>Ainda não há publicações para medir</strong>
          Conecte uma rede em <Link href="/contas" style={{ textDecoration: "underline" }}>Contas</Link> (a coleta traz os vídeos antigos e começa o histórico) ou lance os números à mão logo abaixo.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 0, borderTop: "1px solid var(--linha)", borderBottom: "1px solid var(--linha)", marginBottom: 28 }}>
            {([["Views", t.views], ["Curtidas", t.curtidas], ["Comentários", t.comentarios], ["Compartilhamentos", t.compartilhamentos], ["Salvamentos", t.salvamentos], ["Publicações", t.publicacoes]] as const).map(([nome, v]) => (
              <div key={nome} style={{ padding: "16px 0" }}><div className="mudo pequeno">{nome}</div><div className="mono" style={{ fontSize: 24, fontWeight: 500, color: "var(--txt)" }}>{fmt(v)}</div></div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 36, alignItems: "start" }}>
            <section>
              <h2 style={{ marginTop: 0 }}>Views ao longo do tempo</h2>
              <Grafico pontos={serie} rotulo="Total de views por dia" />
              <p className="mudo pequeno">Soma do último valor coletado de cada publicação. O histórico começa na primeira coleta.</p>
            </section>
            <section>
              <h2 style={{ marginTop: 0 }}>Por rede</h2>
              {t.porRede.map(([rede, v]) => (
                <div key={rede} style={{ marginBottom: 14 }}>
                  <div className="linha" style={{ justifyContent: "space-between" }}><span>{NOMES_REDE[rede as Rede]}</span><span className="mono">{fmt(v)}</span></div>
                  <div style={{ height: 6, background: "var(--linha)", marginTop: 6 }}><div style={{ width: `${(v / maxRede) * 100}%`, height: "100%", background: "var(--acento)" }} /></div>
                </div>
              ))}
            </section>
          </div>

          <h2>Onde cada vídeo foi melhor</h2>
          <div style={{ overflowX: "auto" }}><div style={{ minWidth: 900 }}>
          <div className="cab"><span className="grow" style={{ minWidth: 220 }}>Publicação</span><span style={{ width: 84 }}>Rede</span><span style={{ width: 80, textAlign: "right" }}>Views</span><span style={{ width: 64, textAlign: "right" }}>Curt.</span><span style={{ width: 64, textAlign: "right" }}>Coment.</span><span style={{ width: 64, textAlign: "right" }}>Compart.</span><span style={{ width: 64, textAlign: "right" }}>Salv.</span><span style={{ width: 64, textAlign: "right" }}>Tempo</span><span style={{ width: 56, textAlign: "right" }}>Ret.</span></div>
          <div className="lista" style={{ borderTop: 0 }}>
            {ranking.map((l) => (
              <Link key={l.id} href={`/metricas/${l.id}`}>
                <span className="grow titulo" style={{ minWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.titulo || "(sem título)"}</span>
                <span className="mudo pequeno" style={{ width: 84 }}>{NOMES_REDE[l.rede as Rede]}</span>
                <span className="mono" style={{ width: 80, textAlign: "right" }}>{fmt(l.m?.views)}</span>
                <span className="mono mudo" style={{ width: 64, textAlign: "right" }}>{fmt(l.m?.curtidas)}</span>
                <span className="mono mudo" style={{ width: 64, textAlign: "right" }}>{fmt(l.m?.comentarios)}</span>
                <span className="mono mudo" style={{ width: 64, textAlign: "right" }}>{fmt(l.m?.compartilhamentos)}</span>
                <span className="mono mudo" style={{ width: 64, textAlign: "right" }}>{fmt(l.m?.salvamentos)}</span>
                <span className="mono mudo" style={{ width: 64, textAlign: "right" }}>{fmtTempo(l.m?.tempoMedio)}</span>
                <span className="mono mudo" style={{ width: 56, textAlign: "right" }}>{fmtPct(l.m?.retencao)}</span>
              </Link>
            ))}
          </div>
          </div></div>

          <h2>Melhores dias e horários</h2>
          {!horarios.suficiente ? (
            <div className="vazio"><strong>Dados insuficientes</strong>São necessárias ao menos 8 publicações com data para sugerir horários. Hoje há {horarios.total}.</div>
          ) : (
            <div className="linha" style={{ gap: 40, alignItems: "flex-start" }}>
              <div><div className="mudo pequeno">Dias da semana (média de views)</div>{horarios.dias.map((x) => <div key={x.k}><span style={{ textTransform: "capitalize" }}>{x.k}</span> <span className="mono mudo">{fmt(Math.round(x.media))} · {x.n} posts</span></div>)}</div>
              <div><div className="mudo pequeno">Faixas de horário</div>{horarios.horas.map((x) => <div key={x.k}>{x.k} <span className="mono mudo">{fmt(Math.round(x.media))} · {x.n} posts</span></div>)}</div>
            </div>
          )}
        </>
      )}

      <h2>Lançar à mão</h2>
      <details className="card">
        <summary>Adicionar uma publicação com seus números</summary>
        <form action={adicionarManual}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 16px" }}>
            <label>Perfil<select name="perfilId">{ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            <label>Rede<select name="rede">{REDES.map((r) => <option key={r} value={r}>{NOMES_REDE[r]}</option>)}</select></label>
            <label>Título<input name="titulo" required /></label>
            <label>Endereço (URL)<input name="url" placeholder="https://…" /></label>
            <label>Data de publicação<input name="data" type="date" /></label>
            <label>Vídeo do sistema<select name="videoId"><option value="">Nenhum</option>{vs.map((v) => <option key={v.id} value={v.id}>{v.titulo}</option>)}</select></label>
            {[["views", "Views"], ["curtidas", "Curtidas"], ["comentarios", "Comentários"], ["compartilhamentos", "Compartilhamentos"], ["salvamentos", "Salvamentos"], ["alcance", "Alcance"], ["tempo", "Tempo médio (s)"], ["retencao", "Retenção (%)"]].map(([k, nome]) => <label key={k}>{nome}<input name={k} type="number" step="any" min="0" /></label>)}
          </div>
          <button>Salvar publicação</button>
        </form>
      </details>
      <details className="card">
        <summary>Importar uma planilha (CSV)</summary>
        <form action={importarCsv}>
          <label>Perfil<select name="perfilId">{ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
          <label>Arquivo .csv<input name="arquivo" type="file" accept=".csv,text/csv" required /></label>
          <p className="mudo pequeno">Colunas: rede, titulo, url, data, views, curtidas, comentarios, compartilhamentos, salvamentos, alcance, tempo_medio, retencao. Aceita vírgula ou ponto e vírgula. Importar de novo o mesmo título e data soma um novo ponto ao histórico em vez de duplicar.</p>
          <button className="sec">Importar</button>
        </form>
      </details>
    </>
  );
}
