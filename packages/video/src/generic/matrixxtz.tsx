// Pacote de estilo "Matrixxtz 2D": 2D com textura de papel e grão de filme, paleta quente e dessaturada, fundo desfocado
// (profundidade de campo), feixe de luz pela janela, objetos que flutuam e legenda branca condensada com uma palavra em cor.
// Linguagem visual própria, para humor e ciência do dia a dia. Os desenhos aqui são originais.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import type { Cena, Legenda, Objeto } from "./tipos";

const { fontFamily: CONDENSADA } = loadFont("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });
export const CIN = { ocre: "#f0b23c", vermelho: "#e0483a", creme: "#f2e6cc", sombra: "rgba(10,6,4,.62)" };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const rng = (seed: number) => { const x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); };

const Janela: React.FC<{ x: number; y: number; w: number; h: number; vidro?: string }> = ({ x, y, w, h, vidro = "#f6ecd0" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: `linear-gradient(135deg, ${vidro}, #e8d7ae)`, border: "14px solid #5a4631", borderRadius: 6, boxShadow: "0 0 120px 40px rgba(255,226,160,.45), inset 0 0 40px rgba(255,255,255,.5)" }}>
    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 10, background: "#5a4631", marginLeft: -5 }} />
    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 10, background: "#5a4631", marginTop: -5 }} />
  </div>
);

/** Fundo ilustrado de cada ambiente, em tons quentes. Este bloco é o que recebe o desfoque. */
const Fundo: React.FC<{ c: Cena }> = ({ c }) => {
  const t = c.cenario.tipo;
  const cor = c.cenario.cor;
  if (t === "rua" || t === "parque") {
    const parque = t === "parque";
    return (
      <>
        <AbsoluteFill style={{ background: cor ?? "linear-gradient(#eab27c, #f4d9a8 55%, #e9c89a)" }} />
        {[{ x: 40, w: 300, h: 330, p: "#b5533c", c: "#cfa27a" }, { x: 380, w: 320, h: 400, p: "#8f4a3a", c: "#d9b48a" }, { x: 740, w: 340, h: 340, p: "#b5533c", c: "#c99b72" }].map((h, i) => (
          <div key={i} style={{ position: "absolute", left: h.x, top: 760 - h.h * 0.2, width: h.w, height: h.h, background: h.c }}>
            <div style={{ position: "absolute", left: -20, right: -20, top: -70, height: 70, background: h.p, clipPath: "polygon(8% 100%, 50% 0, 92% 100%)" }} />
            <div style={{ position: "absolute", left: "12%", top: "26%", width: "30%", height: "28%", background: "#8fa6a8", border: "8px solid #5a4631" }} />
            <div style={{ position: "absolute", right: "12%", bottom: 0, width: "26%", height: "44%", background: "#6b4a34" }} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 1090, bottom: 0, background: parque ? "linear-gradient(#7a9a52, #5e7e42)" : "linear-gradient(#77706a, #5d5753)" }} />
        {!parque && [0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 30 + i * 220, top: 1420, width: 130, height: 14, background: "#e3d8c0", opacity: 0.8 }} />)}
        <div style={{ position: "absolute", left: 90, top: 250, width: 14, height: 860, background: "#4a3a2a" }} />
      </>
    );
  }
  if (t === "noite" || t === "escuro") {
    return (
      <>
        <AbsoluteFill style={{ background: cor ?? "linear-gradient(#1a2038, #0d1020 70%, #15182b)" }} />
        <div style={{ position: "absolute", left: 640, top: 300, width: 520, height: 900, background: "radial-gradient(ellipse at 50% 0%, rgba(255,214,150,.35), rgba(255,214,150,0) 70%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1250, bottom: 0, background: "linear-gradient(#232638, #12141f)" }} />
      </>
    );
  }
  const cozinha = t === "cozinha";
  return (
    <>
      <AbsoluteFill style={{ background: cor ?? (cozinha ? "linear-gradient(#cdbb99, #b4a07e)" : "linear-gradient(#b39478, #9a7d62)") }} />
      {cozinha && <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(90,70,50,.18) 0 4px, rgba(0,0,0,0) 4px 110px), repeating-linear-gradient(90deg, rgba(90,70,50,.18) 0 4px, rgba(0,0,0,0) 4px 110px)" }} />}
      <Janela x={t === "quarto" ? 700 : 90} y={330} w={300} h={400} />
      {!cozinha && <div style={{ position: "absolute", left: t === "quarto" ? 640 : 30, top: 300, width: 70, height: 560, background: "linear-gradient(90deg, #6e3f5e, #8a5476)", borderRadius: 8 }} />}
      {!cozinha && <div style={{ position: "absolute", left: 640, top: 520, width: 250, height: 200, background: "#d9a04a", border: "12px solid #5a4631", opacity: 0.9 }} />}
      {cozinha && <div style={{ position: "absolute", left: 0, right: 0, top: 1010, height: 40, background: "#6e5238" }} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: cozinha ? 1050 : 1240, bottom: 0, background: cozinha ? "linear-gradient(#8e8d86, #6f6e68)" : "repeating-linear-gradient(90deg, #8a6a4a 0 150px, #7d5f42 150px 154px)" }} />
    </>
  );
};

/** Cenário completo: fundo desfocado, feixe de luz da janela, grão de filme animado, vinheta e correção de cor. */
export const CenarioCinema: React.FC<{ c: Cena; children: React.ReactNode }> = ({ c, children }) => {
  const f = useCurrentFrame();
  const semente = Math.floor(f / 2) % 7;
  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: "saturate(.88) contrast(1.05) sepia(.08)" }}>
      <div style={{ position: "absolute", inset: -20, filter: `blur(${c.desfoque ?? 3}px)` }}><Fundo c={c} /></div>
      <div style={{ position: "absolute", left: 120, top: -100, width: 700, height: 1700, transform: "rotate(-24deg)", transformOrigin: "50% 0", background: "linear-gradient(rgba(255,236,190,.34), rgba(255,236,190,0) 75%)", mixBlendMode: "screen", filter: "blur(18px)" }} />
      {children}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, mixBlendMode: "overlay", pointerEvents: "none" }} aria-hidden="true">
        <filter id="graoFilme"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={semente + 1} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#graoFilme)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(20,10,4,.55) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const FORMAS: Record<string, React.ReactNode> = {
  ovo: <><defs><radialGradient id="gOvo" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#fff8e4" /><stop offset="0.7" stopColor="#e9d8b4" /><stop offset="1" stopColor="#c9b184" /></radialGradient></defs><ellipse cx="50" cy="56" rx="28" ry="37" fill="url(#gOvo)" /></>,
  lata: <><rect x="28" y="22" width="44" height="62" rx="6" fill="#d8a73a" /><rect x="28" y="40" width="44" height="22" fill="#b8402f" /><ellipse cx="50" cy="22" rx="22" ry="6" fill="#efe1b8" /><rect x="32" y="26" width="6" height="52" fill="rgba(255,255,255,.28)" /></>,
  celular: <><rect x="28" y="10" width="44" height="80" rx="8" fill="#26262e" /><rect x="33" y="18" width="34" height="62" rx="3" fill="#cfe6f2" /><rect x="38" y="26" width="24" height="5" fill="#26262e" opacity=".5" /><rect x="38" y="36" width="18" height="5" fill="#26262e" opacity=".35" /></>,
  controle: <><rect x="34" y="8" width="32" height="84" rx="9" fill="#3a3a42" /><circle cx="50" cy="24" r="5" fill="#d8483a" /><circle cx="42" cy="40" r="3.5" fill="#a9a9b4" /><circle cx="58" cy="40" r="3.5" fill="#a9a9b4" /><circle cx="42" cy="52" r="3.5" fill="#a9a9b4" /><circle cx="58" cy="52" r="3.5" fill="#a9a9b4" /><rect x="40" y="66" width="20" height="14" rx="3" fill="#2a2a30" /></>,
  despertador: <><circle cx="50" cy="56" r="32" fill="#c25b3a" /><circle cx="50" cy="56" r="26" fill="#efe7d2" /><path d="M50 56 L50 38 M50 56 L64 62" stroke="#3a2a22" strokeWidth="3.5" strokeLinecap="round" /><circle cx="28" cy="22" r="9" fill="#b0a58a" /><circle cx="72" cy="22" r="9" fill="#b0a58a" /></>,
  nota: <><rect x="8" y="30" width="84" height="42" rx="4" fill="#e6a050" /><circle cx="50" cy="51" r="12" fill="#f4d29a" /><rect x="14" y="36" width="12" height="6" fill="#b8742e" /><rect x="74" y="60" width="12" height="6" fill="#b8742e" /></>,
  copo: <><path d="M28 18 L72 18 L66 84 L34 84 Z" fill="rgba(210,232,240,.55)" /><path d="M31 44 L69 44 L66 84 L34 84 Z" fill="rgba(150,200,225,.8)" /><rect x="36" y="22" width="5" height="56" fill="rgba(255,255,255,.4)" /></>,
  livro: <><rect x="18" y="20" width="64" height="62" rx="4" fill="#7a4a34" /><rect x="24" y="26" width="52" height="50" fill="#efe3c4" /><path d="M30 38 H70 M30 48 H70 M30 58 H60" stroke="#8a7a5a" strokeWidth="2.5" /></>,
};

/** Objeto de cena com sombra suave; quando `flutua`, sobe e desce devagar e gira (efeito de telecinese). */
export const ObjetoCinema: React.FC<{ o: Objeto; sec: number }> = ({ o, sec }) => {
  const k = sec - (o.aparece ?? 0);
  if (k < 0) return null;
  const ph = (o.x + o.y) * 0.013;
  const dy = o.flutua ? Math.sin(sec * 1.7 + ph) * 18 : 0;
  const rot = (o.rotacao ?? 0) + (o.flutua ? Math.sin(sec * 1.1 + ph) * 9 : 0);
  return (
    <svg viewBox="0 0 100 100" style={{ position: "absolute", left: o.x - o.tamanho / 2, top: o.y - o.tamanho / 2 + dy, width: o.tamanho, height: o.tamanho, transform: `rotate(${rot}deg)`, opacity: clamp01(k / 0.18), filter: "drop-shadow(0 12px 14px rgba(20,10,4,.45))", overflow: "visible" }}>
      {FORMAS[o.tipo]}
    </svg>
  );
};

/** Legenda branca condensada no terço inferior, com sombra fina; palavras em `destaques` ficam ocre ou vermelhas. */
export const LegendaCinema: React.FC<{ sec: number; legendas?: Legenda[]; destaques?: string[]; top?: number }> = ({ sec, legendas, destaques = [], top = 1380 }) => {
  const l = legendas?.find((x) => sec >= x.inicio && sec < Math.max(x.fim, x.inicio + 0.2));
  if (!l) return null;
  let n = 0;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", fontFamily: CONDENSADA, fontWeight: 700, fontSize: 104, lineHeight: 1.05, letterSpacing: 1, color: "#fff", textShadow: `0 4px 0 ${CIN.sombra}, 0 0 22px rgba(0,0,0,.55)`, opacity: clamp01((sec - l.inicio) / 0.1) }}>
      {l.texto.split(" ").map((w, i) => {
        const marcada = destaques.includes(w.replace(/[^\p{L}\p{N}]/gu, ""));
        return <span key={i} style={{ color: marcada ? [CIN.ocre, CIN.vermelho][n++ % 2] : "#fff" }}>{w}{" "}</span>;
      })}
    </div>
  );
};
