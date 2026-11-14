import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { perfis, roteiros, series } from "@estudio/db";
import { db } from "@/lib/db";
import { PageHead } from "../PageHead";
import { ETAPAS, NOME_ETAPA as NOMES, Trilha } from "../Trilha";

export const dynamic = "force-dynamic";

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
      <PageHead titulo="Roteiros" descricao="Acompanhe cada roteiro da ideia até a publicação." />
      {ps.length === 0 ? (
        <div className="vazio"><strong>Crie um perfil primeiro</strong>Todo roteiro pertence a um perfil. <Link href="/perfis" style={{ textDecoration: "underline" }}>Ir para Perfis</Link></div>
      ) : (
        <details className="card" open={todos.length === 0}>
          <summary>Novo roteiro</summary>
          <form action={criar}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
              <label>Título<input name="titulo" required placeholder="Maníaco do Parque: a máscara" /></label>
              <label>Perfil
                <select name="perfilId">{ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
              </label>
              <label>Série (opcional)<input name="serie" placeholder="Mentes diferentes" /></label>
            </div>
            <button>Criar roteiro</button>
          </form>
        </details>
      )}
      {todos.length > 0 && (
        <>
          <div className="cab"><span className="grow">Título</span><span style={{ width: 90 }}>Etapa</span><span style={{ width: 104 }}>Trilha</span></div>
          <div className="lista" style={{ borderTop: 0 }}>
            {[...todos].sort((a, b) => ETAPAS.indexOf(b.etapa) - ETAPAS.indexOf(a.etapa) || b.id - a.id).map((r) => (
              <Link key={r.id} href={`/roteiros/${r.id}`}>
                <span className="grow"><span className="titulo">{r.titulo}</span>{r.serieId && <span className="mudo pequeno"> · {nomeSerie.get(r.serieId)}</span>}</span>
                <span className="mudo pequeno" style={{ width: 90 }}>{NOMES[r.etapa]}</span>
                <span style={{ width: 104 }}><Trilha etapa={r.etapa} /></span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
