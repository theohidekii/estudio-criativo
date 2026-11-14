import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const c = req.cookies.get("sessao")?.value;
  let ok = false;
  if (c) {
    try { await jwtVerify(c, new TextEncoder().encode(process.env.SESSION_SECRET ?? "")); ok = true; } catch {}
  }
  if (!ok) return NextResponse.redirect(new URL("/login", req.url));
}
export const config = { matcher: ["/((?!login|_next|favicon.ico).*)"] };
