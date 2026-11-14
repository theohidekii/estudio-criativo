import { eq } from "drizzle-orm";
import { mensagens, notificacoes, roteiros, tarefas, versoesVideo } from "@estudio/db";
import { ESTILOS, extrairJson, legendasDoEstilo, validarCenas } from "@estudio/video/src/generic/tipos";
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
  const { mensagemId, roteiroId, campo, versaoId, duracao, estilo: payloadEstilo } = JSON.parse(t.payload) as { mensagemId?: number; roteiroId?: number; campo?: "texto" | "pesquisa"; versaoId?: number; duracao?: number; estilo?: string };
  if (versaoId) {
    // IA devolveu o JSON de cenas (geração ou ajuste): validar antes de aceitar
    try {
      if (erro) throw new Error(erro);
      const cenas = validarCenas(extrairJson(resultado ?? ""), duracao ?? 60);
      // O estilo é decidido pelo vídeo, não pela IA; no estilo de legenda curta o sistema monta as legendas pelos tempos da narração.
      const ver = d.select().from(versoesVideo).where(eq(versoesVideo.id, versaoId)).get();
      const estilo = (ESTILOS as readonly string[]).includes(payloadEstilo ?? "") ? (payloadEstilo as (typeof ESTILOS)[number]) : "classico";
      cenas.estilo = estilo;
      if (ver) cenas.legendas = legendasDoEstilo(estilo, JSON.parse(ver.palavras));
      concluir(d, id);
      d.update(versoesVideo).set({ cenas: JSON.stringify(cenas), status: "cenas_prontas", erro: null }).where(eq(versoesVideo.id, versaoId)).run();
    } catch (e) {
      const msg = String((e as Error).message).slice(0, 400);
      falhar(d, id, msg, 1);
      d.update(versoesVideo).set({ erro: `Cenas inválidas: ${msg}` }).where(eq(versoesVideo.id, versaoId)).run();
      d.insert(notificacoes).values({ titulo: "A IA não gerou cenas válidas", mensagem: msg }).run();
    }
    return Response.json({ ok: true });
  }
  if (erro) {
    falhar(d, id, erro, 1);
    if (mensagemId) d.update(mensagens).set({ status: "erro", texto: erro }).where(eq(mensagens.id, mensagemId)).run();
    if (roteiroId && campo) d.insert(notificacoes).values({ titulo: "Falha da IA no roteiro", mensagem: erro.slice(0, 300) }).run();
  } else {
    concluir(d, id);
    if (mensagemId) d.update(mensagens).set({ status: "pronta", texto: resultado ?? "" }).where(eq(mensagens.id, mensagemId)).run();
    if (roteiroId && (campo === "texto" || campo === "pesquisa"))
      d.update(roteiros).set({ [campo]: resultado ?? "" }).where(eq(roteiros.id, roteiroId)).run();
  }
  return Response.json({ ok: true });
}
