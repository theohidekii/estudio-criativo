// Publicação nas redes. Fluxos conforme a documentação oficial; nenhum deles foi testado com conta real ainda.
import { form, json, bruto } from "./http";

export type Espera = (ms: number) => Promise<void>;
const dormir: Espera = (ms) => new Promise((r) => setTimeout(r, ms));
export type OpcoesEspera = { esperar?: Espera; tentativas?: number; intervaloMs?: number };

const V = "v23.0";

// ---------------------------------------------------------------- YouTube
/** Envia o vídeo pelo upload resumível. A privacidade padrão é "private" (o lado seguro). Devolve o status que o YouTube de fato aplicou. */
export async function publicarYoutube(token: string, a: { arquivo: Uint8Array; titulo: string; descricao: string; privacidade: "private" | "unlisted" | "public" }) {
  const limpo = (t: string) => t.replace(/[<>]/g, "");
  const titulo = limpo(a.titulo).trim().slice(0, 100) || "Vídeo";
  const ini = await bruto("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8", "x-upload-content-type": "video/mp4", "x-upload-content-length": String(a.arquivo.byteLength) },
    body: JSON.stringify({ snippet: { title: titulo, description: limpo(a.descricao).slice(0, 5000), categoryId: "22" }, status: { privacyStatus: a.privacidade, selfDeclaredMadeForKids: false } }),
  });
  if (!ini.ok) throw new Error(`YouTube: iniciar envio: HTTP ${ini.status} ${await motivo(ini)}`);
  const sessao = ini.headers.get("location");
  if (!sessao) throw new Error("YouTube: a resposta não trouxe o endereço da sessão de envio");
  const up = await bruto(sessao, { method: "PUT", headers: { "content-type": "video/mp4", "content-length": String(a.arquivo.byteLength) }, body: a.arquivo as BodyInit });
  if (!up.ok) throw new Error(`YouTube: enviar vídeo: HTTP ${up.status} ${await motivo(up)}`);
  const r = (await up.json()) as { id?: string; status?: { privacyStatus?: string } };
  if (!r.id) throw new Error("YouTube: o envio terminou sem devolver o id do vídeo");
  return { id: r.id, url: `https://www.youtube.com/watch?v=${r.id}`, privacidade: r.status?.privacyStatus ?? a.privacidade };
}

// ---------------------------------------------------------------- Instagram (Reels)
/** Publica um Reel: cria o contêiner, envia o arquivo (upload resumível), espera o processamento e publica. */
export async function publicarReelInstagram(token: string, igUserId: string, a: { arquivo: Uint8Array; legenda: string }, op: OpcoesEspera = {}) {
  const esperar = op.esperar ?? dormir, max = op.tentativas ?? 12, passo = op.intervaloMs ?? 30_000;
  const cont = await json<{ id?: string }>(`https://graph.facebook.com/${V}/${igUserId}/media`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ media_type: "REELS", upload_type: "resumable", caption: a.legenda.slice(0, 2200), access_token: token }) }, "Instagram: criar contêiner");
  if (!cont.id) throw new Error("Instagram: não veio o id do contêiner");
  const up = await bruto(`https://rupload.facebook.com/ig-api-upload/${V}/${cont.id}`, { method: "POST", headers: { authorization: `OAuth ${token}`, offset: "0", file_size: String(a.arquivo.byteLength) }, body: a.arquivo as BodyInit });
  const corpo = (await up.json().catch(() => ({}))) as { success?: boolean; debug_info?: { message?: string } };
  if (!up.ok || corpo.success === false) throw new Error(`Instagram: enviar vídeo: HTTP ${up.status} ${corpo.debug_info?.message ?? ""}`.trim());
  for (let i = 0; i < max; i++) {
    const s = await json<{ status_code?: string; status?: string }>(`https://graph.facebook.com/${V}/${cont.id}?${form({ fields: "status_code,status", access_token: token })}`, undefined, "Instagram: status");
    if (s.status_code === "FINISHED") break;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Instagram: o processamento terminou em ${s.status_code}${s.status ? ` (${s.status})` : ""}`);
    if (i === max - 1) throw new Error("Instagram: o vídeo ainda estava processando quando a espera acabou. Tente de novo mais tarde.");
    await esperar(passo);
  }
  const pub = await json<{ id?: string }>(`https://graph.facebook.com/${V}/${igUserId}/media_publish`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ creation_id: cont.id, access_token: token }) }, "Instagram: publicar");
  if (!pub.id) throw new Error("Instagram: a publicação não devolveu o id");
  let url = "";
  try { url = (await json<{ permalink?: string }>(`https://graph.facebook.com/${V}/${pub.id}?${form({ fields: "permalink", access_token: token })}`, undefined, "Instagram: link")).permalink ?? ""; } catch { /* o link é opcional */ }
  return { id: pub.id, url };
}

// ---------------------------------------------------------------- TikTok (rascunho na caixa de entrada)
const MB = 1024 * 1024;
/** Divide em partes: até 10 MB vai inteiro; acima disso, partes de 10 MB e o resto fica na última (a regra do TikTok: total = piso(tamanho / parte)). */
export function planoDePartes(tamanho: number) {
  const parte = tamanho <= 10 * MB ? tamanho : 10 * MB;
  return { parte, total: Math.max(1, Math.floor(tamanho / parte)) };
}

/** Envia o vídeo para a caixa de entrada do TikTok; a pessoa abre o app e toca em publicar. */
export async function enviarRascunhoTiktok(token: string, a: { arquivo: Uint8Array }, op: OpcoesEspera = {}) {
  const esperar = op.esperar ?? dormir, max = op.tentativas ?? 12, passo = op.intervaloMs ?? 5_000;
  const tam = a.arquivo.byteLength, { parte, total } = planoDePartes(tam);
  const H = { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8" };
  const ini = await json<{ data?: { publish_id?: string; upload_url?: string }; error?: { code?: string; message?: string } }>("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", { method: "POST", headers: H, body: JSON.stringify({ source_info: { source: "FILE_UPLOAD", video_size: tam, chunk_size: parte, total_chunk_count: total } }) }, "TikTok: iniciar envio");
  if (ini.error?.code && ini.error.code !== "ok") throw new Error(`TikTok: iniciar envio: ${ini.error.message ?? ini.error.code}`);
  const { publish_id: id, upload_url: url } = ini.data ?? {};
  if (!id || !url) throw new Error("TikTok: a resposta não trouxe o publish_id ou o endereço de envio");
  for (let i = 0; i < total; i++) {
    const ini2 = i * parte, fim = i === total - 1 ? tam - 1 : ini2 + parte - 1;
    const r = await bruto(url, { method: "PUT", headers: { "content-type": "video/mp4", "content-length": String(fim - ini2 + 1), "content-range": `bytes ${ini2}-${fim}/${tam}` }, body: a.arquivo.subarray(ini2, fim + 1) as BodyInit });
    if (!r.ok) throw new Error(`TikTok: enviar parte ${i + 1}/${total}: HTTP ${r.status}`);
  }
  for (let i = 0; i < max; i++) {
    const s = await json<{ data?: { status?: string; fail_reason?: string }; error?: { code?: string; message?: string } }>("https://open.tiktokapis.com/v2/post/publish/status/fetch/", { method: "POST", headers: H, body: JSON.stringify({ publish_id: id }) }, "TikTok: status");
    const st = s.data?.status;
    if (st === "SEND_TO_USER_INBOX" || st === "PUBLISH_COMPLETE") return { id, estado: st };
    if (st === "FAILED") throw new Error(`TikTok: o envio falhou${s.data?.fail_reason ? ` (${s.data.fail_reason})` : ""}`);
    await esperar(passo);
  }
  throw new Error("TikTok: o vídeo ainda estava processando quando a espera acabou. Confira no app.");
}

async function motivo(r: Response) {
  try { const j = (await r.json()) as { error?: { message?: string } }; return j.error?.message ?? ""; } catch { return ""; }
}
