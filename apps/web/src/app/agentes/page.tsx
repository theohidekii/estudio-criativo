import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { agentes } from "@estudio/db";
import { hashToken, novoToken } from "@/lib/agente";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";

export const dynamic = "force-dynamic";
let ultimoToken: { uid: number; token: string } | null = null; // mostrado uma única vez

async function criar(form: FormData) {
  "use server";
  const uid = (await usuarioAtual())!;
  const token = novoToken();
  db().insert(agentes).values({ usuarioId: uid, nome: String(form.get("nome") || "Meu PC"), tokenHash: hashToken(token) }).run();
  ultimoToken = { uid, token };
  revalidatePath("/agentes");
}

export default async function Agentes() {
  const uid = (await usuarioAtual())!;
  const lista = db().select().from(agentes).where(eq(agentes.usuarioId, uid)).all();
  const novo = ultimoToken?.uid === uid ? ultimoToken.token : null;
  ultimoToken = null;
  const agora = Date.now();
  return (
    <>
      <h1>Agente local</h1>
      <p className="mudo">O agente roda no seu computador e usa o seu Claude Code. Sem ele ligado, as funções de IA ficam indisponíveis.</p>
      {novo && (
        <div className="card">
          <strong>Token (aparece só desta vez):</strong>
          <pre style={{ whiteSpace: "pre-wrap" }}>{novo}</pre>
          <code>npm run agente -- --servidor http://localhost:3000 --token {novo}</code>
        </div>
      )}
      <form action={criar} className="card"><label>Nome do computador<input name="nome" placeholder="Meu PC" /></label><button>Gerar token</button></form>
      {lista.map((a) => {
        const on = a.ultimoContato && agora - a.ultimoContato.getTime() < 30000;
        return <div key={a.id} className="card">{a.nome} — <span style={{ color: on ? "#4ade80" : "#8b8ba0" }}>{on ? "online" : "offline"}</span></div>;
      })}
    </>
  );
}
