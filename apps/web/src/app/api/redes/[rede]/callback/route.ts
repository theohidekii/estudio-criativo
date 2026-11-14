import { NextResponse } from "next/server";
import { instagram, tiktok, youtube } from "@estudio/redes";
import { configApp, criarConta, redirectDe } from "@/lib/redes";

export const dynamic = "force-dynamic";
const base = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Recebe o código da rede, confere o `state`, troca por tokens e guarda a(s) conta(s) com os tokens cifrados. */
export async function GET(req: Request, ctx: { params: Promise<{ rede: string }> }) {
  const rede = (await ctx.params).rede as "youtube" | "tiktok" | "instagram";
  const q = new URL(req.url).searchParams;
  const fim = (chave: "ok" | "erro", msg: string) => {
    const r = NextResponse.redirect(new URL(`/contas?${chave}=${encodeURIComponent(msg)}`, base()));
    r.cookies.delete("oauth_state");
    return r;
  };
  const cookie = (req.headers.get("cookie") ?? "").split(/;\s*/).find((c) => c.startsWith("oauth_state="))?.slice(12) ?? "";
  const [state, perfilTxt] = cookie.split(".");
  const perfil = Number(perfilTxt);
  if (q.get("error")) return fim("erro", `A rede recusou a conexão: ${q.get("error_description") ?? q.get("error")}`);
  if (!state || state !== q.get("state") || !Number.isInteger(perfil)) return fim("erro", "A conexão expirou ou não confere. Tente de novo.");
  const code = q.get("code");
  const app = configApp(rede);
  if (!code || !app) return fim("erro", "Resposta incompleta da rede.");
  try {
    const redirect = redirectDe(rede);
    if (rede === "youtube") {
      const t = await youtube.trocarCodigo(app, redirect, code);
      criarConta(perfil, "youtube", t.extra.nome || "YouTube", t, t.extra, t.extra.canalId);
      return fim("ok", `Canal "${t.extra.nome}" conectado.`);
    }
    if (rede === "tiktok") {
      const t = await tiktok.trocarCodigo(app, redirect, code);
      criarConta(perfil, "tiktok", t.extra.nome || "TikTok", t, t.extra, t.extra.openId);
      return fim("ok", "Conta do TikTok conectada.");
    }
    const { tokens, contas } = await instagram.trocarCodigo(app, redirect, code);
    if (contas.length === 0) return fim("erro", "Nenhuma conta de Instagram profissional ligada a uma Página do Facebook foi encontrada.");
    for (const c of contas) {
      criarConta(perfil, "instagram", `@${c.igUsuario}`, tokens, { igUserId: c.igUserId, pageId: c.pageId, pageNome: c.pageNome, ...(c.pageToken ? { pageToken: c.pageToken } : {}) }, c.igUserId);
      criarConta(perfil, "facebook", c.pageNome, tokens, { pageId: c.pageId }, c.pageId);
    }
    return fim("ok", `${contas.length} conta(s) do Instagram e as Páginas ligadas foram conectadas.`);
  } catch (e) {
    return fim("erro", (e as Error).message.slice(0, 200));
  }
}
