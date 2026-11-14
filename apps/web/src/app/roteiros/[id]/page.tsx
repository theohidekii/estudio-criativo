import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agentes, fontes, roteiros, tarefas } from "@estudio/db";
import { enfileirar } from "@estudio/db/src/fila";
import { db } from "@/lib/db";
import { instrucaoBase, pedidoPesquisa, pedidoRascunho } from "@/lib/prompts";
import { usuarioAtual } from "@/lib/sessao";
import Atualizar from "../../ideias/[id]/Atualizar";

export const dynamic = "force-dynamic";
const ETAPAS = ["ideia", "rascunho", "aprovado", "gravado", "publicado"] as const;

export default async function Roteiro({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const uid = (await usuarioAtual())!;
  const d = db();
  const r = d.select().from(roteiros).where(eq(roteiros.id, id)).get();
  if (!r) notFound();
  const fs = d.select().from(fontes).where(eq(fontes.roteiroId, id)).all();
  const emAndamento = d.select().from(tarefas).where(eq(tarefas.usuarioId, uid)).all()
    .filter((t) => (t.status === "pendente" || t.status === "executando") && JSON.parse(t.payload).roteiroId === id);
  const online = d.select().from(agentes).where(eq(agentes.usuarioId, uid)).all()
    .some((a) => a.ultimoContato && Date.now() - a.ultimoContato.getTime() < 30000);

  async function salvar(form: FormData) {
    "use server";
    const d = db();
    const etapa = String(form.get("etapa"));
    d.update(roteiros).set({
      titulo: String(form.get("titulo") ?? ""),
      texto: String(form.get("texto") ?? ""),
      pesquisa: String(form.get("pesquisa") ?? ""),
      ...(ETAPAS.includes(etapa as never) ? { etapa: etapa as (typeof ETAPAS)[number] } : {}),
    }).where(eq(roteiros.id, id)).run();
    revalidatePath(`/roteiros/${id}`);
  }
  async function pedirIA(form: FormData) {
    "use server";
    const d = db();
    const uid = (await usuarioAtual())!;
    const campo = String(form.get("campo")) === "pesquisa" ? "pesquisa" : "texto";
    const cur = d.select().from(roteiros).where(eq(roteiros.id, id)).get()!;
    const prompt = campo === "pesquisa"
      ? `${instrucaoBase(undefined)}\n\n${pedidoPesquisa(cur.titulo, cur.texto)}`
      : `${instrucaoBase(undefined)}\n\n${pedidoRascunho(cur.titulo, cur.pesquisa, cur.texto)}`;
    // Pesquisa usa busca na web e o modelo mais forte; rascunho só gera texto.
    enfileirar(d, "ia.roteiro", { roteiroId: id, campo, prompt, modelo: "sonnet", ferramentas: campo === "pesquisa" ? ["WebSearch", "WebFetch"] : [] }, new Date(), uid);
    revalidatePath(`/roteiros/${id}`);
  }
  async function addFonte(form: FormData) {
    "use server";
    const d = db();
    const url = String(form.get("url") ?? "").trim();
    if (!/^https?:\/\//.test(url)) return;
    d.insert(fontes).values({ roteiroId: id, url, nota: String(form.get("nota") ?? ""), ressalva: String(form.get("ressalva") ?? "") }).run();
    revalidatePath(`/roteiros/${id}`);
  }
  async function delFonte(form: FormData) {
    "use server";
    const d = db();
    d.delete(fontes).where(eq(fontes.id, Number(form.get("fid")))).run();
    revalidatePath(`/roteiros/${id}`);
  }
  async function excluir() { "use server"; const d = db(); d.delete(roteiros).where(eq(roteiros.id, id)).run(); redirect("/roteiros"); }

  return (
    <>
      <h1>Roteiro #{id}</h1>
      {emAndamento.length > 0 && <p style={{ color: "#fbbf24" }}>IA trabalhando… {!online && "(seu agente está offline: ligue-o em Agente local)"}</p>}
      <form className="card">
        <label>Título<input name="titulo" defaultValue={r.titulo} /></label>
        <label>Etapa
          <select name="etapa" defaultValue={r.etapa} style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}>
            {ETAPAS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label>Pesquisa de fatos (fatos, divergências, o que evitar)<textarea name="pesquisa" rows={12} defaultValue={r.pesquisa} /></label>
        <label>Roteiro (narração)<textarea name="texto" rows={12} defaultValue={r.texto} /></label>
        <button formAction={salvar}>Salvar</button>{" "}
        <button formAction={excluir} style={{ background: "#7f1d1d" }}>Excluir</button>
        <p className="mudo">A IA sobrescreve o campo escolhido. Salve antes se tiver editado à mão.</p>
      </form>
      <div className="card">
        <form action={pedirIA} style={{ display: "inline" }}><input type="hidden" name="campo" value="pesquisa" /><button>Pesquisar fatos (IA + web)</button></form>{" "}
        <form action={pedirIA} style={{ display: "inline" }}><input type="hidden" name="campo" value="texto" /><button style={{ background: "#334155" }}>Escrever rascunho (IA)</button></form>
      </div>
      <h2>Fontes</h2>
      {fs.map((f) => (
        <div key={f.id} className="card">
          <a href={f.url} target="_blank" rel="noreferrer">{f.url}</a>
          {f.nota && <div>{f.nota}</div>}{f.ressalva && <div style={{ color: "#fbbf24" }}>Ressalva: {f.ressalva}</div>}
          <form action={delFonte}><input type="hidden" name="fid" value={f.id} /><button style={{ background: "#334155", marginTop: 8 }}>Remover</button></form>
        </div>
      ))}
      <form action={addFonte} className="card">
        <label>URL<input name="url" placeholder="https://…" /></label>
        <label>Nota<input name="nota" /></label>
        <label>Ressalva<input name="ressalva" /></label>
        <button>Adicionar fonte</button>
      </form>
      <Atualizar ativo={emAndamento.length > 0} />
    </>
  );
}
