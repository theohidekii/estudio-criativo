import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { versoesVideo } from "@estudio/db";
import { db } from "@/lib/db";
import { pastaVideo } from "@/lib/narracao";

export const dynamic = "force-dynamic";

/** Vídeo renderizado de uma versão: /api/videos/<videoId>/arquivo?v=<n> (com suporte a Range para o player). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const n = Number(new URL(req.url).searchParams.get("v"));
  if (!Number.isInteger(id) || !Number.isInteger(n)) return new Response("parâmetros inválidos", { status: 400 });
  const ver = db().select().from(versoesVideo).where(and(eq(versoesVideo.videoId, id), eq(versoesVideo.numero, n))).get();
  const arquivo = ver?.arquivoVideo ?? path.join(pastaVideo(id, n), "video.mp4");
  try {
    const { size } = await stat(arquivo);
    const buf = await readFile(arquivo);
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
    const base = { "content-type": "video/mp4", "accept-ranges": "bytes" };
    if (range) {
      const ini = range[1] ? Number(range[1]) : 0;
      const fim = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      return new Response(new Uint8Array(buf.subarray(ini, fim + 1)), { status: 206, headers: { ...base, "content-range": `bytes ${ini}-${fim}/${size}`, "content-length": String(fim - ini + 1) } });
    }
    return new Response(new Uint8Array(buf), { headers: { ...base, "content-length": String(size) } });
  } catch {
    return new Response("vídeo ainda não renderizado", { status: 404 });
  }
}
