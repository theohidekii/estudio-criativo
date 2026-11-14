import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const chave = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
export const NOME_COOKIE = "sessao";

export async function criarSessao(usuarioId: number) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw new Error("Defina SESSION_SECRET (32+ caracteres) no .env");
  const jwt = await new SignJWT({ uid: usuarioId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(chave());
  (await cookies()).set(NOME_COOKIE, jwt, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function usuarioAtual(): Promise<number | null> {
  const c = (await cookies()).get(NOME_COOKIE)?.value;
  if (!c) return null;
  try { return Number((await jwtVerify(c, chave())).payload.uid); } catch { return null; }
}
