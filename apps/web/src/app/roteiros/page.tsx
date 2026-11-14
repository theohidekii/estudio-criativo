import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { perfis, roteiros, series } from "@estudio/db";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const ETAPAS = ["ideia", "rascunho", "aprovado", "gravado", "publicado"] as const;
const NOMES: Record<string, string> = { ideia: "Ideia", rascunho: "Rascunho", aprovado: "Aprovado", gravado: "Gravado", publicado: "Publicado" };

async function criar(form: FormData) {
  "use server";
  const titulo = String(form.get("titulo") ?? "").trim();
  const perfilId = Number(form.get("perfilId"));
  if (!titulo || !perfilId) return;
  const d = db();
  const nomeSerie = String(form.get("serie") ?? "").trim();
  let serieId: number | null = null;
  if (nomeSerie) {
    const s = d.select().from(series).where(eq(series.perfilId, perfilId)).all().find((x) => x.nome === nomeSerie)
      ?? d.insert(series).values({ perfilId, nome: nomeSerie }).returning().get();
    serieId = s.id;
  }
  const r = d.insert(roteiros).values({ titulo, perfilId, serieId }).returning().get();
  redirect(`/roteiros/${r.id}`);
}

export default function Roteiros() {
  const d = db();
  const ps = d.select().from(perfis).all();
  const todos = d.select().from(roteiros).all();
  const nomeSerie = new Map(d.select().from(series).all().map((s) => [s.id, s.nome]));
  return (
    <>
      <h1>Roteiros</h1>
      {ps.length === 0 ? <p className="mudo">Crie um perfil primeiro em <Link href="/perfis">Perfis</Link>.</p> : (
        <form action={criar} className="card">
          <label>Título<input name="titulo" required /></label>
          <label>Perfil
            <select name="perfilId" style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}>
              {ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label>Série (opcional)<input name="serie" placeholder="ex.: Mentes diferentes" /></label>
          <button>Criar roteiro</button>
        </form>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {ETAPAS.map((e) => (
          <div key={e}>
            <div className="mudo" style={{ marginBottom: 6 }}>{NOMES[e]} ({todos.filter((r) => r.etapa === e).length})</div>
            {todos.filter((r) => r.etapa === e).map((r) => (
              <div key={r.id} className="card" style={{ padding: 10 }}>
                <Link href={`/roteiros/${r.id}`}>{r.titulo}</Link>
                {r.serieId && <div className="mudo" style={{ fontSize: 12 }}>{nomeSerie.get(r.serieId)}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
