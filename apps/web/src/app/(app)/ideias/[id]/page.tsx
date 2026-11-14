import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { agentes, conversas, mensagens, perfis } from "@estudio/db";
import { enfileirar } from "@estudio/db/src/fila";
import { db } from "@/lib/db";
import { instrucaoBase, pedidoIdeias } from "@/lib/prompts";
import { usuarioAtual } from "@/lib/sessao";
import { PageHead } from "../../PageHead";
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
      <PageHead titulo={`Conversa #${id}`} descricao="A IA responde pelo seu agente local, com o Claude Haiku.">
        <a href="/ideias" className="btn" style={{ background: "transparent", color: "var(--txt)", borderColor: "var(--linha-forte)" }}>Todas as conversas</a>
      </PageHead>
      {!online && <div className="aviso">Seu agente está desconectado, então a IA não vai responder. <a href="/agentes" style={{ textDecoration: "underline" }}>Conectar agente</a></div>}
      <div className="chat">
        {msgs.length === 0 && <div className="vazio"><strong>Comece pedindo ideias</strong>Use o botão Gerar ideias pelo nicho ou escreva sua própria pergunta.</div>}
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.papel === "ia" ? "ia" : "eu"}`}>
            <div className="quem">{m.papel === "ia" ? "IA" : "Você"}</div>
            <div className={`corpo${m.status === "pendente" ? " pensando" : ""}`} style={m.status === "erro" ? { color: "var(--erro)" } : undefined}>
              {m.status === "pendente" ? "Pensando" : m.status === "erro" ? `Não consegui responder: ${m.texto}` : m.texto}
            </div>
          </div>
        ))}
      </div>
      <form className="card" style={{ position: "sticky", bottom: 16 }}>
        <textarea name="texto" rows={3} placeholder="Escreva uma mensagem ou observações para guiar as ideias" style={{ marginTop: 0 }} />
        <div className="linha">
          <button formAction={falar}>Enviar</button>
          <button formAction={ideias} className="sec">Gerar ideias pelo nicho</button>
        </div>
      </form>
      <Atualizar ativo={pendente} />
    </>
  );
}
