import { pegarProxima } from "@estudio/db/src/fila";
import { agenteDaRequisicao } from "@/lib/agente";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = agenteDaRequisicao(req);
  if (!a) return new Response("não autorizado", { status: 401 });
  const t = pegarProxima(db(), new Date(), { usuarioId: a.usuarioId, tipoComecaCom: "ia." });
  if (!t) return new Response(null, { status: 204 });
  return Response.json({ id: t.id, tipo: t.tipo, payload: JSON.parse(t.payload) });
}
