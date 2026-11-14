import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { perfis, vozes } from "@estudio/db";
import { db } from "@/lib/db";
import { clonarVoz, listarVozes } from "@/lib/elevenlabs";
import { PageHead } from "../PageHead";

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
      <PageHead titulo="Vozes" descricao="Escolha a voz de cada narração. As vozes vêm da sua conta da ElevenLabs.">
        <form action={sincronizar}><button className="sec">Importar da ElevenLabs</button></form>
      </PageHead>
      {!comChave && <div className="aviso erro">Falta a chave da ElevenLabs. Defina ELEVENLABS_API_KEY em apps/web/.env.local e reinicie o site.</div>}

      <details className="card">
        <summary>Clonar uma voz nova a partir de áudio</summary>
        <form action={clonar}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 16px" }}>
            <label>Nome<input name="nome" required /></label>
            <label>Descrição<input name="descricao" /></label>
          </div>
          <label>Arquivos de áudio, de 1 a 3 minutos de fala limpa<input name="arquivos" type="file" accept="audio/*" multiple required /></label>
          <label style={{ marginBottom: 14 }}><input type="checkbox" name="autorizacao" />Tenho autorização da pessoa dona da voz para cloná-la.</label>
          <button>Clonar voz</button>
          <p className="mudo pequeno" style={{ marginTop: 10 }}>Exige um plano da ElevenLabs com clonagem instantânea. A voz também fica na sua conta de lá.</p>
        </form>
      </details>

      {lista.length === 0 ? (
        <div className="vazio"><strong>Nenhuma voz importada</strong>Clique em Importar da ElevenLabs para trazer as vozes da sua conta.</div>
      ) : (
        <>
          <p className="mudo pequeno mono">{lista.length} vozes</p>
          {lista.map((v) => {
            const padraoDe = ps.filter((p) => p.vozPadrao === v.idExterno);
            return (
              <div key={v.id} className="card">
                <div className="linha" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="grow">
                    <div style={{ fontWeight: 600 }}>{v.nome}</div>
                    <div className="mudo pequeno">{v.descricao || "Sem descrição"}</div>
                  </div>
                  <div className="linha">
                    {padraoDe.map((p) => <span key={p.id} className="etiqueta acento">Padrão em {p.nome}</span>)}
                    {v.categoria && <span className="etiqueta">{v.categoria}</span>}
                  </div>
                </div>
                {v.amostraUrl && <audio controls preload="none" src={v.amostraUrl} style={{ width: "100%", marginTop: 12 }} />}
                <details style={{ marginTop: 12 }}>
                  <summary className="mudo">Ajustes e teste em português</summary>
                  <form action={ajustar} className="linha" style={{ alignItems: "flex-end" }}>
                    <input type="hidden" name="id" value={v.id} />
                    <label style={{ margin: 0 }}>Estabilidade
                      <select name="estabilidade" defaultValue={v.estabilidade} style={{ marginBottom: 0 }}>
                        <option value={0}>Criativa</option><option value={0.5}>Natural</option><option value={1}>Robusta</option>
                      </select>
                    </label>
                    <label style={{ margin: 0 }}>Velocidade<input name="velocidade" type="number" step="0.05" min="0.7" max="1.3" defaultValue={v.velocidade} style={{ marginBottom: 0, width: 110 }} /></label>
                    <button className="sec">Salvar</button>
                  </form>
                  <div style={{ marginTop: 14 }}>
                    <div className="mudo pequeno" style={{ marginBottom: 6 }}>Frase de teste em português. Gasta poucos créditos só na primeira vez.</div>
                    <audio controls preload="none" src={`/api/vozes/${v.id}/amostra`} style={{ width: "100%" }} />
                  </div>
                  {ps.length > 0 && (
                    <form action={definirPadrao} className="linha" style={{ marginTop: 14 }}>
                      <input type="hidden" name="idExterno" value={v.idExterno} />
                      <select name="perfilId" style={{ margin: 0, width: "auto" }}>{ps.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
                      <button className="sec">Usar como voz padrão do perfil</button>
                    </form>
                  )}
                </details>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
