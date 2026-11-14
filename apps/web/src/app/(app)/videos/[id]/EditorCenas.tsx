"use client";
import { Player } from "@remotion/player";
import { Generico } from "@estudio/video/src/generic/Generico";
import type { Cenas } from "@estudio/video/src/generic/tipos";
import { useMemo, useState } from "react";

type Props = {
  videoId: number;
  numero: number;
  inicial: string;
  duracao: number;
  temAudio: boolean;
  salvar: (formData: FormData) => Promise<void>;
};

/** Pré-visualização ao vivo + editor simples (textos e tempos) + aba de código (JSON). */
export default function EditorCenas({ videoId, numero, inicial, duracao, temAudio, salvar }: Props) {
  const [texto, setTexto] = useState(inicial);
  const [aba, setAba] = useState<"simples" | "codigo">("simples");

  const { cenas, erro } = useMemo(() => {
    try {
      const j = JSON.parse(texto) as Cenas;
      if (!Array.isArray(j.cenas) || j.cenas.length === 0) throw new Error("sem cenas");
      return { cenas: { ...j, duracao }, erro: "" };
    } catch (e) {
      return { cenas: null, erro: String((e as Error).message) };
    }
  }, [texto, duracao]);

  const mudar = (fn: (c: Cenas) => void) => {
    if (!cenas) return;
    const copia = JSON.parse(JSON.stringify(cenas)) as Cenas;
    fn(copia);
    setTexto(JSON.stringify(copia, null, 2));
  };

  return (
    <div className="editor">
      <div style={{ position: "sticky", top: 16 }}>
        {cenas ? (
          <Player
            component={Generico}
            inputProps={{ cenas, audio: temAudio ? `/api/videos/${videoId}/audio?v=${numero}` : undefined }}
            durationInFrames={Math.max(30, Math.round(duracao * 30))}
            fps={30}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{ width: 320, borderRadius: 10, border: "1px solid var(--linha-forte)" }}
            controls
            acknowledgeRemotionLicense
          />
        ) : <div className="aviso erro">O JSON está inválido: {erro}. Corrija na aba Código.</div>}
      </div>
      <div>
        <div className="linha" style={{ marginBottom: 12 }}>
          <button type="button" onClick={() => setAba("simples")} className={aba === "simples" ? "peq" : "sec peq"}>Editor simples</button>
          <button type="button" onClick={() => setAba("codigo")} className={aba === "codigo" ? "peq" : "sec peq"}>Código</button>
        </div>
        {aba === "codigo" ? (
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={26} spellCheck={false} className="mono" style={{ marginTop: 0 }} />
        ) : cenas ? (
          <div style={{ maxHeight: 560, overflow: "auto", paddingRight: 4 }}>
            {cenas.cenas.map((c, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>
                <div className="linha" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                  <strong>Cena {i + 1}</strong>
                  <label className="linha mudo pequeno" style={{ fontWeight: 400 }}>começa em
                    <input type="number" step="0.1" min="0" value={c.inicio} className="mono" style={{ width: 84, margin: 0, padding: "4px 8px" }}
                      onChange={(e) => mudar((x) => { x.cenas[i].inicio = Number(e.target.value); })} />s
                  </label>
                </div>
                {c.textos.map((t, j) => (
                  <label key={j}>Texto {j + 1}
                    <input value={t.texto} maxLength={60} onChange={(e) => mudar((x) => { x.cenas[i].textos[j].texto = e.target.value; })} />
                  </label>
                ))}
                {c.personagens.map((p, j) => (
                  <label key={j}>Expressão do personagem {j + 1}
                    <select value={p.expr} onChange={(e) => mudar((x) => { x.cenas[i].personagens[j].expr = e.target.value as never; })} style={{ marginBottom: 0 }}>
                      {["neutral", "stern", "grin", "laugh", "nervous", "shock", "relief", "dazed", "pained", "smile", "smile_closed", "whistle"].map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        <form action={salvar} style={{ marginTop: 12 }}>
          <input type="hidden" name="json" value={texto} />
          <button disabled={!cenas}>Salvar alterações</button>
        </form>
      </div>
    </div>
  );
}
