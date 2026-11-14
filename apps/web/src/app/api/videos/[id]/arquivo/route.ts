import { readFile } from "node:fs/promises";
import path from "node:path";
import { pastaVideo } from "@/lib/narracao";

export const dynamic = "force-dynamic";

/** Vídeo renderizado de uma versão: /api/videos/<videoId>/arquivo?v=<n> */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const n = Number(new URL(req.url).searchParams.get("v"));
  if (!Number.isInteger(id) || !Number.isInteger(n)) return new Response("parâmetros inválidos", { status: 400 });
  try {
    const buf = await readFile(path.join(pastaVideo(id, n), "video.mp4"));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "video/mp4", "content-disposition": `inline; filename="video-${id}-v${n}.mp4"` } });
  } catch {
    return new Response("vídeo ainda não renderizado", { status: 404 });
  }
}
