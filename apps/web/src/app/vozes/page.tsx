import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { perfis, vozes } from "@estudio/db";
import { db } from "@/lib/db";
import { clonarVoz, listarVozes } from "@/lib/elevenlabs";

export const dynamic = "force-dynamic";

async function sincronizar() {
  "use server";
  const remotas = await listarVozes();
  const d = db();
  for (const v of remotas) {
    const dados = { nome: v.name, categoria: v.category ?? "", descricao: v.description ?? "", amostraUrl: v.preview_url ?? null };
    const ja = d.select().from(vozes).where(eq(vozes.idExterno, v.voice_id)).get();
    if (ja) d.update(vozes).set(dados).where(eq(vozes.id, ja.id)).run();
    else d.insert(vozes).values({ idExterno: v.voice_id, ...dados }).run();
  }
  revalidatePath("/vozes");
}

async function ajustar(form: FormData) {
  "use server";
  const est = Number(form.get("estabilidade"));
  const vel = Number(form.get("velocidade"));
  db().update(vozes).set({
    estabilidade: [0, 0.5, 1].includes(est) ? est : 0.5,
    velocidade: vel >= 0.7 && vel <= 1.3 ? vel : 1,
  }).where(eq(vozes.id, Number(form.get("id")))).run();
  revalidatePath("/vozes");
}

async function definirPadrao(form: FormData) {
  "use server";
  const perfilId = Number(form.get("perfilId"));
  if (!perfilId) return;
  db().update(perfis).set({ vozPadrao: String(form.get("idExterno")) }).where(eq(perfis.id, perfilId)).run();
  revalidatePath("/vozes");
}

async function clonar(form: FormData) {
  "use server";
  if (form.get("autorizacao") !== "on") return;
  const arquivos = form.getAll("arquivos").filter((f): f is File => f instanceof File && f.size > 0);
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome || arquivos.length === 0) return;
  const idExterno = await clonarVoz(nome, String(form.get("descricao") ?? ""), arquivos);
  db().insert(vozes).values({ idExterno, nome, categoria: "cloned" }).run();
  revalidatePath("/vozes");
}

export default function Vozes() {
  const d = db();
  const lista = d.select().from(vozes).all();
  const ps = d.select().from(perfis).all();
  const comChave = Boolean(process.env.ELEVENLABS_API_KEY);
  return (
    <>
      <h1>Vozes</h1>
      {!comChave && <p style={{ color: "#fbbf24" }}>Defina ELEVENLABS_API_KEY em apps/web/.env.local para usar as vozes.</p>}
      <form action={sincronizar} className="card">
        <button>Importar vozes da minha conta ElevenLabs</button>
        <span className="mudo"> {lista.length} voz(es) no sistema</span>
      </form>

      <details className="card">
        <summary>Criar voz nova (clonar a partir de áudio)</summary>
        <form action={clonar}>
          <label>Nome<input name="nome" required /></label>
          <label>Descrição<input name="descricao" /></label>
          <label>Arquivos de áudio (1 a 3 min de fala limpa)<input name="arquivos" type="file" accept="audio/*" multiple required /></label>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" name="autorizacao" style={{ width: "auto", margin: "0 8px 0 0" }} />
            Tenho autorização da pessoa dona da voz para cloná-la.
          </label>
          <button>Clonar voz</button>
          <p className="mudo">Exige um plano da ElevenLabs com clonagem instantânea. A voz criada também fica na sua conta de lá.</p>
        </form>
      </details>

      {lista.map((v) => (
        <div key={v.id} className="card">
          <strong>{v.nome}</strong> <span className="mudo">{v.categoria}</span>
          {v.descricao && <div className="mudo">{v.descricao}</div>}
          {v.amostraUrl && <div><audio controls preload="none" src={v.amostraUrl} style={{ width: "100%", marginTop: 8 }} /><span className="mudo">amostra da ElevenLabs</span></div>}
          <details style={{ marginTop: 8 }}>
            <summary>Testar em português (gasta uns poucos créditos na primeira vez)</summary>
            <audio controls preload="none" src={`/api/vozes/${v.id}/amostra`} style={{ width: "100%" }} />
          </details>
          <form action={ajustar} style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 8 }}>
            <input type="hidden" name="id" value={v.id} />
            <label>Estabilidade
              <select name="estabilidade" defaultValue={v.estabilidade} style={{ padding: 8 }}>
                <option value={0}>Criativa (0)</option><option value={0.5}>Natural (0.5)</option><option value={1}>Robusta (1)</option>
              </select>
            </label>
            <label>Velocidade<input name="velocidade" type="number" step="0.05" min="0.7" max="1.3" defaultValue={v.velocidade} /></label>
            <button>Salvar ajustes</button>
          </form>
          {ps.length > 0 && (
            <form action={definirPadrao} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="hidden" name="idExterno" value={v.idExterno} />
              <select name="perfilId" style={{ padding: 8 }}>
                {ps.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.vozPadrao === v.idExterno ? " ✓" : ""}</option>)}
              </select>
              <button style={{ background: "#334155" }}>Usar como voz padrão do perfil</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}
