import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validarCenas } from "@estudio/video/src/generic/tipos";
import { agentes, notificacoes, perfis, roteiros, tarefas, versoesVideo, videos, vozes } from "@estudio/db";
import { enfileirar } from "@estudio/db/src/fila";
import { db } from "@/lib/db";
import { gerarNarracao, pastaVideo } from "@/lib/narracao";
import { instrucaoBase, pedidoAjuste, pedidoCenas } from "@/lib/prompts";
import { usuarioAtual } from "@/lib/sessao";
import Atualizar from "../../ideias/[id]/Atualizar";
import EditorCenas from "./EditorCenas";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const atual = (videoId: number) => db().select().from(versoesVideo).where(eq(versoesVideo.videoId, videoId)).orderBy(desc(versoesVideo.numero)).get()!;

export default async function Video({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const id = Number((await params).id);
  const pedida = Number((await searchParams).v);
  const uid = (await usuarioAtual())!;
  const d = db();
  const vid = d.select().from(videos).where(eq(videos.id, id)).get();
  if (!vid) notFound();
  const todas = d.select().from(versoesVideo).where(eq(versoesVideo.videoId, id)).orderBy(desc(versoesVideo.numero)).all();
  const ver = todas.find((x) => x.numero === pedida) ?? todas[0];
  const rot = d.select().from(roteiros).where(eq(roteiros.id, vid.roteiroId)).get();
  const perfil = rot ? d.select().from(perfis).where(eq(perfis.id, rot.perfilId)).get() : undefined;
  const listaVozes = d.select().from(vozes).all();
  const vozEscolhida = ver.vozIdExterno ?? perfil?.vozPadrao ?? "";
  const emAndamento = d.select().from(tarefas).where(eq(tarefas.usuarioId, uid)).all()
    .filter((t) => (t.status === "pendente" || t.status === "executando") && JSON.parse(t.payload).versaoId === ver.id);
  const online = d.select().from(agentes).where(eq(agentes.usuarioId, uid)).all()
    .some((a) => a.ultimoContato && Date.now() - a.ultimoContato.getTime() < 30000);

  async function voz(form: FormData) {
    "use server";
    const dd = db();
    const v = atual(id);
    const vozId = String(form.get("vozId") ?? "");
    const vz = dd.select().from(vozes).where(eq(vozes.idExterno, vozId)).get();
    const ro = dd.select().from(roteiros).where(eq(roteiros.id, dd.select().from(videos).where(eq(videos.id, id)).get()!.roteiroId)).get();
    if (!vz || !ro) return;
    try {
      const r = await gerarNarracao(id, v.numero, vz.idExterno, ro.texto, vz.estabilidade, vz.velocidade);
      dd.update(versoesVideo).set({ vozIdExterno: vz.idExterno, palavras: JSON.stringify(r.palavras), duracao: r.duracao, arquivoVoz: r.arquivo, status: "voz_pronta", erro: null }).where(eq(versoesVideo.id, v.id)).run();
    } catch (e) {
      dd.update(versoesVideo).set({ erro: String((e as Error).message) }).where(eq(versoesVideo.id, v.id)).run();
    }
    revalidatePath(`/videos/${id}`);
  }

  async function cenas() {
    "use server";
    const dd = db();
    const uidd = (await usuarioAtual())!;
    const v = atual(id);
    const ro = dd.select().from(roteiros).where(eq(roteiros.id, dd.select().from(videos).where(eq(videos.id, id)).get()!.roteiroId)).get();
    if (!ro || !v.duracao) return;
    const prompt = `${instrucaoBase(undefined)}\n\n${pedidoCenas(ro.texto, JSON.parse(v.palavras), v.duracao)}`;
    enfileirar(dd, "ia.cenas", { versaoId: v.id, prompt, modelo: "sonnet", ferramentas: [], duracao: v.duracao }, new Date(), uidd);
    dd.update(versoesVideo).set({ erro: null }).where(eq(versoesVideo.id, v.id)).run();
    revalidatePath(`/videos/${id}`);
  }

  async function ajuste(form: FormData) {
    "use server";
    const dd = db();
    const uidd = (await usuarioAtual())!;
    const v = atual(id);
    const instrucao = String(form.get("instrucao") ?? "").trim();
    if (!instrucao || !v.cenas || !v.duracao) return;
    const prompt = `${instrucaoBase(undefined)}\n\n${pedidoAjuste(v.cenas, instrucao, v.duracao)}`;
    enfileirar(dd, "ia.ajuste", { versaoId: v.id, prompt, modelo: "sonnet", ferramentas: [], duracao: v.duracao }, new Date(), uidd);
    revalidatePath(`/videos/${id}`);
  }

  async function salvar(form: FormData) {
    "use server";
    const v = atual(id);
    try {
      const c = validarCenas(JSON.parse(String(form.get("json"))), v.duracao ?? 60);
      db().update(versoesVideo).set({ cenas: JSON.stringify(c), status: v.status === "pronto" ? "cenas_prontas" : v.status, erro: null }).where(eq(versoesVideo.id, v.id)).run();
    } catch (e) {
      db().update(versoesVideo).set({ erro: `Não salvei: ${(e as Error).message}` }).where(eq(versoesVideo.id, v.id)).run();
    }
    revalidatePath(`/videos/${id}`);
  }

  async function novaVersao() {
    "use server";
    const dd = db();
    const v = atual(id);
    // nova versão parte da atual (voz e cenas), para ajustar sem perder a anterior
    dd.insert(versoesVideo).values({ videoId: id, numero: v.numero + 1, status: v.cenas ? "cenas_prontas" : v.status, vozIdExterno: v.vozIdExterno, palavras: v.palavras, duracao: v.duracao, cenas: v.cenas, arquivoVoz: v.arquivoVoz }).run();
    if (v.arquivoVoz) {
      const { copyFile } = await import("node:fs/promises");
      const pasta = pastaVideo(id, v.numero + 1);
      await mkdir(pasta, { recursive: true });
      await copyFile(v.arquivoVoz, path.join(pasta, "voz.mp3"));
      const pub = path.resolve(process.cwd(), "../../packages/video/public/gen");
      await mkdir(pub, { recursive: true });
      await copyFile(v.arquivoVoz, path.join(pub, `${id}-v${v.numero + 1}.mp3`));
    }
    revalidatePath(`/videos/${id}`);
  }

  async function renderizar() {
    "use server";
    const dd = db();
    const v = atual(id);
    if (!v.cenas) return;
    const pasta = pastaVideo(id, v.numero);
    await mkdir(pasta, { recursive: true });
    const props = path.join(pasta, "props.json");
    await writeFile(props, JSON.stringify({ cenas: JSON.parse(v.cenas), audio: v.arquivoVoz ? `gen/${id}-v${v.numero}.mp3` : undefined }));
    const saida = path.join(pasta, "video.mp4");
    dd.update(versoesVideo).set({ status: "renderizando", erro: null }).where(eq(versoesVideo.id, v.id)).run();
    const cwd = path.resolve(process.cwd(), "../../packages/video");
    // No Windows o spawn usa shell e não coloca aspas sozinho: caminhos com espaço precisam de aspas manuais.
    const q = (s: string) => (process.platform === "win32" ? `"${s}"` : s);
    const p = spawn("npx", ["remotion", "render", "src/index.ts", "Generico", q(saida), `--props=${q(props)}`], { cwd, shell: process.platform === "win32" });
    let log = "";
    p.stdout.on("data", (b) => (log += b)); p.stderr.on("data", (b) => (log += b));
    p.on("close", (code) => {
      const x = db();
      if (code === 0) {
        x.update(versoesVideo).set({ status: "pronto", arquivoVideo: saida }).where(eq(versoesVideo.id, v.id)).run();
        x.insert(notificacoes).values({ titulo: "Vídeo renderizado", mensagem: `Vídeo ${id} v${v.numero} está pronto.` }).run();
      } else {
        x.update(versoesVideo).set({ status: "erro", erro: `Render falhou: ${log.slice(-400)}` }).where(eq(versoesVideo.id, v.id)).run();
      }
    });
    revalidatePath(`/videos/${id}`);
  }

  const renderizando = ver.status === "renderizando";
  return (
    <>
      <h1>{vid.titulo} <span className="mudo">v{ver.numero}</span></h1>
      <div className="mudo" style={{ marginBottom: 12 }}>
        Versões: {todas.map((x) => <a key={x.id} href={`/videos/${id}?v=${x.numero}`} style={{ marginRight: 8 }}>v{x.numero}</a>)}
        {ver.id === todas[0].id && <form action={novaVersao} style={{ display: "inline" }}><button style={{ background: "#334155", padding: "4px 10px" }}>+ nova versão</button></form>}
      </div>
      {ver.erro && <p className="card" style={{ color: "#f87171", whiteSpace: "pre-wrap" }}>{ver.erro}</p>}
      {(emAndamento.length > 0 || renderizando) && <p style={{ color: "#fbbf24" }}>{renderizando ? "Renderizando o vídeo… (pode levar alguns minutos)" : "IA trabalhando…"} {emAndamento.length > 0 && !online && "(seu agente está offline)"}</p>}

      <div className="card">
        <strong>1. Narração</strong>
        <form action={voz} style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <select name="vozId" defaultValue={vozEscolhida} style={{ flex: 1, padding: 10 }}>
            {listaVozes.map((v) => <option key={v.id} value={v.idExterno}>{v.nome}</option>)}
          </select>
          <button disabled={listaVozes.length === 0}>{ver.arquivoVoz ? "Gerar de novo" : "Gerar narração"}</button>
        </form>
        {listaVozes.length === 0 && <p className="mudo">Importe as vozes primeiro, na página Vozes.</p>}
        {ver.arquivoVoz && <p className="mudo">Pronta: {ver.duracao?.toFixed(1)} s. <audio controls src={`/api/videos/${id}/audio?v=${ver.numero}`} style={{ verticalAlign: "middle" }} /></p>}
      </div>

      <div className="card">
        <strong>2. Cenas (IA)</strong>
        <form action={cenas} style={{ marginTop: 8 }}><button disabled={!ver.duracao}>{ver.cenas ? "Gerar cenas de novo" : "Gerar cenas com IA"}</button></form>
      </div>

      {ver.cenas && (
        <>
          <div className="card">
            <strong>3. Pré-visualizar e ajustar</strong>
            <EditorCenas key={`${ver.id}-${ver.cenas.length}`} videoId={id} numero={ver.numero} inicial={JSON.stringify(JSON.parse(ver.cenas), null, 2)} duracao={ver.duracao ?? 30} temAudio={!!ver.arquivoVoz} salvar={salvar} />
          </div>
          <form action={ajuste} className="card">
            <label>Pedir um ajuste à IA (ex.: "aumente o texto da cena 4 e deixe o fundo mais escuro")<input name="instrucao" /></label>
            <button>Pedir ajuste</button>
          </form>
          <div className="card">
            <strong>4. Renderizar</strong>
            <form action={renderizar} style={{ marginTop: 8 }}><button disabled={renderizando}>Renderizar MP4</button></form>
            {ver.status === "pronto" && <p><a href={`/api/videos/${id}/arquivo?v=${ver.numero}`} target="_blank" rel="noreferrer">Abrir o vídeo</a></p>}
          </div>
        </>
      )}
      <Atualizar ativo={emAndamento.length > 0 || renderizando} />
    </>
  );
}
