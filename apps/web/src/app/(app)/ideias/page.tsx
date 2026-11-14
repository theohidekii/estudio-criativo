import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { conversas, perfis } from "@estudio/db";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";
import { PageHead } from "../PageHead";

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
      <PageHead titulo="Ideias" descricao="Converse com a IA para encontrar temas. Escolha um perfil para ela usar o nicho e o tom de voz dele." />
      <form action={nova} className="card linha" style={{ alignItems: "flex-end" }}>
        <label className="grow" style={{ margin: 0 }}>Perfil
          <select name="perfilId" style={{ marginBottom: 0 }}>
            <option value="">Sem perfil</option>
            {ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <button>Nova conversa</button>
      </form>
      <h2>Conversas</h2>
      {cs.length === 0 ? (
        <div className="vazio"><strong>Nenhuma conversa</strong>Inicie uma conversa para gerar as primeiras ideias.</div>
      ) : (
        <div className="lista">{cs.map((c) => <Link key={c.id} href={`/ideias/${c.id}`}><span>{c.titulo}</span><span className="mono mudo">#{c.id}</span></Link>)}</div>
      )}
    </>
  );
}
