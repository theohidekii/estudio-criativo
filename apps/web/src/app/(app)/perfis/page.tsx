import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { perfis } from "@estudio/db";
import { db } from "@/lib/db";
import { PageHead } from "../PageHead";

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
      <PageHead titulo="Perfis" descricao="Cada perfil é uma marca ou canal. O nicho e o tom de voz orientam a IA nas ideias e nos roteiros." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
        <form action={criar} className="card">
          <label>Nome<input name="nome" required placeholder="Mentes diferentes" /></label>
          <label>Nicho<input name="nicho" placeholder="Psicologia humana" /></label>
          <label>Tom de voz<textarea name="tom" rows={3} placeholder="Sério, curioso e respeitoso" /></label>
          <button>Criar perfil</button>
        </form>
        <div>
          {lista.length === 0 ? (
            <div className="vazio"><strong>Nenhum perfil ainda</strong>Crie o primeiro ao lado para começar a gerar ideias.</div>
          ) : (
            <div className="lista">
              {lista.map((p) => (
                <div key={p.id}>
                  <div className="grow"><div style={{ fontWeight: 500 }}>{p.nome}</div><div className="mudo pequeno">{p.nicho || "Sem nicho definido"}</div></div>
                  {p.vozPadrao && <span className="etiqueta">Voz definida</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
