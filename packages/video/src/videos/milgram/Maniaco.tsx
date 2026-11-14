// Mentes diferentes — Ep.2: Maníaco do Parque (sem CTA, tom sério, sem violência)
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../bridge/toon";
import { Toon, Room, Tag, Cam, clamp01, s } from "./Milgram";
import { Cap, Stamp } from "./Milgram2";

const FPS = 30;
export const MANIACO_FRAMES = Math.round(57.4 * FPS);
export const MN = {
  nao: 0.0, era: 1.52, em: 3.25, sp: 5.16, man: 6.06, fra: 7.68, abor: 8.85, caca: 10.59, conv: 12.05, cat: 13.44, carr: 14.84,
  func: 15.44, ouv: 17.22, conf: 18.42, ferr: 19.39, preso: 20.65, cond: 22.68, dois: 23.65, esp: 25.31, tra: 27.28, charme: 28.53, ment: 29.81, emp: 30.92,
  epoca: 32.21, trinta: 34.12, prev: 35.29, tj: 36.36, ago: 39.2, vinte: 40.36, seg: 41.32, aval: 44.37, desde: 45.75, prom: 48.12, volt: 50.3,
  mais: 51.52, apar: 53.09, nenh: 54.16, den: 55.66,
};
const SUIT: Outfit = { jacket: "#2d3f5a", pants: "#2a2d36", boots: "#1c1a19", hat: "cap", cap: "#d1452e", skin: "#e8b88c" };
const SUITNC: Outfit = { ...SUIT, hat: "hair", hair: "#2a1d14" };
const WOMAN: Outfit = { jacket: "#c6718f", pants: "#3b4a6b", boots: "#2a1d14", hat: "hair", hair: "#4a2c1a", skin: "#f1c19a" };
const PARK = "#6f9aa6", GRASS = "#5b7f55", DARK = "linear-gradient(#10172b,#070912)";
const Y = "#ffd54a", R = "#ff8a7a", GOOD = "#9be7a0";

const Big: React.FC<{ text: string; at: number; sec: number; top: number; size: number; col?: string }> = ({ text, at, sec, top, size, col = Y }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: "Arial Black", fontSize: size, color: col, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke", transform: `scale(${sec - at < 0.15 ? 2 - 6.6 * (sec - at) : 1})` }}>{text}</div>
);
const Bubble: React.FC<{ text: string; x: number; y: number; alpha: number }> = ({ text, x, y, alpha }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", opacity: alpha, background: "#fff", border: `8px solid ${INK}`, borderRadius: 34, padding: "16px 34px", fontFamily: "Arial Black", fontSize: 54, color: INK, whiteSpace: "nowrap" }}>{text}</div>
);
const Bars: React.FC<{ n: number }> = ({ n }) => (
  <>{Array.from({ length: n }, (_, i) => <div key={i} style={{ position: "absolute", left: 60 + i * (960 / (n - 1)) - 14, top: 0, width: 28, height: 1920, background: "#3a3f4a", border: `6px solid ${INK}`, boxSizing: "border-box" }} />)}</>
);
const Mask: React.FC<{ crack: number }> = ({ crack }) => (
  <div style={{ position: "absolute", left: 290, top: 460, width: 500, height: 620, borderRadius: "46% 46% 50% 50%", background: "#f4eee0", border: `12px solid ${INK}`, boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 90, top: 190, width: 90, height: 40, borderRadius: "0 0 90px 90px", borderBottom: `14px solid ${INK}` }} />
    <div style={{ position: "absolute", left: 310, top: 190, width: 90, height: 40, borderRadius: "0 0 90px 90px", borderBottom: `14px solid ${INK}` }} />
    <div style={{ position: "absolute", left: 120, top: 380, width: 260, height: 110, borderRadius: "0 0 260px 260px", borderBottom: `16px solid ${INK}` }} />
    <div style={{ position: "absolute", left: 245 - crack * 4, top: 0, width: 8, height: 620 * crack, background: INK, transform: "rotate(6deg)" }} />
    {crack > 0.5 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", opacity: (crack - 0.5) * 1.2 }} />}
  </div>
);

type ShotFn = (sec: number, f: number) => React.ReactNode;
const SHOTS: [number, ShotFn][] = [
  [0, (sec) => <Cam a={0} z0={1.05} z1={1.18} origin="50% 55%" noZap><Room wall={PARK} floor={GRASS}>
    <Toon o={SUIT} expr="smile" seed={31} h={1300} x={540} y={1850} /></Room>
    <Cap top={170} size={96} alpha={clamp01((sec - MN.nao) / 0.15)}>ELE NÃO PARECIA PERIGOSO</Cap>
    {sec >= MN.era && <Tag text="SÓ UM MOTOBOY SIMPÁTICO" x={540} y={470} sec={sec} since={MN.era} col={Y} />}</Cam>],
  [MN.em, (sec) => <Cam a={MN.em} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: DARK }}>
    <Big text="1998" at={MN.em + 0.4} sec={sec} top={420} size={320} />
    {sec >= MN.sp && <Cap top={880} size={90} alpha={clamp01((sec - MN.sp) / 0.2)}>SÃO PAULO CONHECEU</Cap>}
    {sec >= MN.man && <Cap top={1020} size={104} color={R}>O MANÍACO DO PARQUE</Cap>}</AbsoluteFill></Cam>],
  [MN.fra, (sec) => <Cam a={MN.fra} z0={1.0} z1={1.07} noZap><Room wall={PARK} floor={GRASS}>
    <Toon o={SUITNC} expr="smile" seed={32} h={1200} x={300} y={1850} look={0.4} />
    <Toon o={WOMAN} expr="smile" seed={33} h={1100} x={800} y={1850} look={-0.4} /></Room>
    <Tag text="FRANCISCO DE ASSIS PEREIRA" x={540} y={170} sec={sec} since={MN.fra} />
    {sec >= MN.caca && <Tag text="CAÇA-TALENTOS?" x={540} y={480} sec={sec} since={MN.caca} col={R} />}
    {sec >= MN.conv && <Bubble text="VOCÊ TEM TALENTO!" x={540} y={670} alpha={clamp01((sec - MN.conv) / 0.2)} />}
    {sec >= MN.conv && <Tag text={sec >= MN.carr ? "CARREIRA" : sec >= MN.cat ? "CATÁLOGO" : "FOTOS"} x={540} y={800} sec={sec} since={sec >= MN.carr ? MN.carr : sec >= MN.cat ? MN.cat : MN.conv} col="#9be7ff" />}</Cam>],
  [MN.func, (sec) => <Cam a={MN.func} z0={1.0} z1={1.08} noZap><Room wall={PARK} floor={GRASS}>
    <Toon o={SUITNC} expr="smile_closed" seed={32} h={1300} x={540} y={1850} /></Room>
    <Cap top={170} size={84} alpha={clamp01((sec - MN.func) / 0.2)}>ELE SABIA O QUE</Cap>
    {sec >= MN.ouv - 0.3 && <Cap top={290} size={84} color={Y}>ELAS QUERIAM OUVIR</Cap>}
    {sec >= MN.conf && <Tag text="CONFIANÇA" x={540} y={520} sec={sec} since={MN.conf} col={GOOD} />}
    {sec >= MN.ferr && <Tag text="A FERRAMENTA DELE" x={540} y={680} sec={sec} since={MN.ferr} col={R} />}</Cam>],
  [MN.preso, (sec) => <Cam a={MN.preso} z0={1.0} z1={1.06} kicks={[MN.cond]} noZap><AbsoluteFill style={{ background: "linear-gradient(#26303f,#10141d)" }}>
    <Toon o={SUITNC} expr="stern" seed={32} h={1100} x={540} y={1800} /><Bars n={6} />
    <Cap top={170} size={90} alpha={clamp01((sec - MN.preso) / 0.2)}>PRESO NAQUELE ANO</Cap>
    <Stamp text="CONDENADO" at={MN.cond} sec={sec} top={470} size={120} />
    {sec >= MN.dois && <Big text="+200 ANOS" at={MN.dois} sec={sec} top={760} size={150} col={R} />}</AbsoluteFill></Cam>],
  [MN.esp, (sec) => <Cam a={MN.esp} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: DARK }}>
    <Mask crack={clamp01((sec - MN.tra) / 3.2)} />
    <Cap top={150} size={50} alpha={clamp01((sec - MN.esp) / 0.2)}>ESPECIALISTAS APONTARAM</Cap>
    {sec >= MN.tra && <Cap top={290} size={68} color={Y}>TRAÇOS DE PSICOPATIA</Cap>}
    {sec >= MN.charme && <Tag text="CHARME" x={540} y={1150} sec={sec} since={MN.charme} col={GOOD} />}
    {sec >= MN.ment && <Tag text="MENTIRA FÁCIL" x={540} y={1370} sec={sec} since={MN.ment} col={Y} />}
    {sec >= MN.emp && <Tag text="SEM EMPATIA" x={540} y={1590} sec={sec} since={MN.emp} col={R} />}</AbsoluteFill></Cam>],
  [MN.epoca, (sec) => <Cam a={MN.epoca} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: DARK }}>
    <Cap top={200} size={86} alpha={clamp01((sec - MN.epoca) / 0.2)}>NA ÉPOCA, A LEI</Cap>
    {sec >= MN.trinta - 0.5 && <Cap top={330} size={86}>LIMITAVA A PENA A</Cap>}
    {sec >= MN.trinta && <Big text="30 ANOS" at={MN.trinta} sec={sec} top={500} size={180} />}
    {sec >= MN.prev && <div style={{ position: "absolute", left: 140, top: 1000, width: 800, height: 640, background: "#f4f1ea", border: `14px solid ${INK}`, borderRadius: 30, boxSizing: "border-box", textAlign: "center", fontFamily: "Arial Black" }}>
      <div style={{ background: "#c8392e", color: "#fff", fontSize: 54, padding: "16px 0", borderBottom: `12px solid ${INK}` }}>PREVISÃO DO TJ-SP</div>
      {sec >= MN.ago && <div style={{ fontSize: 120, color: INK, marginTop: 70 }}>AGO</div>}
      {sec >= MN.vinte && <div style={{ fontSize: 210, color: "#c8392e", lineHeight: 1 }}>2028</div>}</div>}</AbsoluteFill></Cam>],
  [MN.seg, (sec) => <Cam a={MN.seg} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: "linear-gradient(#26303f,#10141d)" }}>
    <Cap top={170} size={80} alpha={clamp01((sec - MN.seg) / 0.2)}>SEGUNDO AS REPORTAGENS</Cap>
    {sec >= MN.aval - 0.5 && <Tag text="SEM NOVA AVALIAÇÃO PSIQUIÁTRICA" x={540} y={470} sec={sec} since={MN.aval - 0.5} col={R} />}
    {sec >= MN.desde && <Big text="DESDE 1998" at={MN.desde} sec={sec} top={800} size={130} />}
    {sec >= MN.prom && <Cap top={1100} size={76} alpha={clamp01((sec - MN.prom) / 0.2)}>O PROMOTOR DO CASO ALERTA:</Cap>}
    {sec >= MN.volt - 0.3 && <Cap top={1240} size={84} color={R}>PODE VOLTAR A MATAR</Cap>}</AbsoluteFill></Cam>],
  [MN.mais, (sec) => <Cam a={MN.mais} z0={1.0} z1={1.1} noZap><Room wall={PARK} floor={GRASS}>
    <Toon o={SUITNC} expr="smile" seed={32} h={1400} x={540} y={1850} /></Room>
    <Cap top={150} size={72} alpha={clamp01((sec - MN.mais) / 0.2)}>O MAIS ASSUSTADOR</Cap>
    {sec >= MN.apar && <Cap top={260} size={62} color={Y}>NÃO É A APARÊNCIA DELE</Cap>}
    {sec >= MN.nenh && <Cap top={360} size={62} color={R}>NÃO HAVIA NENHUMA</Cap>}
    {sec >= MN.den && <Cap top={450} size={62} color={R}>QUE DENUNCIASSE</Cap>}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontFamily: "Arial", fontSize: 34, color: "#fff", opacity: 0.8 }}>Em respeito às vítimas</div></Cam>],
];

export const ManiacoP1: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  const flash = [MN.cond].some((a) => f >= s(a) && f < s(a) + 2);
  const whip = since < 0.1 && start !== 0;
  const fade = interpolate(sec, [56.6, 57.4], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("maniaco/voice.mp3")} />
      <Audio src={staticFile("maniaco/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      {flash && <AbsoluteFill style={{ background: "#ffffff", opacity: 0.7 }} />}
      <AbsoluteFill style={{ background: "#0f1220", opacity: fade }} />
    </AbsoluteFill>
  );
};
