import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { conversas, perfis } from "@estudio/db";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";

export const dynamic = "force-dynamic";

async function nova(form: FormData) {
  "use server";
  const uid = (await usuarioAtual())!;
  const perfilId = Number(form.get("perfilId")) || null;
  const c = db().insert(conversas).values({ usuarioId: uid, perfilId, titulo: "Nova conversa" }).returning().get();
  redirect(`/ideias/${c.id}`);
}

export default async function Ideias() {
  const uid = (await usuarioAtual())!;
  const ps = db().select().from(perfis).all();
  const cs = db().select().from(conversas).where(eq(conversas.usuarioId, uid)).orderBy(desc(conversas.id)).all();
  return (
    <>
      <h1>Ideias</h1>
      <form action={nova} className="card">
        <label>Perfil (dá o contexto de nicho e tom)
          <select name="perfilId" style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}>
            <option value="">Sem perfil</option>
            {ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <button>Nova conversa</button>
      </form>
      {cs.map((c) => <div key={c.id} className="card"><Link href={`/ideias/${c.id}`}>{c.titulo} #{c.id}</Link></div>)}
    </>
  );
}
