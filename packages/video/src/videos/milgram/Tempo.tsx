// Curiosidades do dia a dia: "Por que o tempo passa mais rápido quando ficamos mais velhos" (sem CTA)
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../bridge/toon";
import { Toon, Room, Tag, Cam, shadeHex, clamp01, rnd, s, HERO } from "./Milgram";
import { Cap } from "./Milgram2";

const FPS = 30;
export const TEMPO_FRAMES = Math.round(53.6 * FPS);
export const TP = {
  fer: 0.52, cri: 2.0, par: 2.93, etern: 3.81, hoje: 4.88, voando: 6.56, parece: 7.42, novo: 8.67, panet: 9.48, nin: 11.36, pesq: 13.56, hip: 14.36,
  prim: 15.24, prop: 16.15, dez: 17.22, decimo: 19.04, cinq: 20.4, cinqt: 21.66, cada: 22.68, seg: 24.64, nov: 25.66, infan: 26.61, vez: 28.36, cereb: 29.6,
  rot: 31.44, comp: 34.06, det: 35.44, est: 36.92, quin: 38.19, idade: 39.59, sem: 41.58, dif: 42.84, olhar: 44.27, ult: 45.74, talvez: 46.86, lemb: 49.8, curta: 51.18,
};
const KID: Outfit = { ...HERO, build: "kid", hat: "cap", cap: "#e2453c" };
const OLD: Outfit = { ...HERO, hair: "#bfbfbf", glasses: true };
const DOC = (i: number): Outfit => ({ jacket: "#f4f6f7", pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: ["#cfcfcf", "#5a3a22", "#22201f"][i % 3], skin: ["#ffe2c2", "#e8b88c", "#d9a577"][i % 3], glasses: true });
const SKY = "#8fd0f0", GRASS = "#7fbf6a", OFFICE = "#b9c1c6", OFFF = "#7a7f86";
const Y = "#ffd54a", R = "#ff8a7a", G = "#9be7a0";

const Calendar: React.FC<{ x: number; y: number; w: number; crossed: number; title: string }> = ({ x, y, w, crossed, title }) => {
  const cw = w / 7, ch = cw * 0.95;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, background: "#f6efdf", border: `10px solid ${INK}`, borderRadius: 14, boxSizing: "content-box", overflow: "hidden" }}>
      <div style={{ background: "#c0353a", color: "#fff", fontFamily: "Arial Black", fontSize: cw * 0.5, textAlign: "center", padding: "10px 0", borderBottom: `8px solid ${INK}` }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", padding: 8 }}>
        {Array.from({ length: 31 }, (_, i) => <div key={i} style={{ width: cw - 2, height: ch, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontFamily: "Arial Black", fontSize: cw * 0.38, color: "#2a2420" }}>
          {i + 1}{i < crossed && <div style={{ position: "absolute", inset: 8, color: "#d63a2e", fontSize: cw * 0.95, lineHeight: `${ch - 16}px`, textAlign: "center" }}>✕</div>}
        </div>)}
      </div>
    </div>
  );
};

const Pages: React.FC<{ sec: number; start: number }> = ({ sec, start }) => (
  <>{Array.from({ length: 9 }, (_, i) => {
    const ph = (((sec - start) * 1.8 + i * 0.13) % 1 + 1) % 1;
    return <div key={i} style={{ position: "absolute", left: 1150 - ph * 1500, top: 280 + (i % 4) * 200 + Math.sin(ph * 9 + i) * 40, width: 200, height: 250, background: "#f6efdf", border: `7px solid ${INK}`, transform: `rotate(${ph * 520 + i * 20}deg)`, opacity: 0.95 }}>
      <div style={{ height: 50, background: "#c0353a", borderBottom: `5px solid ${INK}` }} /></div>;
  })}</>
);

const Photo: React.FC<{ x: number; y: number; t: number; c: string; k: number }> = ({ x, y, t, c, k }) => {
  if (t < 0) return null;
  const sc = t < 0.15 ? 1.5 - 3.3 * t : 1;
  return <div style={{ position: "absolute", left: x, top: y, width: 260, height: 310, background: "#fff", border: `7px solid ${INK}`, boxSizing: "border-box", padding: 16, transform: `rotate(${(k % 3 - 1) * 4}deg) scale(${sc})` }}>
    <div style={{ width: "100%", height: 200, background: c, border: `5px solid ${INK}`, position: "relative" }}>
      {k % 4 === 0 && <div style={{ position: "absolute", left: 80, top: 40, width: 70, height: 70, borderRadius: 35, background: "#ffe066", border: `5px solid ${INK}` }} />}
      {k % 4 === 1 && <div style={{ position: "absolute", left: 60, top: 80, width: 120, height: 80, background: "#fff", border: `5px solid ${INK}`, borderRadius: 10 }} />}
      {k % 4 === 2 && <div style={{ position: "absolute", left: 80, top: 50, width: 80, height: 80, borderRadius: 40, background: "#e2453c", border: `5px solid ${INK}` }} />}
      {k % 4 === 3 && <div style={{ position: "absolute", left: 50, top: 90, width: 140, height: 60, background: "#6e4626", border: `5px solid ${INK}` }} />}
    </div></div>;
};

const Clock: React.FC<{ sec: number; x: number; y: number; r: number }> = ({ sec, x, y, r }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: "#f6efdf", border: `14px solid ${INK}`, boxSizing: "border-box" }}>
    {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ position: "absolute", left: r - 5, top: 10, width: 10, height: 28, background: INK, transformOrigin: `5px ${r - 24}px`, transform: `rotate(${i * 30}deg)` }} />)}
    <div style={{ position: "absolute", left: r - 6, top: r * 0.22, width: 12, height: r * 0.8, background: INK, borderRadius: 6, transformOrigin: "50% 85%", transform: `rotate(${sec * 90}deg)` }} />
    <div style={{ position: "absolute", left: r - 14, top: r - 14, width: 28, height: 28, borderRadius: 14, background: "#d63a2e", border: `5px solid ${INK}` }} />
  </div>
);

const Lifebar: React.FC<{ n: number; cols: number; x: number; y: number; cell: number; hi: number; sec: number; since: number }> = ({ n, cols, x, y, cell, hi, sec, since }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const t = sec - since - i * (1.2 / n), on = i < hi, sc = t < 0 ? 0 : t < 0.1 ? 1.3 : 1;
    return <div key={i} style={{ position: "absolute", left: x + (i % cols) * (cell + 6), top: y + Math.floor(i / cols) * (cell + 6), width: cell, height: cell, background: i === 0 ? Y : "#c9d1d8", border: `${Math.max(3, cell / 12)}px solid ${INK}`, borderRadius: cell / 6, boxSizing: "border-box", transform: `scale(${sc})`, opacity: on ? 1 : 0.4 }} />;
  })}</>
);

const Title: React.FC<{ sec: number; at: number; num: string; text: string; col: string }> = ({ sec, at, num, text, col }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", transform: `scale(${sec - at < 0.15 ? 2 - 6.6 * (sec - at) : 1})` }}>
      <span style={{ display: "inline-flex", width: 260, height: 260, borderRadius: 130, background: col, border: `12px solid ${INK}`, alignItems: "center", justifyContent: "center", fontFamily: "Arial Black", fontSize: 190, color: INK }}>{num}</span></div>
    <Cap top={900} size={120} color={col} alpha={clamp01((sec - at - 0.1) / 0.2)}>{text}</Cap>
  </AbsoluteFill>
);

type ShotFn = (sec: number, f: number) => React.ReactNode;
const SHOTS: [number, ShotFn][] = [
  [0, (sec) => <Cam a={0} z0={1.0} z1={1.1} noZap><Room wall={SKY} floor={GRASS} lamp={false}>
    <div style={{ position: "absolute", left: 800, top: 420, width: 200, height: 200, borderRadius: 100, background: "#ffe066", border: `10px solid ${INK}` }} />
    <Toon o={KID} expr="grin" seed={5} h={1300} x={540} y={1800} />
    <div style={{ position: "absolute", left: 330, top: 800, width: 120, height: 190, background: "#4f86b8", border: `8px solid ${INK}`, borderRadius: 30, transform: "rotate(-8deg)" }} /></Room>
    <Cap top={170} size={80} color={Y} alpha={clamp01((sec - TP.fer) / 0.2)}>FÉRIAS DE FIM DE ANO</Cap></Cam>],
  [TP.cri, (sec) => <Cam a={TP.cri} z0={1.0} z1={1.06} noZap><Room wall={CLASSW} floor={GRASS} lamp={false}>
    <Calendar x={90} y={300} w={900} crossed={Math.floor((sec - TP.cri) / 0.9)} title="DEZEMBRO" />
    <Toon o={KID} expr="smile" seed={5} h={760} x={540} y={1900} /></Room>
    {sec >= TP.etern && <Tag text="UMA ETERNIDADE" x={540} y={1010} sec={sec} since={TP.etern} />}</Cam>],
  [TP.hoje, (sec) => <Cam a={TP.hoje} z0={1.0} z1={1.1} noZap><Room wall={OFFICE} floor={OFFF}>
    <Pages sec={sec} start={TP.hoje} />
    <div style={{ position: "absolute", left: 120, right: 120, top: 1380, height: 60, background: "#8a5a32", border: `10px solid ${INK}` }} />
    <Toon o={HERO} expr={sec >= TP.voando ? "shock" : "neutral"} seed={3} h={1300} x={540} y={1700} />
    <div style={{ position: "absolute", left: 700, top: 1290, width: 90, height: 100, background: "#f4f1ea", border: `8px solid ${INK}`, borderRadius: "0 0 24px 24px" }} /></Room>
    <Cap top={200} size={96} color={R} alpha={clamp01((sec - TP.hoje - 0.3) / 0.2)}>O ANO PASSA VOANDO</Cap></Cam>],
  [TP.parece, (sec) => <Cam a={TP.parece} z0={1.0} z1={1.08} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    {Array.from({ length: 22 }, (_, i) => { const t = sec - TP.novo; if (t < 0) return null; const a = (i / 22) * 6.28, d = 700 * (1 - Math.exp(-t * 3)); return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * d - 14, top: 700 + Math.sin(a) * d + 300 * t * t, width: 28, height: 28, borderRadius: i % 2 ? 14 : 4, background: [Y, R, G, "#9be7ff"][i % 4], border: `4px solid ${INK}` }} />; })}
    <Cap top={500} size={110} alpha={clamp01((sec - TP.parece) / 0.2)}>ONTEM ERA</Cap>
    {sec >= TP.novo && <Cap top={700} size={150} color={Y}>ANO NOVO</Cap>}
  </AbsoluteFill></Cam>],
  [TP.panet, (sec) => <Cam a={TP.panet} z0={1.0} z1={1.1} noZap><Room wall="#d9d4c4" floor="#b8b2a0">
    {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <div key={r + "-" + c} style={{ position: "absolute", left: 40 + c * 250, top: 330 + r * 230, width: 220, height: 200, background: "#c0353a", border: `8px solid ${INK}`, borderRadius: 12 }}>
      <div style={{ margin: "60px 16px 0", background: Y, border: `5px solid ${INK}`, fontFamily: "Arial Black", fontSize: 30, textAlign: "center", color: INK }}>PANETONE</div></div>))}
    <Toon o={HERO} expr="shock" seed={3} h={1000} x={540} y={1850} look={0.6} /></Room>
    <Tag text="EM SETEMBRO?!" x={540} y={1330} sec={sec} since={TP.panet + 0.4} col="#ffffff" /></Cam>],
  [TP.nin, (sec) => <Cam a={TP.nin} z0={1.0} z1={1.08} noZap><Room wall={shadeHex(OFFICE, 0.7)} floor={OFFF} dark={0.3}>
    <Toon o={HERO} expr="nervous" seed={3} h={1200} x={540} y={1800} look={Math.sin(sec * 2) * 0.6} /></Room>
    <div style={{ position: "absolute", left: 0, right: 0, top: 180, textAlign: "center", fontFamily: "Arial Black", fontSize: 500, color: Y, WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke", transform: `rotate(${Math.sin(sec * 3) * 4}deg)` }}>?</div></Cam>],
  [TP.pesq, (sec) => <Cam a={TP.pesq} z0={1.0} z1={1.1} noZap><Room wall="#9fb6b0" floor="#8a7a66">
    {[0, 1, 2].map((i) => <Toon key={i} o={DOC(i)} expr={i === 1 ? "smile_closed" : "neutral"} seed={20 + i} h={i === 1 ? 1000 : 880} x={190 + i * 350} y={1760 + (i === 1 ? 40 : 0)} />)}</Room>
    <Tag text="PESQUISADORES" x={540} y={330} sec={sec} since={TP.pesq} />
    {sec >= TP.hip && <Tag text="HIPÓTESES" x={540} y={520} sec={sec} since={TP.hip} col="#ffffff" />}</Cam>],
  [TP.prim, (sec) => <Title sec={sec} at={TP.prim} num="1" text="PROPORÇÃO" col={Y} />],
  [TP.dez, (sec) => <Cam a={TP.dez} z0={1.0} z1={1.05} noZap><Room wall={SKY} floor={GRASS} lamp={false}>
    <Toon o={KID} expr="smile" seed={5} h={900} x={540} y={1850} />
    <Lifebar n={10} cols={5} x={110} y={450} cell={150} hi={10} sec={sec} since={TP.dez} /></Room>
    <Cap top={170} size={90} alpha={clamp01((sec - TP.dez) / 0.15)}>10 ANOS</Cap>
    {sec >= TP.decimo - 0.8 && <Tag text="UM ANO = 1/10 DA VIDA" x={540} y={1000} sec={sec} since={TP.decimo - 0.8} />}</Cam>],
  [TP.cinq, (sec) => <Cam a={TP.cinq} z0={1.0} z1={1.05} noZap><Room wall={OFFICE} floor={OFFF}>
    <Toon o={OLD} expr="neutral" seed={7} h={900} x={540} y={1850} />
    <Lifebar n={50} cols={10} x={80} y={450} cell={80} hi={50} sec={sec} since={TP.cinq} /></Room>
    <Cap top={170} size={90} alpha={clamp01((sec - TP.cinq) / 0.15)}>50 ANOS</Cap>
    {sec >= TP.cinqt && <Tag text="UM ANO = 1/50" x={540} y={1000} sec={sec} since={TP.cinqt} col={R} />}</Cam>],
  [TP.cada, (sec) => { const k = clamp01((sec - 23.2) / 0.6); const w = 760 - 640 * k;
    return <Cam a={TP.cada} z0={1.0} z1={1.05} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
      <div style={{ position: "absolute", left: 540 - w / 2, top: 760 - w / 2, width: w, height: w, background: Y, border: `${Math.max(4, w / 30)}px solid ${INK}`, borderRadius: w / 10 }} />
      <Cap top={1150} size={96} alpha={clamp01((sec - TP.cada) / 0.15)}>CADA ANO</Cap>
      <Cap top={1300} size={110} color={R} alpha={clamp01((sec - 23.5) / 0.15)}>PESA MENOS</Cap></AbsoluteFill></Cam>; }],
  [TP.seg, (sec) => <Title sec={sec} at={TP.seg} num="2" text="NOVIDADE" col={G} />],
  [TP.infan, (sec) => <Cam a={TP.infan} z0={1.0} z1={1.06} noZap><Room wall="#e8dcc2" floor="#b98250" lamp={false}>
    {Array.from({ length: 9 }, (_, k) => <Photo key={k} x={50 + (k % 3) * 330} y={300 + Math.floor(k / 3) * 360} t={sec - 26.94 - k * 0.3} c={["#8fd0f0", "#f2b866", "#9be7a0", "#ff8a7a"][k % 4]} k={k} />)}
    <Toon o={KID} expr="grin" seed={5} h={700} x={300} y={1900} /></Room>
    {sec >= TP.vez && <Tag text="PRIMEIRA VEZ!" x={760} y={1500} sec={sec} since={TP.vez} />}
    {sec >= TP.cereb && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,230,120,${0.25 * Math.abs(Math.sin((sec - TP.cereb) * 4))}), rgba(0,0,0,0) 70%)` }} />}</Cam>],
  [TP.rot, (sec) => { const sq = clamp01((sec - TP.comp) / 0.5);
    return <Cam a={TP.rot} z0={1.0} z1={1.05} noZap><Room wall={OFFICE} floor={OFFF}>
      {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 60 + i * 190, top: 400 + (sec >= TP.rot + i * 0.4 ? 0 : -900), width: 170, height: 560, background: "#f6efdf", border: `7px solid ${INK}`, transformOrigin: "50% 0", transform: `scaleY(${1 - 0.88 * sq})`, boxSizing: "border-box", padding: 12, fontFamily: "Arial Black", fontSize: 24, color: "#2a2420", textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>{["SEG", "TER", "QUA", "QUI", "SEX"][i]}</div><div style={{ fontSize: 80, marginTop: 40 }}>☕</div><div style={{ fontSize: 80 }}>🚌</div><div style={{ fontSize: 80 }}>💻</div></div>)}
      <Toon o={HERO} expr="neutral" seed={3} h={800} x={540} y={1850} /></Room>
      {sec >= TP.rot + 0.6 && <Tag text="TODO DIA IGUAL" x={540} y={1020} sec={sec} since={TP.rot + 0.6} col="#ffffff" />}
      {sec >= TP.comp && <Cap top={170} size={100} color={R}>A MEMÓRIA COMPRIME</Cap>}</Cam>; }],
  [TP.det, (sec) => <Title sec={sec} at={TP.det} num="!" text="UM DETALHE CURIOSO" col="#9be7ff" />],
  [TP.est, (sec) => <Cam a={TP.est} z0={1.0} z1={1.05} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Cap top={160} size={90} alpha={clamp01((sec - TP.est) / 0.2)}>ESTUDO COM</Cap>
    <Cap top={300} size={190} color={Y} alpha={clamp01((sec - TP.quin) / 0.2)}>≈ 500</Cap>
    <Cap top={560} size={80} alpha={clamp01((sec - TP.quin) / 0.2)}>PESSOAS, 14 A 94 ANOS</Cap>
    {sec >= TP.idade && <>
      {[0, 1].map((i) => <div key={i} style={{ position: "absolute", left: 220 + i * 420, top: 1400 - 420, width: 240, height: 420, background: i ? R : G, border: `10px solid ${INK}`, borderRadius: 14 }} />)}
      <Cap top={1460} size={60}>JOVENS &nbsp;&nbsp; MAIS VELHOS</Cap>
      <Cap top={1000} size={110} color={Y}>=</Cap></>}
    {sec >= TP.sem && <Tag text="SEMANAS OU MESES" x={540} y={1650} sec={sec} since={TP.sem} />}
  </AbsoluteFill></Cam>],
  [TP.dif, (sec) => <Cam a={TP.dif} z0={1.0} z1={1.05} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Cap top={160} size={90} alpha={clamp01((sec - TP.dif) / 0.2)}>OLHANDO PARA TRÁS</Cap>
    {sec >= TP.olhar && <>
      <div style={{ position: "absolute", left: 220, top: 1300 - 220, width: 240, height: 220, background: G, border: `10px solid ${INK}`, borderRadius: 14 }} />
      <div style={{ position: "absolute", left: 640, top: 1300 - 620 * clamp01((sec - TP.olhar) / 0.5), width: 240, height: 620 * clamp01((sec - TP.olhar) / 0.5), background: R, border: `10px solid ${INK}`, borderRadius: 14 }} />
      <Cap top={1360} size={56}>JOVENS &nbsp;&nbsp;&nbsp;&nbsp; MAIS VELHOS</Cap></>}
    {sec >= TP.ult && <Tag text="ÚLTIMOS ANOS: MAIS RÁPIDO" x={540} y={400} sec={sec} since={TP.ult} col={R} />}
  </AbsoluteFill></Cam>],
  [TP.talvez, (sec) => <Cam a={TP.talvez} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Clock sec={sec - TP.talvez} x={540} y={760} r={300} />
    <Cap top={1180} size={84} alpha={clamp01((sec - TP.talvez) / 0.2)}>O TEMPO NÃO CORRE</Cap>
    <Cap top={1300} size={100} color={Y} alpha={clamp01((sec - 48.05) / 0.2)}>MAIS RÁPIDO</Cap></AbsoluteFill></Cam>],
  [TP.talvez + 2.24, (sec) => { const k = clamp01((sec - 50.38) / 0.8), len = 860 - 640 * k;
    return <Cam a={49.1} z0={1.0} z1={1.06} noZap><Room wall={"#e8dcc2"} floor="#b98250" lamp={false}>
      <Toon o={OLD} expr="smile_closed" seed={7} h={900} x={540} y={1900} />
      <div style={{ position: "absolute", left: 540 - len / 2, top: 560, width: len, height: 90, background: "repeating-linear-gradient(90deg,#fff 0 60px,#c9d1d8 60px 70px)", border: `10px solid ${INK}`, borderRadius: 10 }} /></Room>
      <Cap top={250} size={84} alpha={clamp01((sec - 49.1) / 0.2)}>SÓ A LEMBRANÇA</Cap>
      {sec >= TP.curta && <Cap top={720} size={110} color={Y}>FICA MAIS CURTA</Cap>}</Cam>; }],
];
const CLASSW = "#e8dcc2";

export const TempoP1: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  const whip = since < 0.1 && [TP.hoje, TP.panet, TP.pesq, TP.prim, TP.cinq, TP.seg, TP.infan, TP.det, TP.talvez].includes(start);
  const fade = interpolate(sec, [52.6, 53.6], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("tempo/voice.mp3")} />
      <Audio src={staticFile("tempo/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      <AbsoluteFill style={{ background: "#0f1220", opacity: fade }} />
    </AbsoluteFill>
  );
};
