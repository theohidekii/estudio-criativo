import { and, asc, eq, lte } from "drizzle-orm";
import type { Banco } from "./index";
import { tarefas } from "./schema";

export function enfileirar(db: Banco, tipo: string, payload: unknown = {}, quando = new Date()) {
  return db.insert(tarefas).values({ tipo, payload: JSON.stringify(payload), agendadaPara: quando }).returning().get();
}

/** Pega a próxima tarefa pendente e marca como executando (atômico em SQLite). */
export function pegarProxima(db: Banco, agora = new Date()) {
  return db.transaction((tx) => {
    const t = tx.select().from(tarefas)
      .where(and(eq(tarefas.status, "pendente"), lte(tarefas.agendadaPara, agora)))
      .orderBy(asc(tarefas.agendadaPara), asc(tarefas.id)).limit(1).get();
    if (!t) return null;
    tx.update(tarefas).set({ status: "executando", tentativas: t.tentativas + 1 }).where(eq(tarefas.id, t.id)).run();
    return { ...t, status: "executando" as const, tentativas: t.tentativas + 1 };
  });
}

export function concluir(db: Banco, id: number) {
  db.update(tarefas).set({ status: "concluida", erro: null }).where(eq(tarefas.id, id)).run();
}

export function falhar(db: Banco, id: number, erro: string, maxTentativas = 3) {
  const t = db.select().from(tarefas).where(eq(tarefas.id, id)).get();
  if (!t) return;
  const volta = t.tentativas < maxTentativas;
  db.update(tarefas).set({ status: volta ? "pendente" : "falhou", erro }).where(eq(tarefas.id, id)).run();
}
