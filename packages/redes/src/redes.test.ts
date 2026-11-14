import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cifrar, decifrar, instagram, lerCsv, tiktok, usarFetch, vazias, youtube } from "./index";

const resposta = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });
/** fetch simulado: cada regra casa por trecho da URL; guarda as URLs chamadas. */
function simular(regras: [string, (url: string, init?: RequestInit) => unknown | Response][]) {
  const chamadas: string[] = [];
  usarFetch((async (u: any, init?: RequestInit) => {
    const url = String(u);
    chamadas.push(url);
    for (const [trecho, f] of regras) if (url.includes(trecho)) { const r = f(url, init); return r instanceof Response ? r : resposta(r); }
    return resposta({ error: { message: "sem regra" } }, 404);
  }) as typeof fetch);
  return chamadas;
}
afterEach(() => usarFetch((...a) => fetch(...a)));

test("criptografia: ida e volta, e falha com chave errada", () => {
  process.env.TOKEN_ENC_KEY = "a".repeat(40);
  const c = cifrar("token-secreto");
  assert.notEqual(c, "token-secreto");
  assert.equal(decifrar(c), "token-secreto");
  process.env.TOKEN_ENC_KEY = "b".repeat(40);
  assert.throws(() => decifrar(c));
});

test("csv: separador ; vírgula decimal, data brasileira e erro de rede inválida", () => {
  const { linhas, erros } = lerCsv("Rede;Título;URL;Data;Views;Curtidas;Tempo médio\ninstagram;Maníaco;https://x;14/11/2026;12.500;300;7,5\nmyspace;Outro;;;1;1;1");
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].metricas.views, 12500);
  assert.equal(linhas[0].metricas.tempoMedio, 7.5);
  assert.equal(linhas[0].publicadoEm?.toISOString().slice(0, 10), "2026-11-14");
  assert.match(erros[0], /Linha 3.*myspace/);
  assert.equal(lerCsv("a,b\n1,2").erros.length, 1);
});

test("youtube: lista com paginação e complementa com Analytics", async () => {
  const chamadas = simular([
    ["playlistItems", (url) => (url.includes("pageToken") ? { items: [{ contentDetails: { videoId: "v3" } }] } : { items: [{ contentDetails: { videoId: "v1" } }, { contentDetails: { videoId: "v2" } }], nextPageToken: "p2" })],
    ["/youtube/v3/videos", () => ({ items: ["v1", "v2", "v3"].map((id, i) => ({ id, snippet: { title: `Vídeo ${id}`, publishedAt: "2026-10-01T10:00:00Z" }, statistics: { viewCount: String(1000 * (i + 1)), likeCount: "50", commentCount: "5" } })) })],
    ["youtubeanalytics", () => ({ rows: [[1200, 900, 18.5, 61.2, 60, 6, 14, 3]] })],
  ]);
  const lista = await youtube.listar("tok", "UU123");
  assert.equal(lista.length, 3);
  assert.equal(lista[1].metricas.views, 2000);
  assert.equal(lista[0].publicacao.url, "https://www.youtube.com/watch?v=v1");
  const m = await youtube.complementar("tok", "v1", lista[0].publicacao.publicadoEm, lista[0].metricas);
  assert.equal(m.tempoMedio, 18.5);
  assert.equal(m.retencao, 61.2);
  assert.equal(m.compartilhamentos, 14);
  assert.equal(m.seguidoresGanhos, 3);
  assert.equal(m.views, 1200);
  assert.ok(chamadas.some((u) => u.includes("filters=video%3D%3Dv1")));
});

test("youtube: erro da API não vaza o token na mensagem", async () => {
  simular([["playlistItems", () => resposta({ error: { message: "Quota exceeded" } }, 403)]]);
  await assert.rejects(() => youtube.listar("segredo-123", "UU1"), (e: Error) => /403/.test(e.message) && /Quota/.test(e.message) && !e.message.includes("segredo-123"));
});

test("tiktok: pagina com cursor e deixa tempo médio e retenção como null", async () => {
  let pagina = 0;
  const chamadas = simular([["video/list", (_u, init) => {
    pagina++;
    const corpo = JSON.parse(String(init?.body));
    if (pagina === 1) { assert.equal(corpo.cursor, undefined); return { data: { videos: [{ id: "a", title: "Um", create_time: 1760000000, share_url: "https://tt/a", view_count: 500, like_count: 40, comment_count: 3, share_count: 2 }], cursor: 777, has_more: true } }; }
    assert.equal(corpo.cursor, 777);
    return { data: { videos: [{ id: "b", view_count: 10 }], has_more: false } };
  }]]);
  const lista = await tiktok.listar("tok");
  assert.equal(lista.length, 2);
  assert.equal(lista[0].metricas.compartilhamentos, 2);
  assert.equal(lista[0].metricas.tempoMedio, null);
  assert.equal(lista[0].metricas.retencao, null);
  assert.equal(lista[1].metricas.views, 10);
  assert.ok(chamadas[0].includes("fields=id,title,create_time,share_url,view_count"));
});

test("instagram: converte o tempo médio de ms para s e usa só as métricas do tipo de mídia", async () => {
  const chamadas = simular([
    ["/media?", () => ({ data: [{ id: "m1", caption: "Primeira linha\nsegunda", media_product_type: "REELS", permalink: "https://ig/m1", timestamp: "2026-10-05T12:00:00+0000", like_count: 80, comments_count: 4 }] })],
    ["/m1/insights", () => ({ data: [{ name: "views", values: [{ value: 5000 }] }, { name: "reach", values: [{ value: 3200 }] }, { name: "likes", values: [{ value: 90 }] }, { name: "saved", values: [{ value: 12 }] }, { name: "shares", values: [{ value: 7 }] }, { name: "comments", values: [{ value: 5 }] }, { name: "ig_reels_avg_watch_time", values: [{ value: 8400 }] }] })],
  ]);
  const lista = await instagram.listar("tok", "ig1");
  assert.equal(lista[0].publicacao.titulo, "Primeira linha");
  assert.equal(lista[0].metricas.views, 5000);
  assert.equal(lista[0].metricas.alcance, 3200);
  assert.equal(lista[0].metricas.tempoMedio, 8.4);
  assert.equal(lista[0].metricas.salvamentos, 12);
  assert.ok(chamadas.some((u) => u.includes("ig_reels_avg_watch_time")));
});

test("instagram: se a Meta recusar a métrica, cai no conjunto básico e mantém as contagens da lista", async () => {
  let tentativas = 0;
  simular([
    ["/media?", () => ({ data: [{ id: "m2", media_product_type: "FEED", like_count: 20, comments_count: 2 }] })],
    ["/m2/insights", (url) => { tentativas++; return url.includes("views") ? resposta({ error: { message: "metric not supported" } }, 400) : { data: [{ name: "reach", values: [{ value: 400 }] }] }; }],
  ]);
  const lista = await instagram.listar("tok", "ig1");
  assert.equal(tentativas, 2);
  assert.equal(lista[0].metricas.alcance, 400);
  assert.equal(lista[0].metricas.curtidas, 20);
  assert.equal(lista[0].metricas.tempoMedio, null);
});

test("vazias(): campos que a rede não informa começam null, não 0", () => {
  const m = vazias();
  assert.equal(m.alcance, null); assert.equal(m.tempoMedio, null); assert.equal(m.retencao, null); assert.equal(m.views, 0);
});

test("tiktok: resposta 200 com erro no corpo vira erro claro (sem seguir com token undefined)", async () => {
  simular([["oauth/token", () => ({ error: "invalid_grant", error_description: "Refresh token is expired" })]]);
  await assert.rejects(() => tiktok.renovar({ clientId: "a", clientSecret: "b" }, "r", {}), /Refresh token is expired/);
  simular([["oauth/token", () => ({})]]);
  await assert.rejects(() => tiktok.trocarCodigo({ clientId: "a", clientSecret: "b" }, "http://x", "c"), /sem access_token/);
});

test("youtube: troca de token sem access_token falha com mensagem clara", async () => {
  simular([["oauth2.googleapis.com/token", () => ({ expires_in: 3600 })]]);
  await assert.rejects(() => youtube.renovar({ clientId: "a", clientSecret: "b" }, "r", {}), /sem access_token/);
});
