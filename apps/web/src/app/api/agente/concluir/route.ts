import { eq } from "drizzle-orm";
import { mensagens, tarefas } from "@estudio/db";
import { concluir, falhar } from "@estudio/db/src/fila";
import { agenteDaRequisicao } from "@/lib/agente";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = agenteDaRequisicao(req);
  if (!a) return new Response("não autorizado", { status: 401 });
  const { id, resultado, erro } = (await req.json()) as { id: number; resultado?: string; erro?: string };
  const d = db();
  const t = d.select().from(tarefas).where(eq(tarefas.id, id)).get();
  if (!t || t.usuarioId !== a.usuarioId) return new Response("tarefa inexistente", { status: 404 });
  const mensagemId = (JSON.parse(t.payload) as { mensagemId?: number }).mensagemId;
  if (erro) {
    falhar(d, id, erro, 1);
    if (mensagemId) d.update(mensagens).set({ status: "erro", texto: erro }).where(eq(mensagens.id, mensagemId)).run();
  } else {
    concluir(d, id);
    if (mensagemId) d.update(mensagens).set({ status: "pronta", texto: resultado ?? "" }).where(eq(mensagens.id, mensagemId)).run();
  }
  return Response.json({ ok: true });
}
