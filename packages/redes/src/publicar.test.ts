import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { enviarRascunhoTiktok, planoDePartes, publicarReelInstagram, publicarYoutube, usarFetch } from "./index";

type Regra = [string, (url: string, init?: RequestInit) => Response | unknown];
function simular(regras: Regra[]) {
  const chamadas: { url: string; init?: RequestInit }[] = [];
  usarFetch((async (u: unknown, init?: RequestInit) => {
    const url = String(u);
    chamadas.push({ url, init });
    for (const [trecho, f] of regras) if (url.includes(trecho)) { const r = f(url, init); return r instanceof Response ? r : new Response(JSON.stringify(r)); }
    return new Response(JSON.stringify({ error: { message: "sem regra" } }), { status: 404 });
  }) as typeof fetch);
  return chamadas;
}
afterEach(() => usarFetch((...a) => fetch(...a)));
const sem = async () => {};
const arquivo = new Uint8Array(1234).fill(7);

test("youtube: sessão resumível, privado por padrão, título limpo e status devolvido pelo YouTube", async () => {
  const c = simular([
    ["uploadType=resumable", () => new Response("{}", { status: 200, headers: { location: "https://upload.exemplo/sessao123" } })],
    ["upload.exemplo/sessao123", () => ({ id: "abc", status: { privacyStatus: "private" } })],
  ]);
  const r = await publicarYoutube("tok", { arquivo, titulo: "  Olá <script> mundo  ", descricao: "desc", privacidade: "private" });
  assert.deepEqual(r, { id: "abc", url: "https://www.youtube.com/watch?v=abc", privacidade: "private" });
  const meta = JSON.parse(String(c[0].init!.body));
  assert.equal(meta.snippet.title, "Olá script mundo");
  assert.equal(meta.status.privacyStatus, "private");
  assert.equal((c[0].init!.headers as Record<string, string>)["x-upload-content-length"], "1234");
  assert.equal((c[1].init!.body as Uint8Array).byteLength, 1234);
});

test("youtube: sem Location na resposta falha com mensagem clara; erro HTTP traz o motivo", async () => {
  simular([["uploadType=resumable", () => new Response("{}", { status: 200 })]]);
  await assert.rejects(() => publicarYoutube("t", { arquivo, titulo: "a", descricao: "", privacidade: "private" }), /não trouxe o endereço da sessão/);
  simular([["uploadType=resumable", () => new Response(JSON.stringify({ error: { message: "quotaExceeded" } }), { status: 403 })]]);
  await assert.rejects(() => publicarYoutube("t", { arquivo, titulo: "a", descricao: "", privacidade: "private" }), /403 quotaExceeded/);
});

test("instagram: contêiner, upload com cabeçalhos corretos, espera o processamento e publica", async () => {
  let consultas = 0;
  const c = simular([
    ["/ig1/media_publish", () => ({ id: "m99" })],
    ["/ig1/media", () => ({ id: "cont1" })],
    ["rupload.facebook.com", () => ({ success: true })],
    ["/cont1?", () => ({ status_code: ++consultas < 3 ? "IN_PROGRESS" : "FINISHED" })],
    ["/m99?", () => ({ permalink: "https://instagram.com/reel/xyz" })],
  ]);
  const r = await publicarReelInstagram("tokP", "ig1", { arquivo, legenda: "Minha legenda" }, { esperar: sem });
  assert.deepEqual(r, { id: "m99", url: "https://instagram.com/reel/xyz" });
  assert.equal(consultas, 3);
  const criar = new URLSearchParams(String(c[0].init!.body));
  assert.equal(criar.get("media_type"), "REELS");
  assert.equal(criar.get("upload_type"), "resumable");
  assert.equal(criar.get("caption"), "Minha legenda");
  const up = c.find((x) => x.url.includes("rupload"))!;
  assert.deepEqual({ ...(up.init!.headers as Record<string, string>) }, { authorization: "OAuth tokP", offset: "0", file_size: "1234" });
  const ordem = c.map((x) => (x.url.includes("rupload") ? "upload" : x.url.includes("media_publish") ? "publicar" : x.url.includes("status_code") ? "status" : x.url.includes("/ig1/media") ? "criar" : "link"));
  assert.deepEqual(ordem.filter((o, i) => ordem.indexOf(o) === i), ["criar", "upload", "status", "publicar", "link"]);
});

test("instagram: ERROR no processamento e espera esgotada viram erros claros, sem publicar", async () => {
  const c = simular([["/ig1/media_publish", () => ({ id: "x" })], ["/ig1/media", () => ({ id: "c" })], ["rupload", () => ({ success: true })], ["/c?", () => ({ status_code: "ERROR", status: "formato inválido" })]]);
  await assert.rejects(() => publicarReelInstagram("t", "ig1", { arquivo, legenda: "" }, { esperar: sem }), /ERROR \(formato inválido\)/);
  assert.ok(!c.some((x) => x.url.includes("media_publish")), "não pode publicar depois do erro");
  simular([["/ig1/media", () => ({ id: "c" })], ["rupload", () => ({ success: true })], ["/c?", () => ({ status_code: "IN_PROGRESS" })]]);
  await assert.rejects(() => publicarReelInstagram("t", "ig1", { arquivo, legenda: "" }, { esperar: sem, tentativas: 3 }), /ainda estava processando/);
});

test("instagram: upload recusado interrompe antes de publicar", async () => {
  simular([["/ig1/media", () => ({ id: "c" })], ["rupload", () => new Response(JSON.stringify({ success: false, debug_info: { message: "arquivo inválido" } }), { status: 400 })]]);
  await assert.rejects(() => publicarReelInstagram("t", "ig1", { arquivo, legenda: "" }, { esperar: sem }), /arquivo inválido/);
});

test("tiktok: plano de partes (inteiro até 10 MB; acima, partes de 10 MB com o resto na última)", () => {
  const MB = 1024 * 1024;
  assert.deepEqual(planoDePartes(3 * MB), { parte: 3 * MB, total: 1 });
  assert.deepEqual(planoDePartes(10 * MB), { parte: 10 * MB, total: 1 });
  assert.deepEqual(planoDePartes(25 * MB), { parte: 10 * MB, total: 2 });
  assert.deepEqual(planoDePartes(30 * MB), { parte: 10 * MB, total: 3 });
});

test("tiktok: envia as partes com Content-Range correto e espera chegar na caixa de entrada", async () => {
  const MB = 1024 * 1024, grande = new Uint8Array(25 * MB);
  let st = 0;
  const c = simular([
    ["inbox/video/init", () => ({ data: { publish_id: "p1", upload_url: "https://upload.tt/x?id=1" }, error: { code: "ok" } })],
    ["upload.tt", () => new Response("", { status: 201 })],
    ["status/fetch", () => ({ data: { status: ++st < 2 ? "PROCESSING_UPLOAD" : "SEND_TO_USER_INBOX" } })],
  ]);
  const r = await enviarRascunhoTiktok("tk", { arquivo: grande }, { esperar: sem });
  assert.deepEqual(r, { id: "p1", estado: "SEND_TO_USER_INBOX" });
  const corpo = JSON.parse(String(c[0].init!.body));
  assert.deepEqual(corpo.source_info, { source: "FILE_UPLOAD", video_size: 25 * MB, chunk_size: 10 * MB, total_chunk_count: 2 });
  const puts = c.filter((x) => x.url.includes("upload.tt"));
  assert.equal(puts.length, 2);
  assert.equal((puts[0].init!.headers as Record<string, string>)["content-range"], `bytes 0-${10 * MB - 1}/${25 * MB}`);
  assert.equal((puts[1].init!.headers as Record<string, string>)["content-range"], `bytes ${10 * MB}-${25 * MB - 1}/${25 * MB}`);
  assert.equal((puts[1].init!.headers as Record<string, string>)["content-length"], String(15 * MB));
});

test("tiktok: erro na abertura (código diferente de ok) e FAILED no status viram erros claros", async () => {
  simular([["inbox/video/init", () => ({ error: { code: "scope_not_authorized", message: "falta o escopo video.upload" } })]]);
  await assert.rejects(() => enviarRascunhoTiktok("t", { arquivo }, { esperar: sem }), /falta o escopo video.upload/);
  simular([
    ["inbox/video/init", () => ({ data: { publish_id: "p", upload_url: "https://upload.tt/y" }, error: { code: "ok" } })],
    ["upload.tt", () => new Response("", { status: 201 })],
    ["status/fetch", () => ({ data: { status: "FAILED", fail_reason: "duration_check_failed" } })],
  ]);
  await assert.rejects(() => enviarRascunhoTiktok("t", { arquivo }, { esperar: sem }), /duration_check_failed/);
});
