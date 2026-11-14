import { and, asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Rede } from "@estudio/redes";
import { contasSociais, perfis, posts, postsRede, versoesVideo, videos } from "@estudio/db";
import { cancelarPost, LIMITE_LEGENDA, processarPendentes, publicaAutomatico, publicarAgora, tentarDeNovo } from "@/lib/agendador";
import { db } from "@/lib/db";
import { carregar, melhoresHorarios } from "@/lib/metricas";
import { NOMES_REDE } from "@/lib/redes";
import { PageHead } from "../PageHead";
import Atualizar from "../ideias/[id]/Atualizar";

export const dynamic = "force-dynamic";

const ROTULO: Record<string, string> = { agendado: "Agendado", publicando: "Publicando", concluido: "Publicado", parcial: "Parcial", falhou: "Falhou", cancelado: "Cancelado", pendente: "Aguardando" };
const COR: Record<string, string> = { agendado: "var(--acento)", publicando: "var(--aviso)", concluido: "var(--ok)", parcial: "var(--aviso)", falhou: "var(--erro)", cancelado: "var(--mudo)", pendente: "var(--acento)" };
const agendadorLigado = () => process.env.AGENDADOR_AUTOMATICO === "1";

async function criar(form: FormData) {
  "use server";
  const d = db();
  const versaoId = Number(form.get("versaoId"));
  const legendaBase = String(form.get("legenda") ?? "").trim();
  const contasMarcadas = form.getAll("conta").map(Number).filter(Boolean);
  const agora = form.get("agora") === "on";
  const quando = agora ? new Date() : new Date(String(form.get("quando") ?? ""));
  const volta = (k: "ok" | "erro", m: string) => redirect(`/agendamento?${k}=${encodeURIComponent(m)}`);
  if (!versaoId || !d.select().from(versoesVideo).where(eq(versoesVideo.id, versaoId)).get()) return volta("erro", "Escolha um vídeo renderizado.");
  if (contasMarcadas.length === 0) return volta("erro", "Marque ao menos uma rede.");
  if (!agora && (isNaN(+quando) || +quando < Date.now() - 60_000)) return volta("erro", "Escolha uma data e hora futuras, ou marque Publicar agora.");
  for (const cid of contasMarcadas) {
    const c = d.select().from(contasSociais).where(eq(contasSociais.id, cid)).get();
    const texto = String(form.get(`legenda_${cid}`) ?? "").trim() || legendaBase;
    if (c && texto.length > LIMITE_LEGENDA[c.rede as Rede]) return volta("erro", `A legenda passa do limite de ${LIMITE_LEGENDA[c.rede as Rede]} caracteres do ${NOMES_REDE[c.rede as Rede]}.`);
  }
  const p = d.insert(posts).values({ versaoId, legendaBase, agendadoPara: quando }).returning().get();
  for (const cid of contasMarcadas) {
    const c = d.select().from(contasSociais).where(eq(contasSociais.id, cid)).get();
    if (!c) continue;
    const priv = String(form.get(`priv_${cid}`));
    d.insert(postsRede).values({
      postId: p.id, contaId: cid, rede: c.rede, legenda: String(form.get(`legenda_${cid}`) ?? "").trim() || null,
      titulo: String(form.get(`titulo_${cid}`) ?? "").trim() || null, privacidade: ["private", "unlisted", "public"].includes(priv) ? (priv as "private") : "private",
    }).run();
  }
  if (agora) void processarPendentes(); // em segundo plano: o envio pode levar minutos
  revalidatePath("/agendamento");
  volta("ok", agora ? "Publicação iniciada. Acompanhe o andamento abaixo." : `Post agendado para ${quando.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`);
}
async function agoraAcao(form: FormData) { "use server"; void publicarAgora(Number(form.get("id"))); redirect("/agendamento?ok=" + encodeURIComponent("Publicação iniciada.")); }
async function tentarAcao(form: FormData) { "use server"; void tentarDeNovo(Number(form.get("id"))); redirect("/agendamento?ok=" + encodeURIComponent("Nova tentativa iniciada.")); }
async function cancelarAcao(form: FormData) {
  "use server";
  const ok = cancelarPost(Number(form.get("id")));
  redirect("/agendamento?" + (ok ? "ok=" + encodeURIComponent("Post cancelado.") : "erro=" + encodeURIComponent("Este post já está publicando ou já publicou em alguma rede.")));
}
async function excluirAcao(form: FormData) {
  "use server";
  const id = Number(form.get("id"));
  const p = db().select().from(posts).where(eq(posts.id, id)).get();
  if (p && p.status !== "publicando") db().delete(posts).where(eq(posts.id, id)).run();
  revalidatePath("/agendamento");
}

const pad = (n: number) => String(n).padStart(2, "0");
const paraInput = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export default async function Agendamento({ searchParams }: { searchParams: Promise<{ mes?: string; ok?: string; erro?: string }> }) {
  const sp = await searchParams;
  const d = db();
  const hoje = new Date();
  const [ano, mes0] = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes!.split("-").map(Number) : [hoje.getFullYear(), hoje.getMonth() + 1];
  const primeiro = new Date(ano, mes0 - 1, 1), ultimoDia = new Date(ano, mes0, 0).getDate();
  const nav = (delta: number) => { const x = new Date(ano, mes0 - 1 + delta, 1); return `/agendamento?mes=${x.getFullYear()}-${pad(x.getMonth() + 1)}`; };

  const todosPosts = d.select().from(posts).orderBy(desc(posts.agendadoPara)).all();
  const destinos = d.select().from(postsRede).all();
  const versoes = d.select().from(versoesVideo).all();
  const vids = new Map(d.select().from(videos).all().map((v) => [v.id, v]));
  const contas = d.select().from(contasSociais).all();
  const nomePerfil = new Map(d.select().from(perfis).all().map((p) => [p.id, p.nome]));
  const prontas = versoes.filter((v) => v.status === "pronto");
  const tituloPost = (versaoId: number) => { const v = versoes.find((x) => x.id === versaoId); const vd = v ? vids.get(v.videoId) : undefined; return vd ? `${vd.titulo} · v${v!.numero}` : "Vídeo"; };
  const ativo = todosPosts.some((p) => p.status === "publicando");

  const h = melhoresHorarios(carregar().linhas);
  let sugestao = new Date(Date.now() + 3_600_000); sugestao.setMinutes(0, 0, 0);
  let textoSugestao = "Ainda não há dados suficientes para sugerir o melhor horário (precisa de 8 publicações com data na página Métricas).";
  if (h.suficiente && h.horas[0] && h.dias[0]) {
    const dia = DIAS_SEMANA.indexOf(h.dias[0].k), inicio = parseInt(h.horas[0].k);
    const alvo = new Date(); alvo.setHours(inicio + 1, 0, 0, 0);
    while (alvo.getDay() !== dia || +alvo < Date.now()) alvo.setDate(alvo.getDate() + 1);
    sugestao = alvo;
    textoSugestao = `Melhor momento nos seus dados: ${h.dias[0].k}, entre ${h.horas[0].k} (média de ${Math.round(h.dias[0].media).toLocaleString("pt-BR")} views). O campo abaixo já vem com a próxima ocorrência.`;
  }

  const postsDoMes = todosPosts.filter((p) => p.agendadoPara.getFullYear() === ano && p.agendadoPara.getMonth() === mes0 - 1);
  const celulas: (number | null)[] = [...Array(primeiro.getDay()).fill(null), ...Array.from({ length: ultimoDia }, (_, i) => i + 1)];
  while (celulas.length % 7) celulas.push(null);

  return (
    <>
      <PageHead titulo="Agendamento" descricao="Programe o mesmo vídeo para várias redes de uma vez, com a legenda comum ou uma própria para cada conta.">
        <span className={`etiqueta${agendadorLigado() ? " acento" : ""}`} title="Defina AGENDADOR_AUTOMATICO=1 no .env.local para publicar na hora marcada">{agendadorLigado() ? "Agendador ligado" : "Agendador desligado"}</span>
      </PageHead>
      {sp.ok && <div className="aviso ok" role="status">{sp.ok}</div>}
      {sp.erro && <div className="aviso erro" role="alert">{sp.erro}</div>}
      {!agendadorLigado() && <div className="aviso">O agendador automático está desligado, então os posts só saem com o botão <strong>Publicar agora</strong>. Para publicar na hora marcada, defina <code>AGENDADOR_AUTOMATICO=1</code> no <code>apps/web/.env.local</code> e reinicie o site (o computador precisa ficar ligado).</div>}

      <h2 style={{ marginTop: 0 }}>Novo post</h2>
      {prontas.length === 0 ? (
        <div className="vazio"><strong>Nenhum vídeo renderizado</strong>Renderize um vídeo na página Vídeos para poder agendá-lo.</div>
      ) : (
        <form action={criar} className="card">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 240px", gap: "0 20px" }}>
            <label>Vídeo
              <select name="versaoId">{prontas.map((v) => <option key={v.id} value={v.id}>{tituloPost(v.id)}</option>)}</select>
            </label>
            <label>Quando
              <input name="quando" type="datetime-local" defaultValue={paraInput(sugestao)} />
            </label>
          </div>
          <p className="mudo pequeno" style={{ marginTop: -8 }}>{textoSugestao}</p>
          <label>Legenda comum<textarea name="legenda" rows={4} placeholder="Texto que vai em todas as redes marcadas, com as hashtags." /></label>

          <div className="mudo" style={{ fontSize: 13, marginBottom: 8 }}>Redes</div>
          {contas.filter((c) => c.tokenCriptografado || c.rede === "facebook").length === 0 && <p className="mudo pequeno">Nenhuma conta conectada. Conecte em Contas.</p>}
          <div className="lista" style={{ marginBottom: 18 }}>
            {contas.filter((c) => c.tokenCriptografado).map((c) => {
              const auto = publicaAutomatico(c.rede as Rede);
              return (
                <div key={c.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--txt)", fontSize: 14, minWidth: 240, opacity: auto ? 1 : 0.55 }}>
                    <input type="checkbox" name="conta" value={c.id} disabled={!auto} style={{ margin: 0 }} />
                    <span><strong>{NOMES_REDE[c.rede as Rede]}</strong> · {c.nomeExibicao}<span className="mudo pequeno"> · {nomePerfil.get(c.perfilId)}</span>
                      {!auto && <span className="mudo pequeno"> · poste à mão (automático ainda indisponível)</span>}
                      {c.rede === "tiktok" && <span className="mudo pequeno"> · vai para o rascunho no app</span>}</span>
                  </label>
                  {auto && (
                    <div style={{ flex: 1, minWidth: 260, display: "grid", gridTemplateColumns: c.rede === "youtube" ? "1fr 130px" : "1fr", gap: 10 }}>
                      <input name={`legenda_${c.id}`} placeholder="Legenda própria (opcional)" style={{ margin: 0 }} aria-label={`Legenda própria para ${c.nomeExibicao}`} />
                      {c.rede === "youtube" && <select name={`priv_${c.id}`} style={{ margin: 0 }} aria-label="Privacidade no YouTube"><option value="private">Privado</option><option value="unlisted">Não listado</option><option value="public">Público</option></select>}
                      {c.rede === "youtube" && <input name={`titulo_${c.id}`} placeholder="Título no YouTube (padrão: primeira linha da legenda)" style={{ margin: 0, gridColumn: "1 / -1" }} aria-label="Título no YouTube" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="linha" style={{ justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--txt)", fontSize: 14 }}><input type="checkbox" name="agora" style={{ margin: 0 }} />Publicar agora, ignorando a data</label>
            <button>Agendar post</button>
          </div>
        </form>
      )}

      <div className="linha" style={{ justifyContent: "space-between", margin: "36px 0 12px" }}>
        <h2 style={{ margin: 0 }}>{primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
        <div className="linha"><a href={nav(-1)} className="btn sec peq">Anterior</a><a href="/agendamento" className="btn sec peq">Hoje</a><a href={nav(1)} className="btn sec peq">Próximo</a></div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(96px, 1fr))", minWidth: 700, borderTop: "1px solid var(--linha)", borderLeft: "1px solid var(--linha)" }}>
          {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((n) => <div key={n} className="mudo pequeno mono" style={{ padding: "6px 8px", borderRight: "1px solid var(--linha)", borderBottom: "1px solid var(--linha)" }}>{n}</div>)}
          {celulas.map((dia, i) => {
            const doDia = dia ? postsDoMes.filter((p) => p.agendadoPara.getDate() === dia).sort((a, b) => +a.agendadoPara - +b.agendadoPara) : [];
            const ehHoje = dia && ano === hoje.getFullYear() && mes0 === hoje.getMonth() + 1 && dia === hoje.getDate();
            return (
              <div key={i} style={{ minHeight: 92, padding: 6, borderRight: "1px solid var(--linha)", borderBottom: "1px solid var(--linha)", background: dia ? undefined : "var(--painel)" }}>
                {dia && <div className="mono pequeno" style={{ color: ehHoje ? "var(--acento)" : "var(--mudo)", fontWeight: ehHoje ? 700 : 400 }}>{dia}</div>}
                {doDia.map((p) => (
                  <a key={p.id} href={`#post-${p.id}`} title={`${tituloPost(p.versaoId)} · ${ROTULO[p.status]}`} style={{ display: "block", marginTop: 4, padding: "2px 6px", fontSize: 11, borderLeft: `3px solid ${COR[p.status]}`, background: "var(--painel-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span className="mono">{pad(p.agendadoPara.getHours())}:{pad(p.agendadoPara.getMinutes())}</span> {tituloPost(p.versaoId)}
                  </a>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <h2>Posts</h2>
      {todosPosts.length === 0 ? (
        <div className="vazio"><strong>Nenhum post ainda</strong>Os agendados e já publicados aparecem aqui, com o estado de cada rede.</div>
      ) : (
        <div className="lista">
          {[...todosPosts].sort((a, b) => +b.agendadoPara - +a.agendadoPara).map((p) => {
            const ds = destinos.filter((x) => x.postId === p.id);
            return (
              <div key={p.id} id={`post-${p.id}`} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="grow" style={{ minWidth: 260 }}>
                  <div className="linha"><span className="titulo">{tituloPost(p.versaoId)}</span><span className="etiqueta" style={{ color: COR[p.status], borderColor: COR[p.status] }}>{ROTULO[p.status]}</span></div>
                  <div className="mono mudo">{p.agendadoPara.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</div>
                  {p.legendaBase && <div className="mudo pequeno" style={{ maxWidth: "60ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.legendaBase}</div>}
                  <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                    {ds.map((x) => (
                      <div key={x.id} className="pequeno linha" style={{ gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: COR[x.status], flex: "none" }} />
                        <span>{NOMES_REDE[x.rede as Rede]}</span><span className="mudo">· {ROTULO[x.status]}</span>
                        {x.url && <a href={x.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>abrir</a>}
                        {x.rede === "youtube" && x.status === "concluido" && <span className="mudo">· {x.privacidade === "private" ? "privado" : x.privacidade === "unlisted" ? "não listado" : "público"}</span>}
                        {x.rede === "tiktok" && x.status === "concluido" && <span className="mudo">· no rascunho: abra o TikTok e toque em publicar</span>}
                        {x.erro && <span style={{ color: "var(--erro)" }}>· {x.erro}</span>}
                        {x.status === "falhou" && <form action={tentarAcao}><input type="hidden" name="id" value={x.id} /><button className="sec peq" title="Confira antes na rede se o vídeo não subiu">Tentar de novo</button></form>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="linha">
                  {(p.status === "agendado" || p.status === "parcial") && <form action={agoraAcao}><input type="hidden" name="id" value={p.id} /><button className="sec peq">Publicar agora</button></form>}
                  {(p.status === "agendado" || p.status === "parcial") && <form action={cancelarAcao}><input type="hidden" name="id" value={p.id} /><button className="sec peq">Cancelar</button></form>}
                  {p.status !== "publicando" && <form action={excluirAcao}><input type="hidden" name="id" value={p.id} /><button className="perigo peq">Excluir</button></form>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Atualizar ativo={ativo} />
    </>
  );
}
