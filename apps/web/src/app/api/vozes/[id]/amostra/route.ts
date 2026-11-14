import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { vozes } from "@estudio/db";
import { db } from "@/lib/db";
import { gerarAmostra } from "@/lib/elevenlabs";

export const dynamic = "force-dynamic";
const FRASE = "Ele não parecia perigoso. Era só um motoboy simpático, e foi isso que enganou tanta gente.";

/** Amostra em pt-BR gerada uma vez e guardada em disco (gastar créditos só na primeira vez). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const v = db().select().from(vozes).where(eq(vozes.id, id)).get();
  if (!v) return new Response("voz não encontrada", { status: 404 });
  const pasta = path.resolve(process.cwd(), "../../storage/amostras");
  const arquivo = path.join(pasta, `${v.id}-${v.estabilidade}.mp3`);
  try {
    return new Response(new Uint8Array(await readFile(arquivo)), { headers: { "content-type": "audio/mpeg" } });
  } catch {}
  try {
    const mp3 = await gerarAmostra(v.idExterno, FRASE, v.estabilidade);
    await mkdir(pasta, { recursive: true });
    await writeFile(arquivo, mp3);
    return new Response(new Uint8Array(mp3), { headers: { "content-type": "audio/mpeg" } });
  } catch (e) {
    return new Response(String((e as Error).message), { status: 502 });
  }
}
