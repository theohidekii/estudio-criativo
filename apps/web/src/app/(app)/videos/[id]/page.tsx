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
import { PageHead } from "../../PageHead";
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
      <PageHead titulo={vid.titulo} descricao={<span className="mono">Vídeo #{id} · versão {ver.numero}</span>}>
        {todas.map((x) => <a key={x.id} href={`/videos/${id}?v=${x.numero}`} className={`etiqueta${x.id === ver.id ? " acento" : ""}`}>v{x.numero}</a>)}
        {ver.id === todas[0].id && <form action={novaVersao}><button className="sec peq" title="Copia a versão atual para ajustar sem perder esta">Nova versão</button></form>}
      </PageHead>
      {ver.erro && <div className="aviso erro" role="alert">{ver.erro}</div>}
      {(emAndamento.length > 0 || renderizando) && (
        <div className="aviso">
          {renderizando ? "Renderizando o vídeo. Isso pode levar alguns minutos e a página atualiza sozinha." : "A IA está trabalhando. A página atualiza sozinha."}
          {emAndamento.length > 0 && !online && " Seu agente está desconectado: conecte-o em Agente local."}
        </div>
      )}

      <div className={`passo ${ver.arquivoVoz ? "feito" : "atual"}`}>
        <div className="n">{ver.arquivoVoz ? "✓" : "1"}</div>
        <div>
          <h3>Narração</h3>
          <form action={voz} className="linha">
            <select name="vozId" defaultValue={vozEscolhida} className="grow" style={{ margin: 0 }}>
              {listaVozes.map((v) => <option key={v.id} value={v.idExterno}>{v.nome}</option>)}
            </select>
            <button disabled={listaVozes.length === 0} className={ver.arquivoVoz ? "sec" : undefined}>{ver.arquivoVoz ? "Gerar de novo" : "Gerar narração"}</button>
          </form>
          {listaVozes.length === 0 && <p className="mudo pequeno" style={{ marginTop: 8 }}>Nenhuma voz disponível. Importe as vozes na página Vozes.</p>}
          {ver.arquivoVoz && (
            <div className="linha" style={{ marginTop: 12 }}>
              <audio controls src={`/api/videos/${id}/audio?v=${ver.numero}`} />
              <span className="mono mudo">{ver.duracao?.toFixed(1)} s</span>
            </div>
          )}
        </div>
      </div>

      <div className={`passo ${ver.cenas ? "feito" : ver.arquivoVoz ? "atual" : ""}`}>
        <div className="n">{ver.cenas ? "✓" : "2"}</div>
        <div>
          <h3>Cenas</h3>
          <form action={cenas} className="linha">
            <button disabled={!ver.duracao} className={ver.cenas ? "sec" : undefined}>{ver.cenas ? "Gerar cenas de novo" : "Gerar cenas com IA"}</button>
            {!ver.duracao && <span className="mudo pequeno">Gere a narração primeiro.</span>}
          </form>
        </div>
      </div>

      <div className={`passo ${ver.cenas ? "atual" : ""}`}>
        <div className="n">3</div>
        <div>
          <h3>Pré-visualizar e ajustar</h3>
          {ver.cenas ? (
            <>
              <EditorCenas key={`${ver.id}-${ver.cenas.length}`} videoId={id} numero={ver.numero} inicial={JSON.stringify(JSON.parse(ver.cenas), null, 2)} duracao={ver.duracao ?? 30} temAudio={!!ver.arquivoVoz} salvar={salvar} />
              <form action={ajuste} className="linha" style={{ marginTop: 16, alignItems: "flex-end" }}>
                <label className="grow" style={{ margin: 0 }}>Pedir um ajuste à IA
                  <input name="instrucao" placeholder="Aumente o texto da cena 4 e escureça o fundo" style={{ marginBottom: 0 }} />
                </label>
                <button className="sec">Pedir ajuste</button>
              </form>
            </>
          ) : <p className="mudo">Aparece depois que as cenas forem geradas.</p>}
        </div>
      </div>

      <div className={`passo ${ver.status === "pronto" ? "feito" : ""}`}>
        <div className="n">{ver.status === "pronto" ? "✓" : "4"}</div>
        <div>
          <h3>Renderizar</h3>
          <form action={renderizar} className="linha">
            <button disabled={renderizando || !ver.cenas}>{renderizando ? "Renderizando" : "Renderizar MP4"}</button>
            {ver.status === "pronto" && <a href={`/api/videos/${id}/arquivo?v=${ver.numero}`} target="_blank" rel="noreferrer" className="btn" style={{ background: "transparent", color: "var(--txt)", borderColor: "var(--linha-forte)" }}>Abrir vídeo</a>}
          </form>
        </div>
      </div>
      <Atualizar ativo={emAndamento.length > 0 || renderizando} />
    </>
  );
}
