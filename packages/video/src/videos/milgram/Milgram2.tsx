// "Milgram, Parte 2": the real result (65%), the actor, and the variant where two people refuse (10%). Ends with the CTA.
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../bridge/toon";
import { Toon, Burst, Room, Counter, Tag, Cam, Chair, PressCU, HERO, SCIENTIST, LAB_WALL, LAB_FLOOR, ROOM2_WALL, shadeHex, clamp01, rnd, s } from "./Milgram";

const FPS = 30;
export const MILGRAM2_FRAMES = Math.round(32.0 * FPS);

// cue sheet (seconds) from out/milgram2/voice/words.json; scripts/milgram2_fx.py uses the same numbers
export const T2 = {
  psi: 1.01, dots: 2.32, mil: 2.86, erra: 4.12, res: 5.46, f26: 5.79, pct: 7.08, ult: 8.69, suav: 10.36, trem: 11.41, ped: 12.06, cont: 13.21,
  ator: 14.28, ator2: 14.99, zero: 16.22, det: 17.44, qcn: 18.42, peers: 19.81, rec: 21.34, ten: 22.27, ten2: 22.93, nao: 24.05, nao2: 24.8,
  grupo: 25.32, grin: 25.9, cta: 26.59, faca: 28.67, bio: 29.71,
};

const DOC1: Outfit = { ...SCIENTIST, hair: "#c9c9c9" };
const DOC2: Outfit = { ...SCIENTIST, jacket: "#c9d3d8", hair: "#5a3a22" };
const DOC3: Outfit = { ...SCIENTIST, skin: "#d9a577" };
const PEER1: Outfit = { ...HERO, jacket: "#4f86b8", hair: "#22201f" };
const PEER2: Outfit = { ...HERO, jacket: "#5f9a58", hair: "#8a5a32", skin: "#e8b88c" };
const RED = "#ff5a4a", GREEN = "#7fd68a", GREY = "#c9d1d8";

type ShotFn = (sec: number, f: number) => React.ReactNode;

const Cap: React.FC<{ top: number; size?: number; color?: string; children: React.ReactNode; alpha?: number }> = ({ top, size = 100, color = "#fff", children, alpha = 1 }) => (
  <div style={{ position: "absolute", left: 50, right: 50, top, textAlign: "center", fontFamily: "Arial Black, Impact, Arial", fontSize: size, lineHeight: 1.05, color, opacity: alpha,
    WebkitTextStroke: `${Math.round(size * 0.07)}px ${INK}`, paintOrder: "stroke" }}>{children}</div>
);

const Stamp: React.FC<{ text: string; at: number; sec: number; top: number; color?: string; rot?: number; size?: number }> = ({ text, at, sec, top, color = "#d63a2e", rot = -10, size = 170 }) => {
  const t = sec - at; if (t < 0) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center" }}>
    <span style={{ display: "inline-block", fontFamily: "Arial Black, Impact", fontSize: size, color, border: `14px solid ${color}`, borderRadius: 24, padding: "0 40px", background: "rgba(255,255,255,.9)",
      transform: `rotate(${rot}deg) scale(${t < 0.12 ? 2.4 - 11.6 * t : 1})` }}>{text}</span></div>;
};

/** grid of little people; colorOf(i) picks the fill, popAt(i) is the second it pops in */
const People: React.FC<{ n: number; cols: number; x: number; y: number; cw: number; ch: number; sec: number; colorOf: (i: number) => string; popAt?: (i: number) => number }> =
  ({ n, cols, x, y, cw, ch, sec, colorOf, popAt }) => (
    <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      {Array.from({ length: n }, (_, i) => {
        const cx = x + (i % cols) * cw + cw / 2, cy = y + Math.floor(i / cols) * ch + ch / 2, c = colorOf(i);
        const t = popAt ? sec - popAt(i) : 1, p = c === RED && popAt ? (t < 0 ? 0 : t < 0.12 ? 1 + 0.5 * (1 - t / 0.12) : 1) : 1;
        return <g key={i} transform={`translate(${cx} ${cy}) scale(${p}) translate(${-cx} ${-cy})`}>
          <rect x={cx - cw * 0.27} y={cy - ch * 0.02} width={cw * 0.54} height={ch * 0.42} rx={cw * 0.16} fill={c} stroke={INK} strokeWidth={5} />
          <circle cx={cx} cy={cy - ch * 0.2} r={cw * 0.2} fill={c} stroke={INK} strokeWidth={5} />
        </g>;
      })}
    </svg>
  );

const Dots: React.FC<{ sec: number }> = ({ sec }) => {
  const red = 500, tr = sec - T2.mil;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      {Array.from({ length: 1000 }, (_, i) => {
        const c = i % 40, r = Math.floor(i / 40), cx = 72 + c * 24, cy = 560 + r * 24;
        const o = clamp01((sec - T2.dots - (c + r) * 0.012) / 0.15);
        if (i === red && tr >= 0) return null;
        return <circle key={i} cx={cx} cy={cy} r={8.5} fill={GREY} stroke={INK} strokeWidth={2} opacity={o} />;
      })}
      {tr >= 0 && <g>
        <circle cx={72 + 20 * 24} cy={560 + 12 * 24} r={34 + 14 * Math.max(0, 1 - tr * 4)} fill="none" stroke="#ffd54a" strokeWidth={7} opacity={0.9 - 0.4 * clamp01(tr)} />
        <circle cx={72 + 20 * 24} cy={560 + 12 * 24} r={14} fill={RED} stroke={INK} strokeWidth={4} />
      </g>}
    </svg>
  );
};

const doctors = (expr: "neutral" | "shock" | "stern") => <>
  <Toon o={DOC1} expr={expr} seed={21} h={820} x={190} y={1560} look={0.4} />
  <Toon o={DOC3} expr={expr} seed={22} h={820} x={890} y={1560} look={-0.4} />
  <Toon o={DOC2} expr={expr} seed={23} h={900} x={540} y={1600} />
</>;

const Sweat: React.FC<{ sec: number }> = ({ sec }) => <>
  {Array.from({ length: 6 }, (_, k) => {
    const ph = (((sec - T2.suav) * 1.1 + k / 6) % 1 + 1) % 1;
    return <div key={k} style={{ position: "absolute", left: 360 + k * 70 + (k % 2) * 24, top: 430 + ph * 380, width: 30, height: 44, background: "#9be7ff", border: `5px solid ${INK}`,
      borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%", opacity: 1 - ph * 0.8 }} />;
  })}
</>;

const SHOTS: [number, ShotFn][] = [
  // HOOK -----------------------------------------------------------------
  [0, (sec, f) => <AbsoluteFill style={{ background: "#0f1220", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "#ffd54a", border: `10px solid ${INK}`, borderRadius: 20, padding: "20px 60px", fontFamily: "Arial Black, Impact, Arial", fontSize: 150, color: INK,
      transform: `scale(${interpolate(f, [0, 6], [1.8, 1], { extrapolateRight: "clamp" })}) rotate(-3deg)` }}>PARTE 2</div>
    <div style={{ marginTop: 50, fontFamily: "Arial Black, Arial", fontSize: 70, color: "#fff", textAlign: "center", opacity: clamp01((sec - 0.3) / 0.3) }}>O resultado real</div>
  </AbsoluteFill>],
  [T2.psi, (sec) => <Cam a={T2.psi} z0={1.0} z1={1.1} noZap><Room wall={LAB_WALL} floor={LAB_FLOOR}>{doctors("neutral")}</Room>
    <Tag text="PSIQUIATRAS" x={540} y={330} sec={sec} since={T2.psi} /></Cam>],
  [T2.dots, (sec) => <Cam a={T2.dots} z0={1.0} z1={1.05} origin="50% 40%" punch={T2.mil} noZap>
    <AbsoluteFill style={{ background: "#0f1220" }}><Dots sec={sec} /></AbsoluteFill>
    <Counter label="A APOSTA" value="1/1000" color="#ffd54a" since={T2.mil - 0.3} sec={sec} top={150} /></Cam>],
  [T2.erra, (sec) => <Cam a={T2.erra} z0={1.0} z1={1.12} kicks={[T2.erra]} noZap><Room wall={LAB_WALL} floor={LAB_FLOOR}>{doctors("shock")}</Room>
    <Stamp text="ERRADO!" at={T2.erra} sec={sec} top={420} /></Cam>],
  // RESULT ---------------------------------------------------------------
  [T2.res, (sec) => {
    const n = clamp01((sec - T2.f26) / 1.3), count = Math.min(26, Math.floor(n * 27));
    return <Cam a={T2.res} z0={1.0} z1={1.05} kicks={[T2.pct]} noZap>
      <AbsoluteFill style={{ background: "#0f1220" }}>
        <People n={40} cols={8} x={60} y={640} cw={120} ch={190} sec={sec} colorOf={(i) => (i < 26 && sec >= T2.f26 + i * 0.05 ? RED : GREY)} popAt={(i) => T2.f26 + i * 0.05} />
        {sec < T2.pct ? <Counter label="FORAM ATÉ O FIM" value={`${count} / 40`} color="#ff8a7a" since={T2.res} sec={sec} top={170} />
          : <Counter label="OBEDECERAM ATÉ 450 V" value="65%" color="#ff8a7a" since={T2.pct} sec={sec} top={170} />}
      </AbsoluteFill></Cam>;
  }],
  [T2.ult, (sec) => <PressCU sec={sec} press={9.5} volts={450} label="ÚLTIMO" danger tremble={4} />],
  // THEY WERE SUFFERING --------------------------------------------------
  [T2.suav, (sec, f) => {
    const sh = sec >= T2.trem ? Math.sin(f * 2.1) * 9 : 0;
    return <Cam a={T2.suav} z0={1.0} z1={1.12} origin="50% 30%" noZap><Room wall={LAB_WALL} floor={LAB_FLOOR}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${sh}px)` }}>
        <Toon o={HERO} expr={sec >= T2.ped ? "pained" : "nervous"} seed={3} h={1700} x={540} y={1950} look={0.5} />
        {sec >= T2.suav && <Sweat sec={sec} />}
      </div>
    </Room>
    {sec >= T2.ped && <Tag text="POSSO PARAR?" x={540} y={190} sec={sec} since={T2.ped} col="#ffffff" />}</Cam>;
  }],
  [T2.cont, () => <Cam a={T2.cont} z0={1.25} z1={1.45} origin="50% 28%" punch={T2.cont + 0.1} noZap><Room wall={shadeHex(LAB_WALL, 0.85)} floor={LAB_FLOOR}>
    <Toon o={SCIENTIST} expr="stern" seed={7} h={2400} x={540} y={2600} breathe={false} /></Room>
    <Cap top={1500} size={110} color="#ffd54a">CONTINUARAM</Cap></Cam>],
  // THE ACTOR ------------------------------------------------------------
  [T2.ator, (sec) => <>
    <Cam a={T2.ator} z0={1.0} z1={1.1} origin="50% 55%" noZap><Room wall={ROOM2_WALL} floor={LAB_FLOOR}>
      <Chair sec={sec} expr={sec >= T2.ator2 ? "smile" : "neutral"} zap={0} strap={1} /></Room></Cam>
    {sec < T2.zero ? <Tag text="ERA UM ATOR" x={540} y={1560} sec={sec} since={T2.ator2 - 0.2} col="#9be7ff" />
      : <Counter label="CHOQUES REAIS" value="0" color="#9be7a0" since={T2.zero} sec={sec} top={1560} />}
  </>],
  // THE DETAIL -----------------------------------------------------------
  [T2.det, (sec) => <Cam a={T2.det} z0={1.0} z1={1.1} noZap><Room wall={shadeHex(LAB_WALL, 0.85)} floor={LAB_FLOOR} dark={0.35}>
    <Toon o={HERO} expr="neutral" seed={3} h={1300} x={540} y={1800} look={Math.sin(sec * 1.5) * 0.6} /></Room>
    <Cap top={230} size={130} color="#ffd54a" alpha={clamp01((sec - T2.det) / 0.15)}>UM DETALHE</Cap>
    <Cap top={470} size={78} alpha={clamp01((sec - T2.qcn) / 0.2)}>QUE QUASE NINGUÉM CONTA</Cap></Cam>],
  // TWO PEOPLE REFUSE ----------------------------------------------------
  [T2.peers, (sec) => {
    const no = sec >= T2.rec;
    return <Cam a={T2.peers} z0={1.0} z1={1.1} noZap><Room wall={LAB_WALL} floor={LAB_FLOOR}>
      <Toon o={PEER1} expr={no ? "stern" : "nervous"} seed={31} h={1100} x={190} y={1650} look={0.5} />
      <Toon o={PEER2} expr={no ? "stern" : "nervous"} seed={32} h={1100} x={890} y={1650} look={-0.5} />
      <Toon o={HERO} expr={no ? "smile" : "nervous"} seed={3} h={1300} x={540} y={1760} />
    </Room>
    {no && <Tag text="NÃO" x={190} y={420} sec={sec} since={T2.rec} col="#ff8a7a" />}
    {sec >= T2.rec + 0.25 && <Tag text="NÃO" x={890} y={420} sec={sec} since={T2.rec + 0.25} col="#ff8a7a" />}
    </Cam>;
  }],
  [T2.ten, (sec) => <Cam a={T2.ten} z0={1.0} z1={1.05} kicks={[T2.ten2]} noZap>
    <AbsoluteFill style={{ background: "#0f1220" }}>
      <People n={40} cols={8} x={60} y={640} cw={120} ch={190} sec={sec} colorOf={(i) => (i < 4 && sec >= T2.ten + 0.1 + i * 0.15 ? RED : GREEN)} popAt={(i) => T2.ten + 0.1 + i * 0.15} />
      <Counter label="OBEDECERAM" value="10%" color="#ff8a7a" since={T2.ten2} sec={sec} top={170} />
    </AbsoluteFill></Cam>],
  // ONE "NO" -------------------------------------------------------------
  [T2.nao, (sec) => <>
    <Cam a={T2.nao} z0={1.15} z1={1.4} origin="50% 30%" punch={T2.nao2} noZap><Room wall={LAB_WALL} floor={LAB_FLOOR}>
      <Toon o={HERO} expr={sec >= T2.nao2 ? "stern" : "neutral"} seed={3} h={2000} x={540} y={2250} /></Room></Cam>
    {sec >= T2.nao2 && sec < T2.nao2 + 0.5 && <Burst x={540} y={470} r={300} text="NÃO!" t={(sec - T2.nao2) / 0.5} col="#7fd68a" />}
  </>],
  [T2.grupo, (sec) => {
    const grin = sec >= T2.grin;
    return <Cam a={T2.grupo} z0={1.0} z1={1.1} noZap><Room wall={LAB_WALL} floor={LAB_FLOOR}>
      <Toon o={PEER1} expr={grin ? "grin" : "stern"} seed={31} h={1100} x={190} y={1650} look={0.5} />
      <Toon o={PEER2} expr={grin ? "grin" : "stern"} seed={32} h={1100} x={890} y={1650} look={-0.5} />
      <Toon o={HERO} expr={grin ? "grin" : "stern"} seed={3} h={1300} x={540} y={1760} />
    </Room>
    <Cap top={230} size={96} color="#7fd68a">O GRUPO INTEIRO MUDA</Cap></Cam>;
  }],
  // CTA ------------------------------------------------------------------
  [T2.cta, (sec) => <AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Cap top={300} size={104} alpha={clamp01((sec - T2.cta) / 0.15)}>COMO VOCÊ</Cap>
    <Cap top={440} size={104} color="#ffd54a" alpha={clamp01((sec - T2.cta - 0.5) / 0.15)}>REAGE À</Cap>
    <Cap top={580} size={130} color="#ff8a7a" alpha={clamp01((sec - T2.cta - 1.0) / 0.15)}>PRESSÃO?</Cap>
    <Toon o={HERO} expr="nervous" seed={3} h={900} x={540} y={1850} look={Math.sin(sec * 2) * 0.7} />
  </AbsoluteFill>],
  [T2.faca, (sec, f) => {
    const t = sec - T2.faca, tb = sec - T2.bio;
    return <AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
      <Cap top={300} size={90}>DESCUBRA</Cap>
      <div style={{ position: "absolute", left: 120, right: 120, top: 520, textAlign: "center", background: "#ffd54a", border: `12px solid ${INK}`, borderRadius: 36, padding: "36px 0",
        fontFamily: "Arial Black, Arial", fontSize: 110, color: INK, transform: `scale(${t < 0.15 ? 0.6 + 2.7 * t : 1 + 0.03 * Math.sin(f / 4)}) rotate(-2deg)` }}>FAÇA O TESTE</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", fontFamily: "Arial Black, Arial", fontSize: 92, color: "#fff", WebkitTextStroke: `6px ${INK}`, paintOrder: "stroke",
        opacity: clamp01(tb / 0.15), transform: `translateY(${tb < 0 ? 30 : 0}px)` }}>🔗 LINK NA BIO</div>
      <Toon o={HERO} expr="grin" seed={3} h={850} x={540} y={1850} />
    </AbsoluteFill>;
  }],
];

export const MilgramP2: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  const flash = [T2.erra, T2.pct, T2.nao2].some((a) => f >= s(a) && f < s(a) + 2);
  const whip = since < 0.1 && [T2.psi, T2.res, T2.ator, T2.det, T2.peers, T2.cta].includes(start);
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("milgram2/voice.mp3")} />
      <Audio src={staticFile("milgram2/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      {flash && <AbsoluteFill style={{ background: "#ffffff", opacity: 0.8 }} />}
    </AbsoluteFill>
  );
};
export { Cap, Stamp };
