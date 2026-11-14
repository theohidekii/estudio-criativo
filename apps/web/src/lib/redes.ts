// Camada do servidor para as redes: credenciais dos apps, OAuth, coleta de métricas e gravação do histórico.
import { and, eq } from "drizzle-orm";
import { cifrar, decifrar, instagram, tiktok, youtube, type Coletada, type ConfigApp, type Credenciais, type Rede } from "@estudio/redes";
import { contasSociais, metricasSnapshot, publicacoes } from "@estudio/db";
import { db } from "./db";

export const NOMES_REDE: Record<Rede, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube" };
export const REDES: Rede[] = ["instagram", "tiktok", "facebook", "youtube"];
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const redirectDe = (rede: Rede) => `${appUrl()}/api/redes/${rede === "facebook" ? "instagram" : rede}/callback`;

/** Credenciais do app de cada rede (variáveis de ambiente). O Facebook usa o mesmo app da Meta que o Instagram. */
export function configApp(rede: Rede): ConfigApp | null {
  const e = process.env;
  const par = rede === "youtube" ? [e.YOUTUBE_CLIENT_ID, e.YOUTUBE_CLIENT_SECRET] : rede === "tiktok" ? [e.TIKTOK_CLIENT_KEY, e.TIKTOK_CLIENT_SECRET] : [e.META_APP_ID, e.META_APP_SECRET];
  return par[0] && par[1] ? { clientId: par[0], clientSecret: par[1] } : null;
}
export const podeConectar = (rede: Rede) => rede !== "facebook" && configApp(rede) !== null && Boolean(process.env.TOKEN_ENC_KEY && process.env.TOKEN_ENC_KEY.length >= 32);
/** Coleta automática hoje: Instagram, TikTok e YouTube. O Facebook fica com entrada manual (métricas ainda não validadas). */
export const temColetaAutomatica = (rede: Rede) => rede !== "facebook";

export function credenciaisDaConta(c: typeof contasSociais.$inferSelect): Credenciais | null {
  if (!c.tokenCriptografado) return null;
  try {
    return { accessToken: decifrar(c.tokenCriptografado), refreshToken: c.refreshTokenCriptografado ? decifrar(c.refreshTokenCriptografado) : undefined, expiraEm: c.expiraEm ?? undefined, extra: JSON.parse(c.extra || "{}") };
  } catch (e) {
    if (/TOKEN_ENC_KEY/.test((e as Error).message)) throw e;
    throw new Error("não consegui abrir o acesso guardado desta conta (a TOKEN_ENC_KEY mudou?). Conecte a conta de novo em Contas.");
  }
}

/** Grava as publicações e um snapshot de métricas para cada uma. Devolve quantas publicações são novas. */
export function salvarColeta(contaId: number, rede: Rede, itens: Coletada[], fonte: "api" | "manual" = "api") {
  const d = db();
  let novas = 0;
  for (const { publicacao: p, metricas: m } of itens) {
    let pub = d.select().from(publicacoes).where(and(eq(publicacoes.contaId, contaId), eq(publicacoes.idExterno, p.idExterno))).get();
    if (!pub) { pub = d.insert(publicacoes).values({ contaId, rede, idExterno: p.idExterno, titulo: p.titulo, url: p.url, publicadoEm: p.publicadoEm }).returning().get(); novas++; }
    else if (p.titulo && pub.titulo !== p.titulo) d.update(publicacoes).set({ titulo: p.titulo, url: p.url || pub.url }).where(eq(publicacoes.id, pub.id)).run();
    d.insert(metricasSnapshot).values({ publicacaoId: pub.id, views: m.views, curtidas: m.curtidas, comentarios: m.comentarios, compartilhamentos: m.compartilhamentos, salvamentos: m.salvamentos, alcance: m.alcance, tempoMedio: m.tempoMedio, retencao: m.retencao, seguidoresGanhos: m.seguidoresGanhos, fonte }).run();
  }
  return novas;
}

/** Salva a conta com tokens cifrados. */
export function criarConta(perfilId: number, rede: Rede, nome: string, tokens: { accessToken: string; refreshToken?: string; expiraEm?: Date }, extra: Record<string, string>, idExterno?: string) {
  const d = db();
  const ja = idExterno ? d.select().from(contasSociais).where(and(eq(contasSociais.perfilId, perfilId), eq(contasSociais.rede, rede), eq(contasSociais.idExterno, idExterno))).get() : undefined;
  const valores = { tokenCriptografado: cifrar(tokens.accessToken), refreshTokenCriptografado: tokens.refreshToken ? cifrar(tokens.refreshToken) : null, expiraEm: tokens.expiraEm ?? null, extra: JSON.stringify(extra), nomeExibicao: nome, erro: null };
  if (ja) { d.update(contasSociais).set(valores).where(eq(contasSociais.id, ja.id)).run(); return ja.id; }
  return d.insert(contasSociais).values({ perfilId, rede, idExterno: idExterno ?? null, ...valores }).returning().get().id;
}

/** Credenciais prontas para uso: renova o token 5 minutos antes de vencer (YouTube e TikTok). O da Meta dura ~60 dias e precisa de nova conexão depois. */
export async function credenciaisAtualizadas(conta: typeof contasSociais.$inferSelect): Promise<Credenciais> {
  const rede = conta.rede as Rede;
  let cred = credenciaisDaConta(conta);
  if (!cred) throw new Error("conta sem token (cadastrada à mão): use a entrada manual ou conecte pela rede");
  if (cred.expiraEm && cred.expiraEm.getTime() < Date.now() + 5 * 60_000) {
    if (!cred.refreshToken) throw new Error("o acesso expirou: conecte a conta de novo");
    const app = configApp(rede);
    if (!app) throw new Error("faltam as credenciais do app desta rede no .env.local (necessárias para renovar o acesso)");
    const novo = rede === "youtube" ? await youtube.renovar(app, cred.refreshToken, cred.extra) : await tiktok.renovar(app, cred.refreshToken, cred.extra);
    db().update(contasSociais).set({ tokenCriptografado: cifrar(novo.accessToken), refreshTokenCriptografado: novo.refreshToken ? cifrar(novo.refreshToken) : conta.refreshTokenCriptografado, expiraEm: novo.expiraEm ?? null }).where(eq(contasSociais.id, conta.id)).run();
    cred = { ...cred, accessToken: novo.accessToken, refreshToken: novo.refreshToken ?? cred.refreshToken, expiraEm: novo.expiraEm };
  }
  return cred;
}

/** Coleta uma conta: renova o token se preciso, lê publicações e métricas, grava o histórico. Nunca lança: registra o erro na conta. */
export async function coletarConta(contaId: number): Promise<{ ok: boolean; novas: number; total: number; erro?: string }> {
  const d = db();
  const conta = d.select().from(contasSociais).where(eq(contasSociais.id, contaId)).get();
  if (!conta) return { ok: false, novas: 0, total: 0, erro: "conta inexistente" };
  const rede = conta.rede as Rede;
  try {
    const cred = await credenciaisAtualizadas(conta);
    let itens: Coletada[] = [];
    if (rede === "youtube") {
      itens = await youtube.listar(cred.accessToken, cred.extra.uploads, 100);
      for (const [i, it] of itens.slice(0, 40).entries()) {
        try { itens[i] = { ...it, metricas: await youtube.complementar(cred.accessToken, it.publicacao.idExterno, it.publicacao.publicadoEm, it.metricas) }; } catch { /* Analytics é opcional: ficam as contagens públicas */ }
      }
    } else if (rede === "tiktok") itens = await tiktok.listar(cred.accessToken, 100);
    else if (rede === "instagram") {
      if (!cred.extra.igUserId) throw new Error("conta sem o id do Instagram: conecte de novo");
      itens = await instagram.listar(cred.accessToken, cred.extra.igUserId, 60);
    } else throw new Error("o Facebook ainda não tem coleta automática: use a entrada manual");
    const novas = salvarColeta(conta.id, rede, itens);
    d.update(contasSociais).set({ ultimaColeta: new Date(), erro: null }).where(eq(contasSociais.id, conta.id)).run();
    return { ok: true, novas, total: itens.length };
  } catch (e) {
    const erro = String((e as Error).message).slice(0, 300);
    d.update(contasSociais).set({ erro }).where(eq(contasSociais.id, conta.id)).run();
    return { ok: false, novas: 0, total: 0, erro };
  }
}

/** Coleta todas as contas com token (usada a cada hora e no botão "Atualizar agora"). */
export async function coletarTodas() {
  const contas = db().select().from(contasSociais).all().filter((c) => c.tokenCriptografado && temColetaAutomatica(c.rede as Rede));
  const r = [];
  for (const c of contas) r.push({ conta: c.id, ...(await coletarConta(c.id)) });
  return r;
}

/** Conta "manual" de uma rede para um perfil (sem token): serve para cadastrar publicações e métricas à mão ou por CSV. */
export function contaManual(perfilId: number, rede: Rede, nome?: string) {
  const d = db();
  const ja = d.select().from(contasSociais).where(and(eq(contasSociais.perfilId, perfilId), eq(contasSociais.rede, rede))).all().find((c) => !c.tokenCriptografado);
  if (ja) return ja.id;
  return d.insert(contasSociais).values({ perfilId, rede, nomeExibicao: nome ?? `${NOMES_REDE[rede]} (manual)` }).returning().get().id;
}
