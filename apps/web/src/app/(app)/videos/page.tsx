import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roteiros, versoesVideo, videos } from "@estudio/db";
import { db } from "@/lib/db";
import { PageHead } from "../PageHead";

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
      <PageHead titulo="Vídeos" descricao="Transforme um roteiro em narração, cenas animadas e um MP4 vertical." />
      {rs.length === 0 ? (
        <div className="vazio" style={{ marginBottom: 20 }}><strong>Nenhum roteiro com texto</strong>Escreva um roteiro primeiro. <Link href="/roteiros" style={{ textDecoration: "underline" }}>Ir para Roteiros</Link></div>
      ) : (
        <form action={criar} className="card linha" style={{ alignItems: "flex-end" }}>
          <label className="grow" style={{ margin: 0 }}>Roteiro
            <select name="roteiroId" style={{ marginBottom: 0 }}>{rs.map((r) => <option key={r.id} value={r.id}>{r.titulo}</option>)}</select>
          </label>
          <button>Criar vídeo</button>
        </form>
      )}
      <h2>Seus vídeos</h2>
      {vs.length === 0 ? (
        <div className="vazio"><strong>Nenhum vídeo ainda</strong>Escolha um roteiro acima para começar.</div>
      ) : (
        <div className="lista">{vs.map((v) => <Link key={v.id} href={`/videos/${v.id}`}><span>{v.titulo}</span><span className="mono mudo">#{v.id}</span></Link>)}</div>
      )}
    </>
  );
}
