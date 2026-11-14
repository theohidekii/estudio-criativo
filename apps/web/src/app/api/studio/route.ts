import { iniciarStudio, studioAtivo, URL_STUDIO } from "@/lib/studio";

export const dynamic = "force-dynamic";

/** GET: o Studio está rodando? */
export async function GET() {
  return Response.json({ ativo: await studioAtivo(), url: URL_STUDIO });
}

/** POST: inicia o Studio, se necessário. */
export async function POST() {
  await iniciarStudio();
  return Response.json({ ok: true });
}
