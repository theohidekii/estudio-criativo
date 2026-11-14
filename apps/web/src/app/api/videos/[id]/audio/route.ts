import { readFile } from "node:fs/promises";
import path from "node:path";
import { pastaVideo } from "@/lib/narracao";

export const dynamic = "force-dynamic";

/** Narração de uma versão: /api/videos/<videoId>/audio?v=<n> */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const n = Number(new URL(req.url).searchParams.get("v"));
  if (!Number.isInteger(id) || !Number.isInteger(n)) return new Response("parâmetros inválidos", { status: 400 });
  try {
    const buf = await readFile(path.join(pastaVideo(id, n), "voz.mp3"));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "audio/mpeg" } });
  } catch {
    return new Response("sem narração", { status: 404 });
  }
}
