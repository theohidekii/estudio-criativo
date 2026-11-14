import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agentes, fontes, roteiros, tarefas } from "@estudio/db";
import { enfileirar } from "@estudio/db/src/fila";
import { db } from "@/lib/db";
import { instrucaoBase, pedidoPesquisa, pedidoRascunho } from "@/lib/prompts";
import { usuarioAtual } from "@/lib/sessao";
import { PageHead } from "../../PageHead";
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
      <PageHead titulo={r.titulo} descricao={<span className="mono">Roteiro #{id}</span>}>
        <a href="/roteiros" className="btn" style={{ background: "transparent", color: "var(--txt)", borderColor: "var(--linha-forte)" }}>Todos os roteiros</a>
      </PageHead>
      {emAndamento.length > 0 && <div className="aviso">A IA está trabalhando neste roteiro. {!online ? "Seu agente está desconectado: conecte-o em Agente local." : "Esta página atualiza sozinha."}</div>}

      <div className="card linha">
        <span className="mudo">Pedir à IA</span>
        <form action={pedirIA}><input type="hidden" name="campo" value="pesquisa" /><button className="sec">Pesquisar fatos na web</button></form>
        <form action={pedirIA}><input type="hidden" name="campo" value="texto" /><button className="sec">Escrever rascunho</button></form>
        <span className="mudo pequeno">O resultado substitui o campo correspondente. Salve antes se editou à mão.</span>
      </div>

      <form className="card">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 200px", gap: 16 }}>
          <label>Título<input name="titulo" defaultValue={r.titulo} /></label>
          <label>Etapa
            <select name="etapa" defaultValue={r.etapa}>{ETAPAS.map((e) => <option key={e} value={e}>{e[0].toUpperCase() + e.slice(1)}</option>)}</select>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <label>Pesquisa de fatos<textarea name="pesquisa" rows={16} defaultValue={r.pesquisa} placeholder="Fatos confirmados, pontos em que as fontes divergem e o que evitar." /></label>
          <label>Roteiro da narração<textarea name="texto" rows={16} defaultValue={r.texto} placeholder="Uma frase por linha." /></label>
        </div>
        <div className="linha" style={{ justifyContent: "space-between" }}>
          <button formAction={salvar}>Salvar alterações</button>
          <button formAction={excluir} className="perigo">Excluir roteiro</button>
        </div>
      </form>

      <h2>Fontes</h2>
      {fs.length === 0 && <div className="vazio" style={{ marginBottom: 12 }}><strong>Nenhuma fonte registrada</strong>Anote de onde vem cada fato e qualquer ressalva.</div>}
      {fs.length > 0 && (
        <div className="lista" style={{ marginBottom: 12 }}>
          {fs.map((f) => (
            <div key={f.id}>
              <div className="grow">
                <a href={f.url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>{f.url}</a>
                {f.nota && <div className="mudo pequeno">{f.nota}</div>}
                {f.ressalva && <div className="pequeno" style={{ color: "var(--aviso)" }}>Ressalva: {f.ressalva}</div>}
              </div>
              <form action={delFonte}><input type="hidden" name="fid" value={f.id} /><button className="sec peq">Remover</button></form>
            </div>
          ))}
        </div>
      )}
      <form action={addFonte} className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
          <label>Endereço<input name="url" placeholder="https://…" /></label>
          <label>Nota<input name="nota" /></label>
          <label>Ressalva<input name="ressalva" /></label>
        </div>
        <button className="sec">Adicionar fonte</button>
      </form>
      <Atualizar ativo={emAndamento.length > 0} />
    </>
  );
}
