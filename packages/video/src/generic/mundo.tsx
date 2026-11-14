// Pacote de estilo "Mundo Oculto": linhas brancas de giz sobre roxo escuro, tremor de desenho à mão, texto manuscrito no topo
// com destaque em vermelho, ícones que se desenham sozinhos. Para curiosidades e ciência. Linguagem visual própria.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PatrickHand";
import type { Cena, Icone, Legenda, Texto } from "./tipos";

const { fontFamily: MANUSCRITO } = loadFont();
export const MUN = { fundo1: "#1c1033", fundo2: "#0a0615", giz: "#f4f0ff", vermelho: "#ff4d4d" };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Filtros SVG: "giz" transforma qualquer desenho em contorno branco; "tremor" balança as linhas, trocando a cada 3 quadros. */
export const FiltrosMundo: React.FC = () => {
  const f = useCurrentFrame();
  const semente = (Math.floor(f / 3) % 5) + 1;
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="giz" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feFlood floodColor="#000" result="bg" />
          <feMerge result="sobre"><feMergeNode in="bg" /><feMergeNode in="SourceGraphic" /></feMerge>
          <feColorMatrix in="sobre" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="cinza" />
          <feConvolveMatrix in="cinza" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" edgeMode="duplicate" preserveAlpha="true" result="borda" />
          <feColorMatrix in="borda" type="matrix" values="0 0 0 0 0.96  0 0 0 0 0.94  0 0 0 0 1  5 0 0 0 0" result="linha" />
          <feMorphology in="linha" operator="dilate" radius="1.2" />
        </filter>
        <filter id="tremor" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" seed={semente} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};

/** Fundo roxo muito escuro com um leve brilho central e grão de quadro-negro. */
export const CenarioMundo: React.FC<{ c: Cena; children: React.ReactNode }> = ({ c, children }) => (
  <AbsoluteFill style={{ overflow: "hidden", background: c.cenario.cor ?? `radial-gradient(ellipse at 50% 42%, #2a1850 0%, ${MUN.fundo1} 40%, ${MUN.fundo2} 100%)` }}>
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }} aria-hidden="true">
      <filter id="grao"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#grao)" />
    </svg>
    {children}
  </AbsoluteFill>
);

const cor = (destaque?: boolean) => (destaque ? MUN.vermelho : MUN.giz);
type Forma = (c: string) => React.ReactNode;
const FORMAS: Record<string, Forma> = {
  coracao: () => <path d="M50 86 C10 56 6 28 28 20 C40 16 48 24 50 32 C52 24 60 16 72 20 C94 28 90 56 50 86Z" pathLength={1} />,
  estrela: () => <polygon points="50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38" pathLength={1} />,
  sol: () => <><circle cx="50" cy="50" r="22" pathLength={1} />{[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <line key={n} pathLength={1} x1={50 + Math.cos((n * Math.PI) / 4) * 32} y1={50 + Math.sin((n * Math.PI) / 4) * 32} x2={50 + Math.cos((n * Math.PI) / 4) * 46} y2={50 + Math.sin((n * Math.PI) / 4) * 46} />)}</>,
  cruz: () => <><path d="M50 8 L50 92" pathLength={1} /><path d="M18 36 L82 36" pathLength={1} /></>,
  coroa: () => <polyline points="8,76 14,30 34,52 50,22 66,52 86,30 92,76 8,76" pathLength={1} />,
  ovni: () => <><ellipse cx="50" cy="60" rx="42" ry="12" pathLength={1} /><path d="M30 54 C32 28 68 28 70 54" pathLength={1} /><circle cx="26" cy="66" r="2.5" /><circle cx="50" cy="71" r="2.5" /><circle cx="74" cy="66" r="2.5" /><path d="M36 74 L20 98" pathLength={1} /><path d="M64 74 L80 98" pathLength={1} /></>,
  olho: () => <><path d="M6 50 C24 20 76 20 94 50 C76 80 24 80 6 50Z" pathLength={1} /><circle cx="50" cy="50" r="15" pathLength={1} /><circle cx="50" cy="50" r="5" /></>,
  cerebro: () => <><path d="M50 16 C30 8 12 22 16 42 C6 48 8 66 22 70 C24 84 44 88 50 80 C56 88 76 84 78 70 C92 66 94 48 84 42 C88 22 70 8 50 16Z" pathLength={1} /><path d="M50 16 L50 80" pathLength={1} /><path d="M30 40 C38 36 40 46 34 50" pathLength={1} /><path d="M70 40 C62 36 60 46 66 50" pathLength={1} /></>,
  lampada: () => <><circle cx="50" cy="40" r="22" pathLength={1} /><path d="M40 62 L40 74 L60 74 L60 62" pathLength={1} /><path d="M42 84 L58 84" pathLength={1} /><path d="M18 12 L26 20 M82 12 L74 20 M8 40 L16 40 M92 40 L84 40" pathLength={1} /></>,
  relogio: () => <><circle cx="50" cy="50" r="40" pathLength={1} /><path d="M50 50 L50 24 M50 50 L68 60" pathLength={1} /><path d="M50 10 L50 16 M90 50 L84 50 M50 90 L50 84 M10 50 L16 50" pathLength={1} /></>,
  seta: () => <><path d="M10 74 C28 20 62 18 86 52" pathLength={1} /><path d="M86 52 L66 50 M86 52 L82 32" pathLength={1} /></>,
  interrogacao: () => <><path d="M32 34 C30 8 74 8 70 34 C68 50 50 50 50 66" pathLength={1} /><path d="M50 82 L50 84" pathLength={1} /></>,
  circulo: () => <path d="M14 44 C10 20 50 8 80 20 C98 30 96 66 66 84 C36 98 6 80 14 44 C18 38 24 32 32 28" pathLength={1} />,
};

/** Ícone de linha que se desenha sozinho em 0,6 s. Em vermelho quando `destaque`. */
export const IconeGiz: React.FC<{ i: Icone; sec: number }> = ({ i, sec }) => {
  const k = sec - (i.aparece ?? 0);
  if (k < 0) return null;
  const prog = clamp01(k / 0.6);
  const c = cor(i.destaque ?? i.tipo === "circulo");
  const forma = FORMAS[i.tipo] ?? FORMAS.circulo;
  return (
    <svg viewBox="0 0 100 100" style={{ position: "absolute", left: i.x - i.tamanho / 2, top: i.y - i.tamanho / 2, width: i.tamanho, height: i.tamanho, overflow: "visible" }}>
      <g fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray={1} strokeDashoffset={1 - prog} style={{ strokeDasharray: 1, strokeDashoffset: 1 - prog }}>
        {forma(c)}
      </g>
    </svg>
  );
};

/** Texto manuscrito; trechos entre *asteriscos* ficam em vermelho. Aparece "sendo escrito", da esquerda para a direita. */
const Manuscrito: React.FC<{ texto: string; destaques?: string[]; reveal: number }> = ({ texto, destaques = [], reveal }) => (
  <span style={{ display: "inline-block", clipPath: `inset(-10px ${100 * (1 - reveal)}% -10px 0)` }}>
    {texto.split(/(\*[^*]+\*)/).map((parte, i) => {
      if (parte.startsWith("*")) return <span key={i} style={{ color: MUN.vermelho }}>{parte.slice(1, -1)}</span>;
      return <React.Fragment key={i}>{parte.split(" ").map((w, j) => {
        const marcada = destaques.includes(w.replace(/[^\p{L}\p{N}-]/gu, "").toUpperCase());
        return <span key={j} style={{ color: marcada ? MUN.vermelho : MUN.giz }}>{w}{" "}</span>;
      })}</React.Fragment>;
    })}
  </span>
);

/** Frase da narração em manuscrito grande no topo (a legenda deste estilo). */
export const LegendaMundo: React.FC<{ sec: number; legendas?: Legenda[]; destaques?: string[]; top?: number }> = ({ sec, legendas, destaques, top = 190 }) => {
  const l = legendas?.find((x) => sec >= x.inicio && sec < Math.max(x.fim, x.inicio + 0.2));
  if (!l) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, textAlign: "center", fontFamily: MANUSCRITO, fontSize: 112, lineHeight: 1.12, color: MUN.giz, textShadow: "0 0 18px rgba(180,150,255,.35)" }}>
      <Manuscrito texto={l.texto} destaques={destaques} reveal={clamp01((sec - l.inicio) / 0.3)} />
    </div>
  );
};

/** Anotação manuscrita ao lado de um desenho. */
export const AnotacaoMundo: React.FC<{ t: Texto; sec: number }> = ({ t, sec }) => {
  const k = sec - (t.aparece ?? 0);
  if (k < 0) return null;
  const grande = t.estilo === "grande";
  return (
    <div style={{ position: "absolute", left: t.x, top: t.y, transform: "translate(-50%, -50%) rotate(-3deg)", fontFamily: MANUSCRITO, fontSize: Math.min(t.tamanho, grande ? 96 : 72), color: t.cor === "#ff4d4d" ? MUN.vermelho : MUN.giz, whiteSpace: "nowrap" }}>
      <Manuscrito texto={t.texto} reveal={clamp01(k / 0.45)} />
      <div style={{ height: 4, marginTop: 2, background: MUN.vermelho, width: `${100 * clamp01(k / 0.6)}%`, opacity: grande ? 0 : 0.9, borderRadius: 4 }} />
    </div>
  );
};
