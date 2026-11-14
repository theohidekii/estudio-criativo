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
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
      <div>
        {cenas ? (
          <Player
            component={Generico}
            inputProps={{ cenas, audio: temAudio ? `/api/videos/${videoId}/audio?v=${numero}` : undefined }}
            durationInFrames={Math.max(30, Math.round(duracao * 30))}
            fps={30}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{ width: 320, borderRadius: 12, border: "1px solid #262633" }}
            controls
            acknowledgeRemotionLicense
          />
        ) : <div className="card" style={{ color: "#f87171" }}>JSON inválido: {erro}</div>}
      </div>
      <div>
        <div style={{ marginBottom: 8 }}>
          <button type="button" onClick={() => setAba("simples")} style={{ background: aba === "simples" ? undefined : "#334155" }}>Editor simples</button>{" "}
          <button type="button" onClick={() => setAba("codigo")} style={{ background: aba === "codigo" ? undefined : "#334155" }}>Código</button>
        </div>
        {aba === "codigo" ? (
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={26} spellCheck={false} style={{ fontFamily: "monospace", fontSize: 12 }} />
        ) : cenas ? (
          <div style={{ maxHeight: 560, overflow: "auto" }}>
            {cenas.cenas.map((c, i) => (
              <div key={i} className="card" style={{ padding: 10 }}>
                <label>Cena {i + 1} começa em (s)
                  <input type="number" step="0.1" min="0" value={c.inicio} onChange={(e) => mudar((x) => { x.cenas[i].inicio = Number(e.target.value); })} />
                </label>
                {c.textos.map((t, j) => (
                  <label key={j}>Texto {j + 1}
                    <input value={t.texto} maxLength={60} onChange={(e) => mudar((x) => { x.cenas[i].textos[j].texto = e.target.value; })} />
                  </label>
                ))}
                {c.personagens.map((p, j) => (
                  <label key={j}>Expressão do personagem {j + 1}
                    <select value={p.expr} onChange={(e) => mudar((x) => { x.cenas[i].personagens[j].expr = e.target.value as never; })} style={{ width: "100%", padding: 8 }}>
                      {["neutral", "stern", "grin", "laugh", "nervous", "shock", "relief", "dazed", "pained", "smile", "smile_closed", "whistle"].map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        <form action={salvar} style={{ marginTop: 8 }}>
          <input type="hidden" name="json" value={texto} />
          <button disabled={!cenas}>Salvar alterações</button>
        </form>
      </div>
    </div>
  );
}
