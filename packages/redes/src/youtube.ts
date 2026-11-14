// YouTube: Data API (lista de vídeos e contagens) + Analytics API (tempo médio, retenção, compartilhamentos, inscritos ganhos).
import { form, json, POST_FORM } from "./http";
import { type Coletada, type ConfigApp, type MetricasRemotas, type Tokens, vazias } from "./tipos";

export const ESCOPOS_YT = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.upload";

export const urlAutorizacao = (c: ConfigApp, redirectUri: string, state: string) =>
  `https://accounts.google.com/o/oauth2/v2/auth?${form({ client_id: c.clientId, redirect_uri: redirectUri, response_type: "code", scope: ESCOPOS_YT, access_type: "offline", prompt: "consent", state })}`;

type TokenResp = { access_token: string; refresh_token?: string; expires_in: number };
const paraTokens = (t: TokenResp, extra: Record<string, string> = {}, antigoRefresh?: string): Tokens => ({
  accessToken: t.access_token, refreshToken: t.refresh_token ?? antigoRefresh, expiraEm: new Date(Date.now() + t.expires_in * 1000), extra,
});
const exigirToken = (t: TokenResp, rotulo: string): TokenResp => { if (!t?.access_token) throw new Error(`${rotulo}: resposta sem access_token`); return t; };
const auth = (token: string): RequestInit => ({ headers: { authorization: `Bearer ${token}` } });

export async function meuCanal(token: string) {
  const r = await json<{ items?: { id: string; snippet: { title: string }; contentDetails: { relatedPlaylists: { uploads: string } } }[] }>(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true", auth(token), "YouTube: canal");
  const c = r.items?.[0];
  if (!c) throw new Error("YouTube: esta conta Google não tem um canal");
  return { id: c.id, nome: c.snippet.title, uploads: c.contentDetails.relatedPlaylists.uploads };
}

export async function trocarCodigo(c: ConfigApp, redirectUri: string, code: string): Promise<Tokens> {
  const t = exigirToken(await json<TokenResp>("https://oauth2.googleapis.com/token", POST_FORM({ code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }), "YouTube: trocar código"), "YouTube: trocar código");
  const canal = await meuCanal(t.access_token);
  return paraTokens(t, { canalId: canal.id, uploads: canal.uploads, nome: canal.nome });
}

export async function renovar(c: ConfigApp, refreshToken: string, extra: Record<string, string>): Promise<Tokens> {
  const t = exigirToken(await json<TokenResp>("https://oauth2.googleapis.com/token", POST_FORM({ refresh_token: refreshToken, client_id: c.clientId, client_secret: c.clientSecret, grant_type: "refresh_token" }), "YouTube: renovar token"), "YouTube: renovar token");
  return paraTokens(t, extra, refreshToken);
}

type VideoItem = { id: string; snippet: { title: string; publishedAt: string }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } };

/** Lista os vídeos do canal (até `max`) com as contagens públicas. */
export async function listar(token: string, uploads: string, max = 200): Promise<Coletada[]> {
  const ids: string[] = [];
  let pagina = "";
  while (ids.length < max) {
    const r = await json<{ items?: { contentDetails: { videoId: string } }[]; nextPageToken?: string }>(
      `https://www.googleapis.com/youtube/v3/playlistItems?${form({ part: "contentDetails", playlistId: uploads, maxResults: "50", ...(pagina ? { pageToken: pagina } : {}) })}`, auth(token), "YouTube: lista de vídeos");
    ids.push(...(r.items ?? []).map((i) => i.contentDetails.videoId));
    if (!r.nextPageToken) break;
    pagina = r.nextPageToken;
  }
  const out: Coletada[] = [];
  for (let i = 0; i < Math.min(ids.length, max); i += 50) {
    const lote = ids.slice(i, i + 50);
    const r = await json<{ items?: VideoItem[] }>(`https://www.googleapis.com/youtube/v3/videos?${form({ part: "snippet,statistics", id: lote.join(",") })}`, auth(token), "YouTube: detalhes");
    for (const v of r.items ?? []) {
      const m = vazias(), s = v.statistics ?? {};
      m.views = Number(s.viewCount ?? 0); m.curtidas = Number(s.likeCount ?? 0); m.comentarios = Number(s.commentCount ?? 0);
      out.push({ publicacao: { idExterno: v.id, titulo: v.snippet.title, url: `https://www.youtube.com/watch?v=${v.id}`, publicadoEm: new Date(v.snippet.publishedAt) }, metricas: m });
    }
  }
  return out;
}

/** Complementa um vídeo com o Analytics: tempo médio de visualização, retenção, compartilhamentos e inscritos ganhos. */
export async function complementar(token: string, videoId: string, publicadoEm: Date | null, base: MetricasRemotas): Promise<MetricasRemotas> {
  const ini = (publicadoEm ?? new Date(Date.now() - 365 * 864e5)).toISOString().slice(0, 10);
  const fim = new Date().toISOString().slice(0, 10);
  const metricas = ["views", "estimatedMinutesWatched", "averageViewDuration", "averageViewPercentage", "likes", "comments", "shares", "subscribersGained"];
  const r = await json<{ rows?: number[][] }>(`https://youtubeanalytics.googleapis.com/v2/reports?${form({ ids: "channel==MINE", startDate: ini, endDate: fim, metrics: metricas.join(","), filters: `video==${videoId}` })}`, auth(token), "YouTube Analytics");
  const l = r.rows?.[0];
  if (!l) return base;
  const [views, , tempo, ret, likes, comments, shares, subs] = l;
  return { ...base, views: Math.max(base.views, views), curtidas: Math.max(base.curtidas, likes), comentarios: Math.max(base.comentarios, comments), compartilhamentos: shares, tempoMedio: tempo, retencao: ret, seguidoresGanhos: subs };
}
