// Pacote de estilo "Volta por Cima": vetor chapado, contorno escuro grosso, cores saturadas, legenda grande,
// HUD de jogo no topo, adesivos de ação, etiquetas e telas de celular. Linguagem visual própria, inspirada em séries de humor curtas.
import React from "react";
import { AbsoluteFill } from "remotion";
import type { Adesivo, Celular as CelularT, Cena, Hud as HudT, Legenda, Texto } from "./tipos";

export const VPC = { tinta: "#17141f", amarelo: "#ffd23f", vermelho: "#f0364f", azul: "#3b9cff", verde: "#35c95f", rosa: "#ff8fb1" };
const FONTE = 'Impact, "Arial Narrow", "Arial Black", sans-serif';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pop = (t: number, dur = 0.14) => (t < dur ? 1.35 - 0.35 * (t / dur) : 1);

const Casa: React.FC<{ x: number; y: number; w: number; h: number; cor: string; telhado: string }> = ({ x, y, w, h, cor, telhado }) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    <div style={{ position: "absolute", left: -8, top: -h * 0.42, width: 0, height: 0, borderLeft: `${w / 2 + 8}px solid transparent`, borderRight: `${w / 2 + 8}px solid transparent`, borderBottom: `${h * 0.42}px solid ${telhado}`, filter: `drop-shadow(0 0 0 ${VPC.tinta})` }} />
    <div style={{ width: w, height: h, background: cor, border: `6px solid ${VPC.tinta}`, borderRadius: 6 }}>
      <div style={{ position: "absolute", left: w * 0.15, top: h * 0.25, width: w * 0.26, height: w * 0.26, background: "#bfe6fb", border: `5px solid ${VPC.tinta}` }} />
      <div style={{ position: "absolute", right: w * 0.15, bottom: 0, width: w * 0.24, height: h * 0.55, background: "#8a5a35", border: `5px solid ${VPC.tinta}` }} />
    </div>
  </div>
);
const Arvore: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    <div style={{ position: "absolute", left: r * 0.8, top: r * 1.5, width: r * 0.4, height: r * 1.1, background: "#8a5a35", border: `5px solid ${VPC.tinta}` }} />
    <div style={{ width: r * 2, height: r * 2, borderRadius: "50%", background: "#2fae48", border: `6px solid ${VPC.tinta}` }} />
  </div>
);

/** Cenário do estilo: cor chapada com raios, parque, rua ou quarto (todos em vetor chapado com contorno). */
export const CenarioVPC: React.FC<{ c: Cena; children: React.ReactNode }> = ({ c, children }) => {
  const { tipo, cor, piso, raios } = c.cenario;
  let fundo: React.ReactNode;
  if (tipo === "parque" || tipo === "rua") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: cor ?? "linear-gradient(#6fc3f5, #c4e9fb 55%)" }} />
        <div style={{ position: "absolute", left: 120, top: 220, width: 260, height: 90, borderRadius: 60, background: "#fff", opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 700, top: 330, width: 220, height: 76, borderRadius: 60, background: "#fff", opacity: 0.9 }} />
        <Casa x={70} y={900} w={220} h={190} cor="#f3c34a" telhado="#d9453c" />
        <Casa x={420} y={870} w={240} h={220} cor="#d9453c" telhado="#2d6fcf" />
        <Casa x={780} y={910} w={210} h={180} cor="#4a90d9" telhado="#f3c34a" />
        <Arvore x={330} y={800} r={90} /><Arvore x={-30} y={760} r={110} /><Arvore x={940} y={790} r={100} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1090, bottom: 0, background: tipo === "rua" ? "#6d7380" : (piso ?? "linear-gradient(#58c24a, #3a9a3c)"), borderTop: `8px solid ${VPC.tinta}` }} />
        {tipo === "rua" && [0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 40 + i * 220, top: 1420, width: 130, height: 16, background: "#f4f1e8" }} />)}
      </>
    );
  } else if (tipo === "quarto") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: `repeating-linear-gradient(90deg, ${cor ?? "#efd9f5"} 0 70px, #e2c4ec 70px 140px)` }} />
        <div style={{ position: "absolute", left: 70, top: 300, width: 260, height: 330, background: "#bfe6fb", border: `10px solid ${VPC.tinta}`, borderRadius: 8 }}>
          <div style={{ position: "absolute", left: 105, top: 0, width: 10, height: "100%", background: VPC.tinta }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1280, bottom: 0, background: piso ?? "#b98a5c", borderTop: `8px solid ${VPC.tinta}` }} />
      </>
    );
  } else if (tipo === "chapado" || tipo === "cor") {
    fundo = (
      <>
        <AbsoluteFill style={{ background: cor ?? VPC.rosa }} />
        {raios !== false && <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 46%, rgba(255,255,255,0.18) 0deg 7deg, rgba(255,255,255,0) 7deg 14deg)" }} />}
      </>
    );
  } else {
    fundo = <AbsoluteFill style={{ background: tipo === "escuro" ? "linear-gradient(#1a2142, #0c0f22)" : (cor ?? "#9fb6b0") }} />;
  }
  return <AbsoluteFill style={{ overflow: "hidden" }}>{fundo}{children}</AbsoluteFill>;
};

const COR_DESTAQUE = [VPC.vermelho, VPC.azul, VPC.verde, "#ffffff"];

/** Legenda grande ao centro, em maiúsculas, contorno escuro; palavras em `destaques` mudam de cor. */
export const LegendaVPC: React.FC<{ sec: number; legendas?: Legenda[]; destaques?: string[]; top?: number }> = ({ sec, legendas, destaques = [], top = 1010 }) => {
  const l = legendas?.find((x) => sec >= x.inicio && sec < Math.max(x.fim, x.inicio + 0.2));
  if (!l) return null;
  const t = sec - l.inicio;
  let n = 0;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top, textAlign: "center", fontFamily: FONTE, fontSize: 124, lineHeight: 0.98, letterSpacing: 1, color: VPC.amarelo,
      WebkitTextStroke: `16px ${VPC.tinta}`, paintOrder: "stroke", transform: `scale(${pop(t)})`, transformOrigin: "50% 50%" }}>
      {l.texto.split(" ").map((w, i) => {
        const marcada = destaques.includes(w.replace(/[^\p{L}\p{N}]/gu, ""));
        const cor = marcada ? COR_DESTAQUE[n++ % COR_DESTAQUE.length] : VPC.amarelo;
        return <span key={i} style={{ color: cor }}>{w}{" "}</span>;
      })}
    </div>
  );
};

export const Pilula: React.FC<{ t: Texto; sec: number }> = ({ t, sec }) => {
  const k = sec - (t.aparece ?? 0);
  if (k < 0) return null;
  return (
    <div style={{ position: "absolute", left: t.x, top: t.y, transform: `translate(-50%, -50%) scale(${pop(k)})` }}>
      <div style={{ background: VPC.amarelo, color: VPC.tinta, border: `6px solid ${VPC.tinta}`, borderRadius: 16, padding: "6px 22px", fontFamily: "Arial Black, Arial", fontSize: Math.min(t.tamanho, 46), whiteSpace: "nowrap", lineHeight: 1.2 }}>{t.texto.toUpperCase()}</div>
      <div style={{ position: "absolute", left: "50%", bottom: -20, width: 0, height: 0, marginLeft: -12, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: `20px solid ${VPC.tinta}` }} />
    </div>
  );
};

export const Titulo: React.FC<{ t: Texto; sec: number }> = ({ t, sec }) => {
  const k = sec - (t.aparece ?? 0);
  if (k < 0) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: t.y, textAlign: "center", fontFamily: FONTE, fontSize: Math.min(t.tamanho, 120), lineHeight: 1.0, color: t.cor ?? "#fff",
      WebkitTextStroke: `${Math.max(10, t.tamanho / 7)}px ${VPC.tinta}`, paintOrder: "stroke", transform: `scale(${pop(k)})` }}>{t.texto.toUpperCase()}</div>
  );
};

/** Cor de texto legível sobre um fundo #rrggbb (claro → tinta escura, escuro → branco). */
const textoSobre = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? VPC.tinta : "#fff";
};

export const AdesivoVPC: React.FC<{ a: Adesivo; sec: number }> = ({ a, sec }) => {
  const k = sec - (a.aparece ?? 0);
  if (k < 0) return null;
  const fundo = a.cor ?? VPC.vermelho;
  return (
    <div style={{ position: "absolute", left: a.x, top: a.y, transform: `translate(-50%, -50%) rotate(${a.rotacao ?? -6}deg) scale(${pop(k, 0.18)})`, background: fundo, color: textoSobre(fundo),
      border: `7px solid ${VPC.tinta}`, borderRadius: 10, padding: "4px 26px", fontFamily: FONTE, fontSize: 64, letterSpacing: 1, whiteSpace: "nowrap", boxShadow: `6px 6px 0 ${VPC.tinta}` }}>{a.texto.toUpperCase()}</div>
  );
};

const CORES = { vermelho: VPC.vermelho, verde: VPC.verde, azul: VPC.azul, amarelo: VPC.amarelo };
/** HUD de jogo no topo: contagem regressiva à esquerda e barras de status à direita. */
export const HudVPC: React.FC<{ h: HudT }> = ({ h }) => (
  <div style={{ position: "absolute", left: 28, right: 28, top: 56, display: "flex", gap: 14 }}>
    <div style={{ width: 210, background: "#17171f", border: `5px solid ${VPC.tinta}`, borderTop: `6px solid ${VPC.amarelo}`, borderRadius: 10, padding: "8px 10px", textAlign: "center", color: "#fff" }}>
      <div style={{ fontFamily: "Arial", fontWeight: 700, fontSize: 19, lineHeight: 1.1 }}>{h.titulo.toUpperCase()}</div>
      <div style={{ fontFamily: FONTE, fontSize: 70, lineHeight: 1, color: VPC.amarelo }}>{h.numero}</div>
    </div>
    <div style={{ flex: 1, background: "#17171f", border: `5px solid ${VPC.tinta}`, borderTop: `6px solid ${VPC.vermelho}`, borderRadius: 10, padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 22px", color: "#fff" }}>
      {h.barras.map((b) => (
        <div key={b.nome}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Arial", fontWeight: 700, fontSize: 22 }}><span>{b.nome.toUpperCase()}</span><span style={{ color: CORES[b.cor] }}>{b.texto ?? `${Math.round(b.valor)}%`}</span></div>
          <div style={{ height: 9, background: "#3a3a46", borderRadius: 5, marginTop: 4 }}><div style={{ width: `${b.valor}%`, height: "100%", background: CORES[b.cor], borderRadius: 5 }} /></div>
        </div>
      ))}
    </div>
  </div>
);

/** Tela de celular com conversa ou comprovante de Pix. */
export const CelularVPC: React.FC<{ c: CelularT; sec: number }> = ({ c, sec }) => {
  const k = sec - (c.aparece ?? 0);
  if (k < 0) return null;
  const L = c.largura, H = L * 1.9, f = L / 300;
  return (
    <div style={{ position: "absolute", left: c.x - L / 2, top: c.y - H / 2, width: L, height: H, transform: `scale(${pop(k, 0.2)})`, background: "#0e0d14", border: `${10 * f}px solid ${VPC.tinta}`, borderRadius: L * 0.14, boxShadow: `8px 8px 0 rgba(0,0,0,.25)`, overflow: "hidden" }}>
      <div style={{ background: c.tipo === "pix" ? "#1faa59" : "#128c7e", color: "#fff", fontFamily: "Arial", fontWeight: 700, fontSize: 24 * f, padding: `${16 * f}px ${14 * f}px` }}>{c.titulo}</div>
      <div style={{ background: "#efe7de", height: "100%", padding: 14 * f }}>
        {c.tipo === "pix" && <div style={{ textAlign: "center", margin: `${6 * f}px 0 ${12 * f}px` }}><div style={{ width: 74 * f, height: 74 * f, borderRadius: "50%", background: VPC.verde, margin: "0 auto", color: "#fff", fontSize: 50 * f, lineHeight: `${74 * f}px`, fontWeight: 900 }}>✓</div><div style={{ fontFamily: "Arial", fontWeight: 800, fontSize: 21 * f, marginTop: 8 * f, color: "#1b3a26" }}>PIX ENVIADO</div></div>}
        {c.linhas.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: l.de === "eu" ? "flex-end" : "flex-start", marginBottom: 10 * f }}>
            <div style={{ maxWidth: "82%", background: l.de === "eu" ? "#d9fdd3" : "#fff", border: `${3 * f}px solid ${VPC.tinta}`, borderRadius: 14 * f, padding: `${8 * f}px ${12 * f}px`, fontFamily: "Arial", fontWeight: 600, fontSize: 21 * f, lineHeight: 1.25, color: VPC.tinta }}>{l.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const hudDaCena = (cenas: Cena[], i: number): HudT | undefined => {
  for (let k = i; k >= 0; k--) if (cenas[k].hud) return cenas[k].hud;
  return undefined;
};
export { clamp01 };
