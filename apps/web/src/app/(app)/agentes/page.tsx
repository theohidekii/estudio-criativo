import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { agentes } from "@estudio/db";
import { hashToken, novoToken } from "@/lib/agente";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";
import { PageHead } from "../PageHead";

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
      <PageHead titulo="Agente local" descricao="Programa que roda no seu computador e executa as tarefas de IA com o seu Claude Code. Sem ele conectado, chat, roteiros e cenas ficam parados." />
      {novo && (
        <div className="aviso ok">
          <strong>Token criado. Copie agora: ele não aparece de novo.</strong>
          <pre>{novo}</pre>
          <div className="mudo pequeno">Rode no terminal, na pasta do projeto:</div>
          <pre>npm run agente -- --servidor http://localhost:3000 --token {novo}</pre>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
        <form action={criar} className="card">
          <label>Nome do computador<input name="nome" placeholder="Meu PC" /></label>
          <button>Gerar token</button>
        </form>
        <div>
          {lista.length === 0 ? (
            <div className="vazio"><strong>Nenhum agente conectado</strong>Gere um token ao lado e rode o comando no seu computador.</div>
          ) : (
            <div className="lista">
              {lista.map((a) => {
                const on = a.ultimoContato && agora - a.ultimoContato.getTime() < 30000;
                return <div key={a.id}><span className="linha"><span className={`ponto${on ? " on" : ""}`} />{a.nome}</span><span className="mudo pequeno">{on ? "Conectado" : "Desconectado"}</span></div>;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
