// Médicos que fizeram loucuras: Barry Marshall bebeu uma bactéria (sem CTA)
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../bridge/toon";
import { Toon, Burst, Room, Tag, Cam, shadeHex, clamp01, rnd, s } from "./Milgram";
import { Cap, Stamp } from "./Milgram2";
import { Medal } from "./Terman";

const FPS = 30;
export const MARSHALL_FRAMES = Math.round(51.5 * FPS);
export const MC = {
  beb: 0.21, prop: 1.36, para: 2.35, med: 3.84, err: 4.78, anos: 5.66, ulc: 8.56, estr: 10.16, pic: 11.03, mas: 12.08, mar: 13.65, war: 15.2, ach: 16.26, bact: 17.76,
  nin: 18.56, col: 20.0, riam: 20.37, prova: 22.76, ent: 23.24, y84: 24.2, mar2: 26.16, arr: 27.16, si: 28.0, bebeu: 28.93, caldo: 29.54, pou: 31.34, dor: 33.22,
  nau: 33.84, vom: 34.51, exa: 35.44, bact3: 36.52, inf: 38.16, causa: 39.72, y05: 41.95, nobel: 44.87, um: 46.08, prova2: 47.36, nin2: 48.19,
};
const WHITE = "#f4f6f7";
const MARSHALL: Outfit = { jacket: WHITE, pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: "#5a3a22", skin: "#f5c9a0", glasses: true };
const SICK: Outfit = { ...MARSHALL, skin: "#b9d68f" };
const WARREN: Outfit = { jacket: WHITE, pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: "#cfcfcf", skin: "#ffe2c2", glasses: true, bow: "#2b5ea8" };
const DOC = (i: number): Outfit => ({ jacket: WHITE, pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: ["#cfcfcf", "#22201f", "#8a5a32", "#5a3a22"][i % 4], skin: ["#ffe2c2", "#e8b88c", "#d9a577", "#f5c9a0"][i % 4], glasses: true, bow: i % 2 ? "#b8322c" : undefined, steth: i === 2, build: i % 2 ? "stout" : undefined });
const LAB = "#9fb6b0", FLOOR = "#8a7a66";
const GRN = "#8fd45a", Y = "#ffd54a", R = "#ff8a7a", GOOD = "#9be7a0";

const Glass: React.FC<{ x: number; y: number; w: number; h: number; level: number; sec: number }> = ({ x, y, w, h, level, sec }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `10px solid ${INK}`, borderTop: "none", borderRadius: "0 0 40px 40px", overflow: "hidden", background: "rgba(220,240,255,.35)", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${level * 100}%`, background: "linear-gradient(#c9d98a,#9ab04a)" }}>
      {Array.from({ length: 14 }, (_, i) => <div key={i} style={{ position: "absolute", left: `${(i * 37) % 85 + 4}%`, top: `${(((sec * 0.4 + i * 0.21) % 1)) * 90}%`, width: 16, height: 16, borderRadius: 8, background: "#4f9a2c", border: `3px solid ${INK}` }} />)}
    </div></div>
);

const Bacteria: React.FC<{ x: number; y: number; r: number; sec: number }> = ({ x, y, r, sec }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r * 0.5, width: r * 2, height: r, borderRadius: r, background: GRN, border: `8px solid ${INK}`, transform: `rotate(${Math.sin(sec * 2 + x) * 20}deg)`, boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: r * 0.5, top: r * 0.25, width: r * 0.18, height: r * 0.18, borderRadius: "50%", background: INK }} />
    <div style={{ position: "absolute", left: r * 1.1, top: r * 0.25, width: r * 0.18, height: r * 0.18, borderRadius: "50%", background: INK }} />
  </div>
);

const Docs: React.FC<{ expr: "neutral" | "grin" | "stern" | "smile"; y?: number; h?: number }> = ({ expr, y = 1760, h = 880 }) => (
  <>{[0, 1, 2].map((i) => <Toon key={i} o={DOC(i)} expr={expr} seed={20 + i} h={i === 1 ? h + 120 : h} x={190 + i * 350} y={y + (i === 1 ? 40 : 0)} look={i === 0 ? 0.3 : i === 2 ? -0.3 : 0} />)}</>
);

type ShotFn = (sec: number, f: number) => React.ReactNode;
const SHOTS: [number, ShotFn][] = [
  [0, (sec) => <Cam a={0} z0={1.05} z1={1.2} origin="50% 55%" noZap><Room wall={LAB} floor={FLOOR}>
    <Toon o={MARSHALL} expr="smile_closed" seed={3} h={1300} x={540} y={1850} />
    <Glass x={330} y={1020} w={420} h={520} level={0.8} sec={sec} /></Room>
    <Cap top={170} size={100} alpha={clamp01((sec - MC.beb) / 0.15)}>ELE BEBEU UMA BACTÉRIA</Cap>
    {sec >= MC.prop && <Tag text="DE PROPÓSITO" x={540} y={560} sec={sec} since={MC.prop} col={R} />}</Cam>],
  [MC.para, (sec) => <Cam a={MC.para} z0={1.0} z1={1.08} kicks={[MC.err]} noZap><Room wall={LAB} floor={FLOOR}><Docs expr={sec >= MC.err ? "stern" : "neutral"} /></Room>
    <Cap top={200} size={90} alpha={clamp01((sec - MC.para) / 0.2)}>PARA PROVAR QUE</Cap>
    {sec >= MC.med && <Cap top={340} size={100} color={Y}>TODOS OS MÉDICOS</Cap>}
    <Stamp text="ERRADOS!" at={MC.err} sec={sec} top={620} size={120} /></Cam>],
  [MC.anos, (sec) => <Cam a={MC.anos} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", fontFamily: "Arial Black", fontSize: 210, color: Y, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke", transform: `scale(${sec - MC.anos < 0.15 ? 2 - 6.6 * (sec - MC.anos) : 1})` }}>ANOS 80</div>
    <Cap top={1000} size={90} alpha={clamp01((sec - 7.0) / 0.2)}>A MEDICINA GARANTIA</Cap></AbsoluteFill></Cam>],
  [MC.ulc, (sec) => <Cam a={MC.ulc} z0={1.0} z1={1.06} noZap><Room wall={LAB} floor={FLOOR}>
    <div style={{ position: "absolute", left: 60, top: 280, width: 960, height: 760, background: "#2f5a46", border: "14px solid #6e4626", boxSizing: "border-box", fontFamily: "Arial Black", color: "#f4f1ea", textAlign: "center" }}>
      <div style={{ fontSize: 100, marginTop: 40 }}>ÚLCERA</div>
      <div style={{ fontSize: 60, color: Y, marginTop: 10 }}>CAUSA?</div>
      {sec >= MC.estr && <div style={{ fontSize: 80, marginTop: 20 }}>😰 ESTRESSE</div>}
      {sec >= MC.pic && <div style={{ fontSize: 80, marginTop: 10 }}>🌶️ PICANTE</div>}</div>
    <Toon o={DOC(0)} expr="smile_closed" seed={21} h={1000} x={540} y={1900} /></Room></Cam>],
  [MC.mas, (sec) => <Cam a={MC.mas} z0={1.0} z1={1.08} noZap><Room wall={LAB} floor={FLOOR}>
    <Toon o={MARSHALL} expr="smile" seed={3} h={1300} x={270} y={1800} look={0.5} />
    <Toon o={WARREN} expr="neutral" seed={9} h={1300} x={810} y={1800} look={-0.5} /></Room>
    {sec >= MC.mar && <Tag text="BARRY MARSHALL" x={430} y={420} sec={sec} since={MC.mar} />}
    {sec >= MC.war && <Tag text="ROBIN WARREN" x={810} y={560} sec={sec} since={MC.war} col="#9be7ff" />}</Cam>],
  [MC.ach, (sec) => <Cam a={MC.ach} z0={1.0} z1={1.06} noZap><Room wall={LAB} floor={FLOOR}>
    <Bacteria x={540} y={520} r={190} sec={sec} />
    <Docs expr={sec >= MC.nin ? "stern" : "neutral"} y={1820} h={700} /></Room>
    {sec >= MC.bact && <Tag text="UMA BACTÉRIA?" x={540} y={760} sec={sec} since={MC.bact} col={GOOD} />}
    {sec >= MC.nin && <Tag text="NINGUÉM ACREDITOU" x={540} y={1050} sec={sec} since={MC.nin} col={R} />}</Cam>],
  [MC.col, (sec) => { const laugh = Math.sin(sec * 22) * 14;
    return <Cam a={MC.col} z0={1.0} z1={1.05} noZap><Room wall={LAB} floor={FLOOR}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${sec >= MC.riam ? laugh : 0}px)` }}><Docs expr="grin" /></div>
      <Toon o={MARSHALL} expr={sec >= MC.prova ? "pained" : "nervous"} seed={3} h={600} x={540} y={1990} /></Room>
    {sec >= MC.riam && <Tag text="HA HA HA!" x={540} y={380} sec={sec} since={MC.riam} col="#ffffff" />}
    {sec >= MC.prova && <Tag text="SEM PROVA" x={540} y={620} sec={sec} since={MC.prova} col={R} />}</Cam>; }],
  [MC.ent, (sec) => <Cam a={MC.ent} z0={1.0} z1={1.05} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Cap top={420} size={100} alpha={clamp01((sec - MC.ent) / 0.15)}>ENTÃO, EM</Cap>
    {sec >= MC.y84 && <div style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center", fontFamily: "Arial Black", fontSize: 300, color: Y, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke", transform: `scale(${sec - MC.y84 < 0.15 ? 2 - 6.6 * (sec - MC.y84) : 1})` }}>1984</div>}</AbsoluteFill></Cam>],
  [MC.mar2, (sec) => <Cam a={MC.mar2} z0={1.0} z1={1.12} origin="50% 40%" noZap><Room wall={LAB} floor={FLOOR}>
    <Toon o={MARSHALL} expr="stern" seed={3} h={1500} x={540} y={1900} /></Room>
    {sec >= MC.arr && <Tag text="UM TESTE ARRISCADO" x={540} y={230} sec={sec} since={MC.arr} col={R} />}
    {sec >= MC.si && <Tag text="EM SI MESMO" x={540} y={400} sec={sec} since={MC.si} col="#ffffff" />}</Cam>],
  [MC.bebeu, (sec) => { const k = clamp01((sec - MC.caldo) / 1.0), tilt = interpolate(sec, [MC.bebeu, MC.caldo], [0, 55], { extrapolateRight: "clamp" });
    return <Cam a={MC.bebeu} z0={1.0} z1={1.1} kicks={[MC.bebeu + 1.6]} noZap><Room wall={LAB} floor={FLOOR}>
      <Toon o={MARSHALL} expr={sec >= MC.caldo ? "pained" : "neutral"} seed={3} h={1300} x={540} y={1850} />
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${tilt}deg)`, transformOrigin: "540px 1000px" }}><Glass x={330} y={900} w={420} h={520} level={0.8 - 0.75 * k} sec={sec} /></div></Room>
    {sec >= MC.caldo && sec < MC.caldo + 0.7 && <Burst x={820} y={520} r={190} text="GLUP!" t={(sec - MC.caldo) / 0.7} col={GOOD} />}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center" }}><span style={{ display: "inline-block", background: "#d63a2e", color: "#fff", fontFamily: "Arial Black", fontSize: 54, padding: "10px 34px", border: `8px solid ${INK}`, borderRadius: 14 }}>NÃO FAÇA ISSO EM CASA</span></div></Cam>; }],
  [MC.pou, (sec) => <Cam a={MC.pou} z0={1.0} z1={1.08} noZap><Room wall={LAB} floor={FLOOR}>
    <Toon o={SICK} expr="pained" seed={3} h={1300} x={540} y={1850} />
    <div style={{ position: "absolute", left: 760, top: 1500, width: 190, height: 220, background: "#9aa3a8", border: `10px solid ${INK}`, borderRadius: "0 0 40px 40px" }} /></Room>
    <Cap top={170} size={90} alpha={clamp01((sec - MC.pou) / 0.2)}>POUCOS DIAS DEPOIS</Cap>
    {sec >= MC.dor && <Tag text="DOR" x={270} y={520} sec={sec} since={MC.dor} col={R} />}
    {sec >= MC.nau && <Tag text="NÁUSEA" x={270} y={700} sec={sec} since={MC.nau} col={GOOD} />}
    {sec >= MC.vom && <Tag text="VÔMITOS" x={270} y={880} sec={sec} since={MC.vom} col={Y} />}</Cam>],
  [MC.exa, (sec) => { const inf = sec >= MC.inf, pulse = inf ? 1 + 0.04 * Math.sin(sec * 12) : 1;
    return <Cam a={MC.exa} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
      <div style={{ position: "absolute", left: 190, top: 380, width: 700, height: 760, background: inf ? "#e2574c" : "#f2a6a0", border: `14px solid ${INK}`, borderRadius: "45% 55% 60% 40% / 40% 40% 60% 60%", transform: `scale(${pulse}) rotate(12deg)`, boxShadow: inf ? "0 0 120px #ff4a3a" : undefined }} />
      {sec >= MC.bact3 && [0, 1, 2, 3, 4, 5].map((i) => <Bacteria key={i} x={380 + (i % 3) * 140 + Math.sin(sec * 2 + i) * 20} y={620 + Math.floor(i / 3) * 190} r={50} sec={sec + i} />)}
      <Cap top={160} size={90} alpha={clamp01((sec - MC.exa) / 0.2)}>O EXAME MOSTROU</Cap>
      {sec >= MC.bact3 && <Tag text="A BACTÉRIA" x={540} y={1250} sec={sec} since={MC.bact3} col={GOOD} />}
      {inf && <Tag text="ESTÔMAGO INFLAMADO" x={540} y={1430} sec={sec} since={MC.inf} col={R} />}
    </AbsoluteFill></Cam>; }],
  [MC.causa, (sec) => <Cam a={MC.causa} z0={1.0} z1={1.08} noZap><Room wall={LAB} floor={FLOOR}>
    <Toon o={MARSHALL} expr="grin" seed={3} h={1000} x={290} y={1900} /><Toon o={WARREN} expr="grin" seed={9} h={1000} x={790} y={1900} /></Room>
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: "Arial Black", fontSize: 300, color: GOOD, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke", transform: `scale(${sec - MC.causa < 0.15 ? 2 - 6.6 * (sec - MC.causa) : 1})` }}>✔</div>
    <Cap top={560} size={84} alpha={clamp01((sec - MC.causa - 0.4) / 0.2)}>A BACTÉRIA ERA A CAUSA</Cap></Cam>],
  [MC.y05, (sec) => <Cam a={MC.y05} z0={1.0} z1={1.08} kicks={[MC.nobel]} noZap><AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%,#4a3d1a,#0f1220 70%)" }}>
    <Cap top={140} size={150} color={Y} alpha={clamp01((sec - MC.y05) / 0.15)}>2005</Cap>
    {sec >= MC.nobel && <Medal x={540} y={900} r={230} sc={interpolate(sec - MC.nobel, [0, 0.15, 0.3], [2.2, 0.9, 1], { extrapolateRight: "clamp" })} />}
    {sec >= MC.nobel && <Cap top={1280} size={80} color={Y}>NOBEL DE MEDICINA</Cap>}
    <Toon o={MARSHALL} expr="grin" seed={3} h={560} x={200} y={1900} /><Toon o={WARREN} expr="grin" seed={9} h={560} x={880} y={1900} /></AbsoluteFill></Cam>],
  [MC.um, (sec) => <Cam a={MC.um} z0={1.0} z1={1.1} noZap><Room wall={LAB} floor={FLOOR}>
    <Toon o={MARSHALL} expr="smile" seed={3} h={1400} x={540} y={1850} />
    <Glass x={680} y={1000} w={260} h={330} level={0.0} sec={sec} /></Room>
    {sec >= MC.um && <Cap top={170} size={96} alpha={clamp01((sec - MC.um) / 0.15)}>UM MÉDICO BEBEU A PROVA</Cap>}
    {sec >= MC.nin2 && <Cap top={470} size={96} color={Y}>PORQUE NINGUÉM ACREDITAVA NELE</Cap>}</Cam>],
];

export const MarshallP1: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  const flash = [MC.err, MC.nobel].some((a) => f >= s(a) && f < s(a) + 2);
  const whip = since < 0.1 && [MC.para, MC.anos, MC.mas, MC.col, MC.ent, MC.pou, MC.exa, MC.y05, MC.um].includes(start);
  const fade = interpolate(sec, [50.5, 51.5], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("marshall/voice.mp3")} />
      <Audio src={staticFile("marshall/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      {flash && <AbsoluteFill style={{ background: "#ffffff", opacity: 0.8 }} />}
      <AbsoluteFill style={{ background: "#0f1220", opacity: fade }} />
    </AbsoluteFill>
  );
};
