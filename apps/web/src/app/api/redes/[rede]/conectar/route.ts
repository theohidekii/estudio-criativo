import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { instagram, tiktok, youtube } from "@estudio/redes";
import { configApp, podeConectar, redirectDe } from "@/lib/redes";

export const dynamic = "force-dynamic";
const base = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Inicia o OAuth: guarda um `state` aleatório em cookie (proteção contra CSRF) e manda a pessoa para a tela de autorização da rede. */
export async function GET(req: Request, ctx: { params: Promise<{ rede: string }> }) {
  const rede = (await ctx.params).rede as "youtube" | "tiktok" | "instagram";
  const perfil = Number(new URL(req.url).searchParams.get("perfil"));
  const volta = (msg: string) => NextResponse.redirect(new URL(`/contas?erro=${encodeURIComponent(msg)}`, base()));
  if (!["youtube", "tiktok", "instagram"].includes(rede) || !Number.isInteger(perfil) || perfil <= 0) return volta("Rede ou perfil inválido.");
  const app = configApp(rede);
  if (!podeConectar(rede) || !app) return volta("Faltam as credenciais do app desta rede (e a TOKEN_ENC_KEY) no .env.local.");
  const state = randomBytes(16).toString("hex");
  const redirect = redirectDe(rede);
  const url = rede === "youtube" ? youtube.urlAutorizacao(app, redirect, state) : rede === "tiktok" ? tiktok.urlAutorizacao(app, redirect, state) : instagram.urlAutorizacao(app, redirect, state);
  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", `${state}.${perfil}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
