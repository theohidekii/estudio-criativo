// Pacote de estilo "Bíblia Animada": vetor suave de livro infantil, areia e pergaminho, colinas verdes, faixas em fita,
// selo de categoria, referência bíblica e legenda branca na parte de baixo. Linguagem visual própria, para histórias em família.
import React from "react";
import { AbsoluteFill } from "remotion";
import type { Cena, Icone, Legenda, Texto } from "./tipos";

export const BIB = { tinta: "#3b2a1a", pergaminho: "#f3e3c0", areia: "#e8cf9c", azul: "#2e6fb7", vermelho: "#c8402f", dourado: "#f4c95d", marinho: "#1d3557", verde: "#8ee07a" };
const SANS = '"Arial Black", Arial, sans-serif';
const pop = (t: number, dur = 0.16) => (t < dur ? 1.2 - 0.2 * (t / dur) : 1);
const rng = (seed: number) => { const x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); };

const Nuvem: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.34, borderRadius: w, background: "#fff", opacity: 0.92, boxShadow: `${w * 0.18}px ${-w * 0.1}px 0 ${-w * 0.02}px #fff` }} />
);
const Colina: React.FC<{ y: number; cor: string; esq?: number; larg?: number }> = ({ y, cor, esq = -200, larg = 1500 }) => (
  <div style={{ position: "absolute", left: esq, top: y, width: larg, height: 1100, borderRadius: "50%", background: cor }} />
);

/** Cenário suave: colinas, deserto, noite, templo ou pergaminho. Os cenários dos outros estilos caem em equivalentes. */
export const CenarioBiblia: React.FC<{ c: Cena; children: React.ReactNode }> = ({ c, children }) => {
  const t = c.cenario.tipo;
  let fundo: React.ReactNode;
  if (t === "deserto") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: c.cenario.cor ?? "linear-gradient(#f5cf90, #fbe9c4 62%)" }} />
        <div style={{ position: "absolute", left: 680, top: 260, width: 240, height: 240, borderRadius: "50%", background: "#f7a43c", boxShadow: "0 0 0 34px rgba(247,164,60,.25)" }} />
        <Colina y={1000} cor="#e6c488" esq={-500} larg={1700} /><Colina y={1130} cor="#d9ae6c" esq={300} larg={1500} /><Colina y={1300} cor="#cc9b58" esq={-300} larg={1900} />
      </>
    );
  } else if (t === "noite" || t === "escuro") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: c.cenario.cor ?? "linear-gradient(#0d1a45, #26346f 70%, #3a4a8a)" }} />
        {Array.from({ length: 46 }, (_, i) => <div key={i} style={{ position: "absolute", left: rng(i) * 1060, top: 60 + rng(i + 99) * 900, width: 5 + rng(i + 7) * 7, height: 5 + rng(i + 7) * 7, borderRadius: "50%", background: "#fff6d6", opacity: 0.5 + rng(i + 3) * 0.5 }} />)}
        <div style={{ position: "absolute", left: 780, top: 220, width: 150, height: 150, borderRadius: "50%", background: "#fdf3c4", boxShadow: "0 0 0 24px rgba(253,243,196,.15)" }} />
        <Colina y={1150} cor="#16224f" esq={-300} larg={1700} /><Colina y={1320} cor="#101a42" esq={200} larg={1500} />
      </>
    );
  } else if (t === "templo" || t === "sala" || t === "quarto") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: c.cenario.cor ?? "linear-gradient(#f2e2bf, #e6d1a2)" }} />
        {[110, 800].map((x) => <div key={x} style={{ position: "absolute", left: x, top: 260, width: 170, height: 1050, background: "linear-gradient(90deg, #d6bd90, #ead7ae 50%, #d6bd90)", borderRadius: 14 }} />)}
        <div style={{ position: "absolute", left: 250, top: 330, width: 580, height: 980, borderRadius: "290px 290px 0 0", background: "linear-gradient(#cfe7f2, #f6e9c6)", opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1310, bottom: 0, background: c.cenario.piso ?? "linear-gradient(#c9ad7c, #b3966a)" }} />
      </>
    );
  } else if (t === "pergaminho") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: c.cenario.cor ?? BIB.pergaminho }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(120,80,30,.35) 100%)" }} />
      </>
    );
  } else if (t === "chapado" || t === "cor") {
    fundo = <AbsoluteFill style={{ background: c.cenario.cor ?? BIB.areia }} />;
  } else {
    fundo = (
      <>
        <AbsoluteFill style={{ background: c.cenario.cor ?? "linear-gradient(#8fd0f0, #d9f0fa 60%)" }} />
        <Nuvem x={90} y={230} w={300} /><Nuvem x={640} y={380} w={260} /><Nuvem x={380} y={560} w={200} />
        <Colina y={950} cor="#6fb552" esq={-500} larg={1700} /><Colina y={1080} cor="#5da64a" esq={250} larg={1500} /><Colina y={1260} cor={c.cenario.piso ?? "#4c9440"} esq={-300} larg={1900} />
      </>
    );
  }
  return <AbsoluteFill style={{ overflow: "hidden" }}>{fundo}{children}</AbsoluteFill>;
};

/** Faixa em fita (swallowtail) com o tema da cena. */
export const FaixaBiblia: React.FC<{ t: Texto; sec: number }> = ({ t, sec }) => {
  const k = sec - (t.aparece ?? 0);
  if (k < 0) return null;
  const fundo = t.cor && t.cor !== "#ffd54a" ? t.cor : BIB.azul;
  return (
    <div style={{ position: "absolute", left: t.x, top: t.y, transform: `translate(-50%, -50%) rotate(-1.5deg) scale(${pop(k)})`, filter: "drop-shadow(0 8px 0 rgba(59,42,26,.28))", maxWidth: 960 }}>
      <div style={{ background: fundo, color: "#fff", padding: "20px 78px", fontFamily: SANS, fontSize: Math.min(t.tamanho, 76), lineHeight: 1.12, textAlign: "center", textTransform: "uppercase",
        whiteSpace: t.texto.length <= 22 ? "nowrap" : "normal", width: t.texto.length <= 22 ? "max-content" : 860,
        clipPath: "polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%)", borderTop: "6px solid rgba(255,255,255,.35)" }}>{t.texto}</div>
    </div>
  );
};

/** Selo de categoria no topo (ex.: "HISTÓRIA · GÊNESIS"). */
export const SeloBiblia: React.FC<{ t: Texto; sec: number }> = ({ t, sec }) => {
  const k = sec - (t.aparece ?? 0);
  if (k < 0) return null;
  return (
    <div style={{ position: "absolute", left: t.x, top: t.y, transform: `translate(-50%, -50%) scale(${pop(k)})`, background: BIB.marinho, color: BIB.dourado, border: `4px solid ${BIB.dourado}`, borderRadius: 40,
      padding: "6px 30px", fontFamily: SANS, fontSize: Math.min(t.tamanho, 36), letterSpacing: 1.5, whiteSpace: "nowrap", textTransform: "uppercase", boxShadow: "0 6px 0 rgba(0,0,0,.2)" }}>{t.texto}</div>
  );
};

/** Citação bíblica em um papel de pergaminho, sempre com livro, capítulo e versículo. */
export const ReferenciaBiblia: React.FC<{ texto: string; sec: number }> = ({ texto, sec }) => (
  <div style={{ position: "absolute", left: 540, top: 1352, transform: `translate(-50%, -50%) scale(${pop(sec, 0.2)})`, background: "#f8edd1", border: "5px solid #8a6a3a", borderRadius: 12, padding: "8px 30px 8px 22px",
    display: "flex", alignItems: "center", gap: 14, boxShadow: "0 6px 0 rgba(59,42,26,.25)" }}>
    <div style={{ width: 34, height: 40, borderRadius: 4, background: BIB.vermelho, border: "3px solid #8a6a3a", position: "relative" }}><div style={{ position: "absolute", left: 6, right: 6, top: 8, height: 4, background: "#f8edd1" }} /><div style={{ position: "absolute", left: 6, right: 6, top: 17, height: 4, background: "#f8edd1" }} /></div>
    <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: 44, color: "#5a3d1c", whiteSpace: "nowrap" }}>{texto}</span>
  </div>
);

export const IconeBiblia: React.FC<{ i: Icone; sec: number }> = ({ i, sec }) => {
  const k = sec - (i.aparece ?? 0);
  if (k < 0) return null;
  const s = i.tamanho;
  const forma: Record<string, React.ReactNode> = {
    cruz: <><rect x="40" y="6" width="20" height="88" rx="4" fill={BIB.dourado} stroke={BIB.tinta} strokeWidth="4" /><rect x="14" y="30" width="72" height="20" rx="4" fill={BIB.dourado} stroke={BIB.tinta} strokeWidth="4" /></>,
    coracao: <path d="M50 88 C10 56 6 28 28 20 C40 16 48 24 50 32 C52 24 60 16 72 20 C94 28 90 56 50 88Z" fill="#e0475b" stroke={BIB.tinta} strokeWidth="4" strokeLinejoin="round" />,
    estrela: <polygon points="50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38" fill={BIB.dourado} stroke={BIB.tinta} strokeWidth="4" strokeLinejoin="round" />,
    sol: <><circle cx="50" cy="50" r="24" fill="#f7a43c" stroke={BIB.tinta} strokeWidth="4" />{Array.from({ length: 8 }, (_, n) => <line key={n} x1={50 + Math.cos((n * Math.PI) / 4) * 34} y1={50 + Math.sin((n * Math.PI) / 4) * 34} x2={50 + Math.cos((n * Math.PI) / 4) * 46} y2={50 + Math.sin((n * Math.PI) / 4) * 46} stroke="#f7a43c" strokeWidth="7" strokeLinecap="round" />)}</>,
    coroa: <polygon points="8,76 14,30 34,52 50,22 66,52 86,30 92,76" fill={BIB.dourado} stroke={BIB.tinta} strokeWidth="4" strokeLinejoin="round" />,
  };
  return <svg viewBox="0 0 100 100" style={{ position: "absolute", left: i.x - s / 2, top: i.y - s / 2, width: s, height: s, transform: `scale(${pop(k, 0.22)})`, overflow: "visible" }}>{forma[i.tipo]}</svg>;
};

/** Legenda branca grande na parte de baixo, com contorno marrom; palavras em `destaques` ganham dourado ou verde. */
export const LegendaBiblia: React.FC<{ sec: number; legendas?: Legenda[]; destaques?: string[]; top?: number }> = ({ sec, legendas, destaques = [], top = 1480 }) => {
  const l = legendas?.find((x) => sec >= x.inicio && sec < Math.max(x.fim, x.inicio + 0.2));
  if (!l) return null;
  let n = 0;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top, textAlign: "center", fontFamily: SANS, fontSize: 92, lineHeight: 1.04, color: "#fff", WebkitTextStroke: `15px ${BIB.tinta}`, paintOrder: "stroke",
      transform: `scale(${pop(sec - l.inicio, 0.12)})`, transformOrigin: "50% 50%" }}>
      {l.texto.split(" ").map((w, i) => {
        const marcada = destaques.includes(w.replace(/[^\p{L}\p{N}]/gu, ""));
        return <span key={i} style={{ color: marcada ? [BIB.dourado, BIB.verde][n++ % 2] : "#fff" }}>{w}{" "}</span>;
      })}
    </div>
  );
};
