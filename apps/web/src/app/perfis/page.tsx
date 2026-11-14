import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { perfis } from "@estudio/db";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function criar(form: FormData) {
  "use server";
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return;
  db().insert(perfis).values({ nome, nicho: String(form.get("nicho") ?? ""), tom: String(form.get("tom") ?? "") }).run();
  revalidatePath("/perfis");
}

export default function Perfis() {
  const lista = db().select().from(perfis).orderBy(desc(perfis.id)).all();
  return (
    <>
      <h1>Perfis</h1>
      <form action={criar} className="card">
        <label>Nome<input name="nome" required /></label>
        <label>Nicho<input name="nicho" placeholder="ex.: psicologia humana" /></label>
        <label>Tom de voz<textarea name="tom" rows={2} /></label>
        <button>Criar perfil</button>
      </form>
      {lista.map((p) => (
        <div key={p.id} className="card"><strong>{p.nome}</strong><div className="mudo">{p.nicho}</div></div>
      ))}
    </>
  );
}
