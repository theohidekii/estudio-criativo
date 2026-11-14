import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roteiros, versoesVideo, videos } from "@estudio/db";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function criar(form: FormData) {
  "use server";
  const d = db();
  const roteiroId = Number(form.get("roteiroId"));
  const r = d.select().from(roteiros).all().find((x) => x.id === roteiroId);
  if (!r) return;
  const v = d.insert(videos).values({ roteiroId, titulo: r.titulo }).returning().get();
  d.insert(versoesVideo).values({ videoId: v.id, numero: 1 }).run();
  redirect(`/videos/${v.id}`);
}

export default function Videos() {
  const d = db();
  const rs = d.select().from(roteiros).all().filter((r) => r.texto.trim());
  const vs = d.select().from(videos).orderBy(desc(videos.id)).all();
  return (
    <>
      <h1>Vídeos</h1>
      <form action={criar} className="card">
        <label>Roteiro (só aparecem os que já têm texto)
          <select name="roteiroId" style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}>
            {rs.map((r) => <option key={r.id} value={r.id}>{r.titulo} ({r.etapa})</option>)}
          </select>
        </label>
        <button disabled={rs.length === 0}>Criar vídeo</button>
      </form>
      {vs.map((v) => <div key={v.id} className="card"><Link href={`/videos/${v.id}`}>{v.titulo}</Link> <span className="mudo">#{v.id}</span></div>)}
    </>
  );
}
