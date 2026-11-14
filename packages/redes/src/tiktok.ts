// TikTok: Display API. Dá visualizações, curtidas, comentários e compartilhamentos; NÃO dá tempo médio de visualização nem retenção.
import { form, json, POST_FORM } from "./http";
import { type Coletada, type ConfigApp, type Tokens, vazias } from "./tipos";

export const ESCOPOS_TT = "user.info.basic,video.list,video.upload";
export const urlAutorizacao = (c: ConfigApp, redirectUri: string, state: string) =>
  `https://www.tiktok.com/v2/auth/authorize/?${form({ client_key: c.clientId, scope: ESCOPOS_TT, response_type: "code", redirect_uri: redirectUri, state })}`;

type TokenResp = { access_token: string; refresh_token?: string; expires_in: number; open_id?: string; error?: string; error_description?: string };
/** O TikTok pode responder 200 com o erro no corpo: sem access_token, falha com o motivo em vez de seguir com undefined. */
const validar = (t: TokenResp, rotulo: string): TokenResp => {
  if (!t || typeof t.access_token !== "string" || !t.access_token) throw new Error(`${rotulo}: ${t?.error_description ?? t?.error ?? "resposta sem access_token"}`);
  return t;
};
const paraTokens = (t: TokenResp, extra: Record<string, string>): Tokens => ({
  accessToken: t.access_token, refreshToken: t.refresh_token, expiraEm: new Date(Date.now() + t.expires_in * 1000), extra: { ...extra, ...(t.open_id ? { openId: t.open_id } : {}) },
});

export async function trocarCodigo(c: ConfigApp, redirectUri: string, code: string): Promise<Tokens> {
  const t = validar(await json<TokenResp>("https://open.tiktokapis.com/v2/oauth/token/", POST_FORM({ client_key: c.clientId, client_secret: c.clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri }), "TikTok: trocar código"), "TikTok: trocar código");
  let nome = "";
  try {
    const u = await json<{ data?: { user?: { display_name?: string } } }>("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", { headers: { authorization: `Bearer ${t.access_token}` } }, "TikTok: perfil");
    nome = u.data?.user?.display_name ?? "";
  } catch { /* o nome é opcional */ }
  return paraTokens(t, { nome });
}

export async function renovar(c: ConfigApp, refreshToken: string, extra: Record<string, string>): Promise<Tokens> {
  const t = validar(await json<TokenResp>("https://open.tiktokapis.com/v2/oauth/token/", POST_FORM({ client_key: c.clientId, client_secret: c.clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }), "TikTok: renovar token"), "TikTok: renovar token");
  return { ...paraTokens(t, extra), refreshToken: t.refresh_token ?? refreshToken };
}

type Video = { id: string; title?: string; create_time?: number; share_url?: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number };

/** Lista os vídeos públicos (até `max`) já com as contagens. */
export async function listar(token: string, max = 200): Promise<Coletada[]> {
  const out: Coletada[] = [];
  let cursor: number | undefined;
  const campos = "id,title,create_time,share_url,view_count,like_count,comment_count,share_count";
  while (out.length < max) {
    const r = await json<{ data?: { videos?: Video[]; cursor?: number; has_more?: boolean } }>(
      `https://open.tiktokapis.com/v2/video/list/?fields=${campos}`,
      { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }) }, "TikTok: lista de vídeos");
    for (const v of r.data?.videos ?? []) {
      const m = vazias();
      m.views = v.view_count ?? 0; m.curtidas = v.like_count ?? 0; m.comentarios = v.comment_count ?? 0; m.compartilhamentos = v.share_count ?? 0;
      out.push({ publicacao: { idExterno: v.id, titulo: v.title ?? "", url: v.share_url ?? "", publicadoEm: v.create_time ? new Date(v.create_time * 1000) : null }, metricas: m });
    }
    if (!r.data?.has_more) break;
    cursor = r.data.cursor;
  }
  return out;
}
