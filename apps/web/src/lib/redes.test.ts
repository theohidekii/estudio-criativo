// Teste de integração da coleta: criptografia dos tokens + renovação + histórico no banco, com a rede simulada (nenhuma chamada real).
import assert from "node:assert/strict";
import { test } from "node:test";

test("coleta: renova o token, grava o histórico sem duplicar e registra erros", async () => {
  process.env.TOKEN_ENC_KEY = "k".repeat(40);
  process.env.DATABASE_PATH = ":memory:";
  process.env.TIKTOK_CLIENT_KEY = "ck";
  process.env.TIKTOK_CLIENT_SECRET = "cs";
  const { usarFetch } = await import("@estudio/redes");
  const { db } = await import("./db");
  const { criarConta, coletarConta, credenciaisDaConta } = await import("./redes");
  const { perfis, contasSociais, metricasSnapshot, publicacoes } = await import("@estudio/db");
  const { eq } = await import("drizzle-orm");

  const d = db();
  const perfil = d.insert(perfis).values({ nome: "P" }).returning().get();
  // token já vencido + refresh token: a coleta precisa renovar antes de listar
  const contaId = criarConta(perfil.id, "tiktok", "teste", { accessToken: "antigo", refreshToken: "refresh-1", expiraEm: new Date(Date.now() - 1000) }, { openId: "o1" }, "o1");
  const bruta = d.select().from(contasSociais).where(eq(contasSociais.id, contaId)).get()!;
  assert.ok(!bruta.tokenCriptografado!.includes("antigo"), "o token não pode ficar em texto puro no banco");
  assert.equal(credenciaisDaConta(bruta)!.accessToken, "antigo");

  const chamadas: string[] = [];
  let views = 1000;
  usarFetch((async (u: unknown, init?: RequestInit) => {
    const url = String(u); chamadas.push(url);
    if (url.includes("oauth/token")) return new Response(JSON.stringify({ access_token: "novo", refresh_token: "refresh-2", expires_in: 86400 }));
    assert.equal((init!.headers as Record<string, string>).authorization, "Bearer novo", "a listagem deve usar o token renovado");
    views += 500;
    return new Response(JSON.stringify({ data: { videos: [{ id: "v1", title: "Um", create_time: 1760000000, share_url: "https://tt/v1", view_count: views, like_count: 10, comment_count: 1, share_count: 2 }], has_more: false } }));
  }) as typeof fetch);

  const r1 = await coletarConta(contaId);
  assert.deepEqual([r1.ok, r1.novas, r1.total], [true, 1, 1], JSON.stringify(r1));
  assert.ok(chamadas[0].includes("oauth/token"), "renovou o token primeiro");
  const r2 = await coletarConta(contaId);
  assert.deepEqual([r2.ok, r2.novas], [true, 0], "a segunda coleta não duplica a publicação");

  assert.equal(d.select().from(publicacoes).all().length, 1);
  const snaps = d.select().from(metricasSnapshot).all();
  assert.equal(snaps.length, 2, "cada coleta soma um ponto ao histórico");
  assert.deepEqual(snaps.map((s) => s.views).sort(), [1500, 2000]);
  assert.equal(snaps[0].tempoMedio, null, "o TikTok não informa tempo médio");
  const depois = d.select().from(contasSociais).where(eq(contasSociais.id, contaId)).get()!;
  assert.equal(credenciaisDaConta(depois)!.accessToken, "novo");
  assert.equal(credenciaisDaConta(depois)!.refreshToken, "refresh-2");
  assert.ok(depois.ultimaColeta && !depois.erro);

  // a rede falha: o erro fica na conta e a coleta não lança
  usarFetch((async () => new Response(JSON.stringify({ error: { message: "rate limit" } }), { status: 429 })) as typeof fetch);
  const r3 = await coletarConta(contaId);
  assert.equal(r3.ok, false);
  assert.match(d.select().from(contasSociais).where(eq(contasSociais.id, contaId)).get()!.erro!, /429/);

  // conta manual (sem token) não tenta falar com a rede
  const manual = d.insert(contasSociais).values({ perfilId: perfil.id, rede: "instagram", nomeExibicao: "M" }).returning().get();
  const r4 = await coletarConta(manual.id);
  assert.equal(r4.ok, false);
  assert.match(r4.erro!, /sem token/);
});
