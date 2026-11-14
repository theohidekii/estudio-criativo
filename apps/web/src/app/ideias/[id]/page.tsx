import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agentes, conversas, mensagens, perfis } from "@estudio/db";
import { enfileirar } from "@estudio/db/src/fila";
import { db } from "@/lib/db";
import { instrucaoBase, pedidoIdeias } from "@/lib/prompts";
import { usuarioAtual } from "@/lib/sessao";
import Atualizar from "./Atualizar";

export const dynamic = "force-dynamic";

async function enviar(id: number, texto: string, gerarIdeias: boolean) {
  const uid = (await usuarioAtual())!;
  const d = db();
  const c = d.select().from(conversas).where(eq(conversas.id, id)).get();
  if (!c || c.usuarioId !== uid) return;
  const pedido = gerarIdeias ? pedidoIdeias(texto) : texto;
  if (!pedido.trim()) return;
  d.insert(mensagens).values({ conversaId: id, papel: "usuario", texto: gerarIdeias ? `💡 Gerar ideias pelo nicho. ${texto}` : texto }).run();
  const historico = d.select().from(mensagens).where(eq(mensagens.conversaId, id)).orderBy(asc(mensagens.id)).all()
    .filter((m) => m.status === "pronta").map((m) => `${m.papel === "usuario" ? "Usuário" : "Assistente"}: ${m.texto}`).join("\n\n");
  const perfil = c.perfilId ? d.select().from(perfis).where(eq(perfis.id, c.perfilId)).get() : undefined;
  const resp = d.insert(mensagens).values({ conversaId: id, papel: "ia", texto: "", status: "pendente" }).returning().get();
  const prompt = `${instrucaoBase(perfil)}\n\nConversa até agora:\n${historico}\n\n${gerarIdeias ? "Usuário (pedido): " + pedido : ""}\n\nResponda como Assistente.`;
  // Chat usa o modelo mais barato (haiku); geração de roteiro/cenas usará sonnet nas próximas etapas.
  enfileirar(d, "ia.chat", { mensagemId: resp.id, prompt, modelo: "haiku" }, new Date(), uid);
  revalidatePath(`/ideias/${id}`);
}

export default async function Conversa({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const uid = (await usuarioAtual())!;
  const d = db();
  const c = d.select().from(conversas).where(eq(conversas.id, id)).get();
  if (!c || c.usuarioId !== uid) notFound();
  const msgs = d.select().from(mensagens).where(eq(mensagens.conversaId, id)).orderBy(asc(mensagens.id)).all();
  const online = d.select().from(agentes).where(eq(agentes.usuarioId, uid)).all()
    .some((a) => a.ultimoContato && Date.now() - a.ultimoContato.getTime() < 30000);
  const pendente = msgs.some((m) => m.status === "pendente");

  async function falar(form: FormData) { "use server"; await enviar(id, String(form.get("texto") ?? ""), false); }
  async function ideias(form: FormData) { "use server"; await enviar(id, String(form.get("texto") ?? ""), true); }

  return (
    <>
      <h1>Conversa #{id}</h1>
      {!online && <p style={{ color: "#fbbf24" }}>Seu agente local está offline. Ligue-o em <a href="/agentes">Agente local</a> para a IA responder.</p>}
      {msgs.map((m) => (
        <div key={m.id} className="card" style={{ borderColor: m.papel === "ia" ? "#3b2f6b" : undefined }}>
          <div className="mudo">{m.papel === "ia" ? "IA" : "Você"}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{m.status === "pendente" ? "pensando…" : m.status === "erro" ? `Erro: ${m.texto}` : m.texto}</div>
        </div>
      ))}
      <form className="card">
        <textarea name="texto" rows={3} placeholder="Escreva sua mensagem ou observações para as ideias" />
        <button formAction={falar}>Enviar</button>{" "}
        <button formAction={ideias} style={{ background: "#334155" }}>Gerar ideias pelo nicho</button>
      </form>
      <Atualizar ativo={pendente} />
    </>
  );
}
