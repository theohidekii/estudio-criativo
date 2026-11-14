// Instagram (e a Página do Facebook ligada a ele) pelo Facebook Login: lista de mídias e insights de cada uma.
import { form, json } from "./http";
import { type Coletada, type ConfigApp, type MetricasRemotas, type Tokens, vazias } from "./tipos";

const V = "v23.0";
export const ESCOPOS_IG = "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement";
export const urlAutorizacao = (c: ConfigApp, redirectUri: string, state: string) =>
  `https://www.facebook.com/${V}/dialog/oauth?${form({ client_id: c.clientId, redirect_uri: redirectUri, state, scope: ESCOPOS_IG })}`;

export type ContaIg = { pageId: string; pageNome: string; igUserId: string; igUsuario: string };

/** Contas de Instagram profissional ligadas às Páginas que a pessoa administra. */
export async function contasDisponiveis(token: string): Promise<ContaIg[]> {
  const r = await json<{ data?: { id: string; name: string; instagram_business_account?: { id: string; username?: string } }[] }>(
    `https://graph.facebook.com/${V}/me/accounts?${form({ fields: "id,name,instagram_business_account{id,username}", limit: "50", access_token: token })}`, undefined, "Meta: contas");
  return (r.data ?? []).filter((p) => p.instagram_business_account).map((p) => ({ pageId: p.id, pageNome: p.name, igUserId: p.instagram_business_account!.id, igUsuario: p.instagram_business_account!.username ?? p.name }));
}

/** Troca o código por um token de longa duração (cerca de 60 dias) e lista as contas de Instagram disponíveis. */
export async function trocarCodigo(c: ConfigApp, redirectUri: string, code: string): Promise<{ tokens: Tokens; contas: ContaIg[] }> {
  const curto = await json<{ access_token: string }>(`https://graph.facebook.com/${V}/oauth/access_token?${form({ client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: redirectUri, code })}`, undefined, "Meta: trocar código");
  const longo = await json<{ access_token: string; expires_in?: number }>(`https://graph.facebook.com/${V}/oauth/access_token?${form({ grant_type: "fb_exchange_token", client_id: c.clientId, client_secret: c.clientSecret, fb_exchange_token: curto.access_token })}`, undefined, "Meta: token longo");
  const contas = await contasDisponiveis(longo.access_token);
  return { tokens: { accessToken: longo.access_token, expiraEm: new Date(Date.now() + (longo.expires_in ?? 5184000) * 1000), extra: {} }, contas };
}

type Midia = { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; timestamp?: string; like_count?: number; comments_count?: number };

export async function listarMidia(token: string, igUserId: string, max = 100): Promise<Midia[]> {
  const out: Midia[] = [];
  let url: string | undefined = `https://graph.facebook.com/${V}/${igUserId}/media?${form({ fields: "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count", limit: "50", access_token: token })}`;
  while (url && out.length < max) {
    const r: { data?: Midia[]; paging?: { next?: string } } = await json(url, undefined, "Instagram: lista de mídias");
    out.push(...(r.data ?? []));
    url = r.paging?.next;
  }
  return out.slice(0, max);
}

/** Insights de uma mídia. Reels têm tempo médio de reprodução (em ms na API); posts de feed têm "follows". Se a Meta recusar uma métrica, tenta o conjunto básico. */
export async function insights(token: string, m: Midia): Promise<Partial<MetricasRemotas>> {
  const reel = m.media_product_type === "REELS";
  const conjuntos = [reel ? "views,reach,likes,comments,shares,saved,ig_reels_avg_watch_time" : "views,reach,likes,comments,shares,saved,follows", "reach,likes,comments,shares,saved"];
  for (const metric of conjuntos) {
    try {
      const r = await json<{ data?: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(`https://graph.facebook.com/${V}/${m.id}/insights?${form({ metric, access_token: token })}`, undefined, "Instagram: insights");
      const v = (n: string) => { const d = r.data?.find((x) => x.name === n); return d ? (d.values?.[0]?.value ?? d.total_value?.value ?? null) : null; };
      const tempo = v("ig_reels_avg_watch_time");
      const out: Partial<MetricasRemotas> = { alcance: v("reach"), tempoMedio: tempo === null ? null : tempo / 1000, seguidoresGanhos: v("follows") };
      for (const [k, n] of [["views", "views"], ["curtidas", "likes"], ["comentarios", "comments"], ["compartilhamentos", "shares"], ["salvamentos", "saved"]] as const) {
        const x = v(n); if (x !== null) out[k] = x;
      }
      return out;
    } catch { /* tenta o próximo conjunto */ }
  }
  return {};
}

export async function listar(token: string, igUserId: string, max = 100): Promise<Coletada[]> {
  const out: Coletada[] = [];
  for (const m of await listarMidia(token, igUserId, max)) {
    const base = vazias();
    base.curtidas = m.like_count ?? 0; base.comentarios = m.comments_count ?? 0;
    const metricas: MetricasRemotas = { ...base, ...(await insights(token, m)) };
    out.push({ publicacao: { idExterno: m.id, titulo: (m.caption ?? "").split("\n")[0].slice(0, 120), url: m.permalink ?? "", publicadoEm: m.timestamp ? new Date(m.timestamp) : null, tipo: m.media_product_type }, metricas });
  }
  return out;
}
