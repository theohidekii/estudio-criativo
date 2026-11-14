// Agendador: publica os posts na hora marcada, rede por rede. Sem tentativa automática: se um envio falha no meio, repetir sozinho
// poderia duplicar o vídeo na rede; por isso quem decide tentar de novo é a pessoa (botão), depois de conferir.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, lte } from "drizzle-orm";
import { enviarRascunhoTiktok, publicarReelInstagram, publicarYoutube, vazias, type Rede } from "@estudio/redes";
import { contasSociais, notificacoes, posts, postsRede, publicacoes, versoesVideo } from "@estudio/db";
import { db } from "./db";
import { credenciaisAtualizadas, NOMES_REDE, salvarColeta } from "./redes";

export const publicaAutomatico = (rede: Rede) => rede !== "facebook";
export const LIMITE_LEGENDA: Record<Rede, number> = { instagram: 2200, tiktok: 2200, youtube: 5000, facebook: 63000 };

const raiz = () => path.resolve(process.cwd(), "../..");
/** Lê o MP4 renderizado de uma versão (importada do acervo ou gerada no sistema). */
export async function lerVideoDaVersao(versaoId: number): Promise<Uint8Array> {
  const v = db().select().from(versoesVideo).where(eq(versoesVideo.id, versaoId)).get();
  if (!v) throw new Error("versão do vídeo não encontrada");
  const arquivo = v.arquivoVideo ?? path.join(raiz(), "storage", "videos", String(v.videoId), `v${v.numero}`, "video.mp4");
  try { return new Uint8Array(await readFile(arquivo)); } catch { throw new Error("o vídeo desta versão ainda não foi renderizado (ou o arquivo sumiu)"); }
}

/** Recalcula o status do post pelo estado dos seus destinos. */
export function atualizarStatusPost(postId: number) {
  const d = db();
  const ds = d.select().from(postsRede).where(eq(postsRede.postId, postId)).all().filter((x) => x.status !== "cancelado");
  const post = d.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post || post.status === "cancelado") return;
  const n = (s: string) => ds.filter((x) => x.status === s).length;
  let status: (typeof posts.$inferSelect)["status"] = "agendado";
  if (ds.length === 0) status = "cancelado";
  else if (n("publicando") > 0) status = "publicando";
  else if (n("pendente") > 0) status = n("concluido") + n("falhou") > 0 ? "parcial" : "agendado";
  else if (n("concluido") === ds.length) status = "concluido";
  else if (n("falhou") === ds.length) status = "falhou";
  else status = "parcial";
  d.update(posts).set({ status }).where(eq(posts.id, postId)).run();
}

/** Publica um destino (uma conta) de um post. Nunca lança: o resultado fica no próprio destino. */
export async function publicarDestino(destinoId: number): Promise<void> {
  const d = db();
  const dest = d.select().from(postsRede).where(eq(postsRede.id, destinoId)).get();
  if (!dest || dest.status === "concluido" || dest.status === "publicando") return;
  const post = d.select().from(posts).where(eq(posts.id, dest.postId)).get()!;
  d.update(postsRede).set({ status: "publicando", erro: null, tentativas: dest.tentativas + 1 }).where(eq(postsRede.id, dest.id)).run();
  const rede = dest.rede as Rede;
  try {
    if (!publicaAutomatico(rede)) throw new Error(`${NOMES_REDE[rede]}: a publicação automática ainda não está disponível. Poste à mão e lance as métricas.`);
    const conta = d.select().from(contasSociais).where(eq(contasSociais.id, dest.contaId)).get();
    if (!conta) throw new Error("a conta foi removida");
    const cred = await credenciaisAtualizadas(conta);
    const arquivo = await lerVideoDaVersao(post.versaoId);
    const legenda = (dest.legenda ?? post.legendaBase).trim();
    if (legenda.length > LIMITE_LEGENDA[rede]) throw new Error(`a legenda passa do limite de ${LIMITE_LEGENDA[rede]} caracteres do ${NOMES_REDE[rede]}`);
    let idExterno = "", url = "", titulo = "";
    if (rede === "youtube") {
      titulo = dest.titulo || legenda.split("\n")[0] || "Vídeo";
      const r = await publicarYoutube(cred.accessToken, { arquivo, titulo, descricao: legenda, privacidade: dest.privacidade });
      idExterno = r.id; url = r.url;
    } else if (rede === "instagram") {
      if (!cred.extra.igUserId) throw new Error("conta sem o id do Instagram: conecte de novo");
      const r = await publicarReelInstagram(cred.extra.pageToken ?? cred.accessToken, cred.extra.igUserId, { arquivo, legenda });
      idExterno = r.id; url = r.url; titulo = legenda.split("\n")[0].slice(0, 120);
    } else {
      const r = await enviarRascunhoTiktok(cred.accessToken, { arquivo });
      idExterno = r.id; url = "";
    }
    d.update(postsRede).set({ status: "concluido", idExterno, url, erro: null, publicadoEm: new Date() }).where(eq(postsRede.id, dest.id)).run();
    // Instagram e YouTube: o id devolvido é o do vídeo, então já entra nas métricas (o TikTok vai para o rascunho e entra na próxima importação)
    if (rede === "instagram" || rede === "youtube") {
      const ver = d.select().from(versoesVideo).where(eq(versoesVideo.id, post.versaoId)).get();
      salvarColeta(conta.id, rede, [{ publicacao: { idExterno, titulo, url, publicadoEm: new Date() }, metricas: vazias() }], "api");
      if (ver) { d.update(publicacoes).set({ videoId: ver.videoId }).where(and(eq(publicacoes.contaId, conta.id), eq(publicacoes.idExterno, idExterno))).run(); }
    }
  } catch (e) {
    const erro = String((e as Error).message).slice(0, 400);
    d.update(postsRede).set({ status: "falhou", erro }).where(eq(postsRede.id, dest.id)).run();
    d.insert(notificacoes).values({ titulo: `Falha ao publicar no ${NOMES_REDE[rede]}`, mensagem: erro.slice(0, 300) }).run();
  }
  atualizarStatusPost(dest.postId);
}

async function publicarPost(postId: number) {
  const d = db();
  const post = d.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post || post.status === "cancelado" || post.status === "concluido") return;
  d.update(posts).set({ status: "publicando" }).where(eq(posts.id, postId)).run();
  for (const dest of d.select().from(postsRede).where(and(eq(postsRede.postId, postId), eq(postsRede.status, "pendente"))).all()) await publicarDestino(dest.id);
  atualizarStatusPost(postId);
  const fim = d.select().from(posts).where(eq(posts.id, postId)).get();
  if (fim?.status === "concluido") d.insert(notificacoes).values({ titulo: "Post publicado", mensagem: `Post ${postId} foi publicado em todas as redes marcadas.` }).run();
}

const g = globalThis as { __agendando?: boolean };
/** Publica tudo o que já passou da hora. Protegido contra execuções simultâneas. */
export async function processarPendentes(agora = new Date()) {
  if (g.__agendando) return 0;
  g.__agendando = true;
  try {
    const d = db();
    // envios que ficaram "publicando" há mais de 1 hora (servidor caiu no meio): marca como falha para a pessoa conferir na rede
    for (const p of d.select().from(posts).where(and(eq(posts.status, "publicando"), lte(posts.agendadoPara, new Date(+agora - 3_600_000)))).all()) {
      d.update(postsRede).set({ status: "falhou", erro: "interrompido no meio do envio: confira na rede se o vídeo subiu antes de tentar de novo" }).where(and(eq(postsRede.postId, p.id), eq(postsRede.status, "publicando"))).run();
      atualizarStatusPost(p.id);
    }
    const devidos = d.select().from(posts).where(and(inArray(posts.status, ["agendado", "parcial"]), lte(posts.agendadoPara, agora))).all();
    let n = 0;
    for (const p of devidos) {
      if (!d.select().from(postsRede).where(and(eq(postsRede.postId, p.id), eq(postsRede.status, "pendente"))).get()) continue;
      await publicarPost(p.id); n++;
    }
    return n;
  } finally { g.__agendando = false; }
}

export async function publicarAgora(postId: number) {
  db().update(posts).set({ agendadoPara: new Date() }).where(eq(posts.id, postId)).run();
  await publicarPost(postId);
}

export async function tentarDeNovo(destinoId: number) {
  const d = db();
  const dest = d.select().from(postsRede).where(eq(postsRede.id, destinoId)).get();
  if (!dest || dest.status !== "falhou") return;
  d.update(postsRede).set({ status: "pendente" }).where(eq(postsRede.id, destinoId)).run();
  await publicarDestino(destinoId);
}

export function cancelarPost(postId: number) {
  const d = db();
  const post = d.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post || post.status === "publicando" || post.status === "concluido") return false;
  // já publicou em alguma rede: cancelar esconderia o histórico; a pessoa pode excluir cada destino pendente por outro caminho
  if (d.select().from(postsRede).where(and(eq(postsRede.postId, postId), eq(postsRede.status, "concluido"))).get()) return false;
  d.update(postsRede).set({ status: "cancelado" }).where(and(eq(postsRede.postId, postId), eq(postsRede.status, "pendente"))).run();
  d.update(posts).set({ status: "cancelado" }).where(eq(posts.id, postId)).run();
  return true;
}
