// Teste de integração do agendador com a rede simulada: nenhuma chamada real, tudo em banco em memória.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

test("agendador: publica por rede, falha parcial, não duplica, tentar de novo e cancelar", async () => {
  process.env.TOKEN_ENC_KEY = "k".repeat(40);
  process.env.DATABASE_PATH = ":memory:";
  const { usarFetch } = await import("@estudio/redes");
  const { db } = await import("./db");
  const { criarConta } = await import("./redes");
  const ag = await import("./agendador");
  const { perfis, roteiros, videos, versoesVideo, posts, postsRede, publicacoes, metricasSnapshot } = await import("@estudio/db");
  const { eq } = await import("drizzle-orm");

  const d = db();
  const perfil = d.insert(perfis).values({ nome: "P" }).returning().get();
  const rot = d.insert(roteiros).values({ perfilId: perfil.id, titulo: "R" }).returning().get();
  const vid = d.insert(videos).values({ roteiroId: rot.id, titulo: "Vídeo" }).returning().get();
  const arq = path.join(mkdtempSync(path.join(tmpdir(), "ag-")), "v.mp4");
  writeFileSync(arq, Buffer.alloc(2048, 1));
  const ver = d.insert(versoesVideo).values({ videoId: vid.id, numero: 1, status: "pronto", arquivoVideo: arq }).returning().get();

  const longe = new Date(Date.now() + 86_400_000);
  const yt = criarConta(perfil.id, "youtube", "Canal", { accessToken: "ytok", expiraEm: longe }, {}, "c1");
  const ig = criarConta(perfil.id, "instagram", "@conta", { accessToken: "usertok", expiraEm: longe }, { igUserId: "ig1", pageToken: "pagetok" }, "ig1");
  const tt = criarConta(perfil.id, "tiktok", "Tik", { accessToken: "tttok", expiraEm: longe }, {}, "o1");
  const fb = criarConta(perfil.id, "facebook", "Página", { accessToken: "fbtok", expiraEm: longe }, { pageId: "p1" }, "p1");

  const chamadas: { url: string; auth?: string }[] = [];
  usarFetch((async (u: unknown, init?: RequestInit) => {
    const url = String(u);
    const h = (init?.headers ?? {}) as Record<string, string>;
    chamadas.push({ url, auth: h.authorization });
    const ok = (o: unknown, extra: ResponseInit = {}) => new Response(JSON.stringify(o), extra);
    if (url.includes("uploadType=resumable")) return ok({}, { headers: { location: "https://upload.yt/s1" } });
    if (url.includes("upload.yt/s1")) return ok({ id: "yt123", status: { privacyStatus: "private" } });
    if (url.includes("/ig1/media_publish")) return ok({ id: "igm1" });
    if (url.includes("/ig1/media")) return ok({ id: "cont" });
    if (url.includes("rupload.facebook.com")) return ok({ success: true });
    if (url.includes("/cont?")) return ok({ status_code: "FINISHED" });
    if (url.includes("/igm1?")) return ok({ permalink: "https://instagram.com/reel/r1" });
    if (url.includes("inbox/video/init")) return ok({ data: { publish_id: "pub1", upload_url: "https://upload.tt/u" }, error: { code: "ok" } });
    if (url.includes("upload.tt")) return ok("", { status: 201 });
    if (url.includes("status/fetch")) return ok({ data: { status: "SEND_TO_USER_INBOX" } });
    return ok({ error: { message: "sem regra para " + url } }, { status: 404 });
  }) as typeof fetch);

  const criar = (quando: Date, redes: [number, string][]) => {
    const p = d.insert(posts).values({ versaoId: ver.id, legendaBase: "Legenda comum #psicologia", agendadoPara: quando }).returning().get();
    for (const [contaId, rede] of redes) d.insert(postsRede).values({ postId: p.id, contaId, rede: rede as "youtube", titulo: rede === "youtube" ? "Título do YouTube" : null }).run();
    return p.id;
  };

  // 1) post vencido em todas as redes: YouTube, Instagram e TikTok concluem; o Facebook falha com explicação (sem publicação automática)
  const passado = criar(new Date(Date.now() - 60_000), [[yt, "youtube"], [ig, "instagram"], [tt, "tiktok"], [fb, "facebook"]]);
  const futuro = criar(new Date(Date.now() + 3_600_000), [[yt, "youtube"]]);
  assert.equal(await ag.processarPendentes(), 1, "só o post vencido é processado");
  const dests = d.select().from(postsRede).where(eq(postsRede.postId, passado)).all();
  const por = Object.fromEntries(dests.map((x) => [x.rede, x]));
  assert.equal(por.youtube.status, "concluido"); assert.equal(por.youtube.idExterno, "yt123");
  assert.equal(por.instagram.status, "concluido"); assert.equal(por.instagram.url, "https://instagram.com/reel/r1");
  assert.equal(por.tiktok.status, "concluido"); assert.equal(por.tiktok.idExterno, "pub1");
  assert.equal(por.facebook.status, "falhou"); assert.match(por.facebook.erro!, /Poste à mão/);
  assert.equal(d.select().from(posts).where(eq(posts.id, passado)).get()!.status, "parcial");
  assert.equal(d.select().from(posts).where(eq(posts.id, futuro)).get()!.status, "agendado", "o post futuro não foi tocado");
  assert.ok(chamadas.some((c) => c.url.includes("rupload") && c.auth === "OAuth pagetok"), "o Instagram usa o token da Página");

  // 2) YouTube e Instagram entram nas métricas, ligados ao vídeo; o TikTok (rascunho) não
  const pubs = d.select().from(publicacoes).all();
  assert.deepEqual(pubs.map((p) => p.rede).sort(), ["instagram", "youtube"]);
  assert.ok(pubs.every((p) => p.videoId === vid.id));
  assert.equal(d.select().from(metricasSnapshot).all().length, 2);

  // 3) rodar de novo não duplica nada
  const antes = chamadas.length;
  await ag.processarPendentes();
  assert.equal(chamadas.length, antes, "nenhuma nova chamada de rede");

  // 4) tentar de novo o destino que falhou: continua falhando pelo mesmo motivo, sem afetar os outros
  await ag.tentarDeNovo(por.facebook.id);
  const fb2 = d.select().from(postsRede).where(eq(postsRede.id, por.facebook.id)).get()!;
  assert.equal(fb2.status, "falhou"); assert.equal(fb2.tentativas, 2);
  assert.equal(d.select().from(postsRede).where(eq(postsRede.id, por.youtube.id)).get()!.tentativas, 1, "o que já concluiu não é reenviado");

  // 5) cancelar o post futuro; não dá para cancelar o que já publicou
  assert.equal(ag.cancelarPost(futuro), true);
  assert.equal(d.select().from(posts).where(eq(posts.id, futuro)).get()!.status, "cancelado");
  assert.equal(d.select().from(postsRede).where(eq(postsRede.postId, futuro)).get()!.status, "cancelado");
  assert.equal(ag.cancelarPost(passado), false, "post que já publicou em alguma rede não pode ser cancelado");

  // 5b) falha de rede no YouTube: erro registrado, post falhou, notificação criada
  usarFetch((async () => new Response(JSON.stringify({ error: { message: "quotaExceeded" } }), { status: 403 })) as typeof fetch);
  const p3 = criar(new Date(Date.now() - 1000), [[yt, "youtube"]]);
  await ag.processarPendentes();
  const d3 = d.select().from(postsRede).where(eq(postsRede.postId, p3)).get()!;
  assert.equal(d3.status, "falhou"); assert.match(d3.erro!, /403 quotaExceeded/);
  assert.equal(d.select().from(posts).where(eq(posts.id, p3)).get()!.status, "falhou");

  // 6) legenda acima do limite do Instagram é recusada antes de enviar
  const antes2 = chamadas.length;
  const longa = d.insert(posts).values({ versaoId: ver.id, legendaBase: "x".repeat(2300), agendadoPara: new Date(Date.now() - 1000) }).returning().get();
  d.insert(postsRede).values({ postId: longa.id, contaId: ig, rede: "instagram" }).run();
  await ag.processarPendentes();
  assert.match(d.select().from(postsRede).where(eq(postsRede.postId, longa.id)).get()!.erro!, /limite de 2200/);
  assert.equal(chamadas.length, antes2, "não chegou a falar com a rede");
});
