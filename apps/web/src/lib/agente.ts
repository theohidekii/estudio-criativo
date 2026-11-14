import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { agentes } from "@estudio/db";
import { db } from "./db";

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const novoToken = () => "ea_" + randomBytes(24).toString("hex");

/** Autentica o agente pelo cabeçalho Authorization: Bearer <token>. */
export function agenteDaRequisicao(req: Request) {
  const t = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!t) return null;
  const a = db().select().from(agentes).where(eq(agentes.tokenHash, hashToken(t))).get();
  if (a) db().update(agentes).set({ ultimoContato: new Date() }).where(eq(agentes.id, a.id)).run();
  return a ?? null;
}
