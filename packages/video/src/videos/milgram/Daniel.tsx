// Daniel Markel — hamburgueria com R$ 15 mil (CTA: link na bio). Voz: MMjxsbQWrka7S8z80CmS
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../bridge/toon";
import { Toon, Room, Tag, Cam, clamp01, s } from "./Milgram";
import { Cap } from "./Milgram2";

const FPS = 30;
export const DANIEL_FRAMES = Math.round(85.38 * FPS);
// cue table (seconds, from words.json)
export const DN = {
  anos: 0.88, s2: 1.37, ajud: 2.29, donos: 2.78, vend: 4.04, s3: 5.45, perg: 5.89, s4: 8.17, cli: 8.8, porq: 10.63,
  s5: 12.26, abrir: 13.09, hamb: 13.96, quinze: 14.94, s6: 16.14, coifa: 18.47, chapa: 19.29, mesa: 20.1, gel: 21.34, frz: 22.19, mil8: 22.86,
  s7: 24.31, q15: 25.0, frit: 26.74, impr: 28.51, utens: 29.89, s8: 30.85, carn: 32.02, paes: 33.45, bacon: 34.38, ched: 35.87, maio: 38.21, bat: 40.23,
  s8b: 42.09, refri: 42.33, chur: 43.59, emb: 45.41, q19: 47.49, mini: 49.07,
  s9: 50.9, cnpj: 51.47, gas: 54.18, s10: 55.61, sete: 56.76, s11: 57.9, oito: 58.45, s12: 59.13, caixa: 60.25, app: 61.31, quebra: 64.25,
  s13: 65.88, s14: 67.56, v38: 68.54, s15: 70.52, v250: 73.63, s16: 75.2, s17: 77.96, nome: 79.06, s18: 80.13, link: 82.98,
};
const PUR = "#b98bff", PURD = "#6a3df0", Y = "#ffd54a", R = "#ff6b5e", GOOD = "#7be39a";
const DAN: Outfit = { jacket: PURD, pants: "#2f3a5c", boots: "#f4f1ea", hat: "hair", hair: "#2a1d14", skin: "#e8b88c" };
const OWN = (i: number): Outfit => ({ jacket: ["#f4f1ea", "#e9e1d0", "#ffffff"][i % 3], pants: "#3a3d44", boots: "#22201f", hat: "cap", cap: ["#d1452e", "#2b5ea8", "#e0a61a"][i % 3], skin: ["#f5c9a0", "#d9a577", "#e8b88c"][i % 3], build: i === 1 ? "stout" : undefined });
const WALL = "#8a7ad8", FLOOR = "#4a3d8a", KIT = "#c9c3d6", KFLOOR = "#7c748f";

const Big: React.FC<{ text: string; at: number; sec: number; top: number; size: number; col?: string }> = ({ text, at, sec, top, size, col = Y }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: "Arial Black", fontSize: size, color: col, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke", transform: `scale(${sec - at < 0.15 ? 2 - 6.6 * (sec - at) : 1})` }}>{text}</div>
);
const Dark: React.FC<{ children?: React.ReactNode; bg?: string }> = ({ children, bg = "linear-gradient(#1a1540,#0b0a1f)" }) => <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>;
const Phone: React.FC<{ x: number; y: number; sec: number; since: number }> = ({ x, y, sec, since }) => (
  <div style={{ position: "absolute", left: x - 70, top: y, width: 140, height: 230, background: "#14122a", border: `8px solid ${INK}`, borderRadius: 24, boxSizing: "border-box", overflow: "hidden" }}>
    {[0, 1, 2].map((i) => sec >= since + i * 0.5 && <div key={i} style={{ margin: "10px 8px 0", background: GOOD, border: `4px solid ${INK}`, borderRadius: 8, fontFamily: "Arial Black", fontSize: 18, color: INK, textAlign: "center", padding: "4px 0" }}>PEDIDO</div>)}
  </div>
);
const Emo: React.FC<{ e: string; x: number; y: number; at: number; sec: number; size?: number }> = ({ e, x, y, at, sec, size = 150 }) => sec < at ? null : (
  <div style={{ position: "absolute", left: x - size / 2, top: y, fontSize: size, lineHeight: 1, transform: `scale(${clamp01((sec - at) / 0.18) * 1})` }}>{e}</div>
);
const money = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
const Counter: React.FC<{ v: number; top: number; size?: number; plus?: boolean; col?: string }> = ({ v, top, size = 170, plus, col = GOOD }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: "Arial Black", fontSize: size, color: col, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke" }}>{money(v)}{plus ? "+" : ""}</div>
);

const Row: React.FC<{ e: string; label: string; i: number; at: number; sec: number; top?: number }> = ({ e, label, i, at, sec, top = 330 }) => sec < at ? null : (
  <div style={{ position: "absolute", left: 90, top: top + i * 230, width: 900, height: 200, background: "rgba(255,255,255,.08)", border: `8px solid ${INK}`, borderRadius: 28, boxSizing: "border-box", display: "flex", alignItems: "center", transform: `scale(${clamp01((sec - at) / 0.15) * 1})` }}>
    <span style={{ fontSize: 120, marginLeft: 30 }}>{e}</span><span style={{ fontFamily: "Arial Black", fontSize: 66, color: "#fff", marginLeft: 30 }}>{label}</span></div>
);
type ShotFn = (sec: number, f: number) => React.ReactNode;
const SHOTS: [number, ShotFn][] = [
  [0, (sec) => <Cam a={0} z0={1.05} z1={1.18} origin="50% 55%" noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={DAN} expr="smile" seed={41} h={1300} x={540} y={1850} /></Room>
    <Cap top={170} size={100} alpha={clamp01(sec / 0.15)}>ELE TINHA 21 ANOS</Cap></Cam>],
  [DN.s2, (sec) => <Cam a={DN.s2} z0={1.0} z1={1.06} noZap><Room wall={KIT} floor={KFLOOR}>
    <Toon o={DAN} expr="smile" seed={41} h={880} x={140} y={1850} look={0.3} />
    {[0, 1, 2].map((i) => <Toon key={i} o={OWN(i)} expr="smile" seed={50 + i} h={i === 1 ? 960 : 820} x={400 + i * 250} y={1850} look={i === 0 ? 0.2 : -0.3} />)}
    {[0, 1, 2].map((i) => <Phone key={i} x={400 + i * 250} y={560} sec={sec} since={DN.ajud + i * 0.4} />)}</Room>
    {sec >= DN.ajud && <Tag text="iFOOD" x={270} y={230} sec={sec} since={DN.ajud} col={R} />}
    {sec >= DN.donos && <Tag text="CARDÁPIO" x={620} y={230} sec={sec} since={DN.donos} col={Y} />}
    {sec >= DN.vend && <Tag text="+ VENDAS" x={680} y={400} sec={sec} since={DN.vend} col={GOOD} />}</Cam>],
  [DN.s3, (sec) => <Cam a={DN.s3} z0={1.1} z1={1.45} origin="50% 38%" noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={DAN} expr="stern" seed={41} h={1500} x={540} y={1900} /></Room>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%,rgba(0,0,0,0) 20%,rgba(5,4,20,.92) 75%)" }} />
    {sec >= DN.perg && <Cap top={1500} size={96} color={Y}>UMA PERGUNTA</Cap>}</Cam>],
  [DN.s4, (sec) => <Cam a={DN.s4} z0={1.0} z1={1.06} noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={DAN} expr="stern" seed={41} h={1100} x={540} y={1900} /></Room>
    <div style={{ position: "absolute", left: 90, top: 110, width: 900, height: 620, background: "#fff", border: `10px solid ${INK}`, borderRadius: 300, boxSizing: "border-box", textAlign: "center", fontFamily: "Arial Black", color: INK, paddingTop: 120 }}>
      {sec >= DN.cli && <div style={{ fontSize: 66 }}>DEU CERTO COM OS CLIENTES...</div>}
      {sec >= DN.porq && <div style={{ fontSize: 76, color: PURD, marginTop: 20 }}>E COMIGO?</div>}</div>
    <div style={{ position: "absolute", left: 470, top: 760, width: 50, height: 50, borderRadius: 25, background: "#fff", border: `8px solid ${INK}` }} />
    <div style={{ position: "absolute", left: 520, top: 850, width: 30, height: 30, borderRadius: 15, background: "#fff", border: `6px solid ${INK}` }} />
    {sec >= DN.porq && <Tag text="E SE FOSSE PRA MIM?" x={540} y={1050} sec={sec} since={DN.porq} col={PUR} />}</Cam>],
  [DN.s5, (sec) => <Cam a={DN.s5} z0={1.0} z1={1.08} noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={DAN} expr="smile" seed={41} h={1300} x={540} y={1850} />
    <div style={{ position: "absolute", left: 640, top: 1280, width: 280, height: 190, background: "#6b4a2a", border: `10px solid ${INK}`, borderRadius: 18, boxSizing: "border-box", textAlign: "center", fontSize: 90, paddingTop: 30 }}>💵</div></Room>
    {sec >= DN.abrir && <Cap top={170} size={80} alpha={clamp01((sec - DN.abrir) / 0.2)}>ABRIR A PRÓPRIA</Cap>}
    {sec >= DN.hamb && <Cap top={280} size={92} color={Y}>HAMBURGUERIA</Cap>}
    {sec >= DN.quinze && <Big text="R$ 15.000" at={DN.quinze} sec={sec} top={520} size={170} col={GOOD} />}</Cam>],
  [DN.s6, (sec) => <Cam a={DN.s6} z0={1.0} z1={1.06} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Cap top={150} size={84} alpha={clamp01((sec - DN.s6) / 0.2)}>A COZINHA JÁ PRONTA</Cap>
    <Emo e="🔥" x={200} y={420} at={DN.coifa} sec={sec} /><Emo e="🍳" x={540} y={420} at={DN.chapa} sec={sec} /><Emo e="🧰" x={880} y={420} at={DN.mesa} sec={sec} />
    <Emo e="🧊" x={370} y={700} at={DN.gel} sec={sec} /><Emo e="❄️" x={710} y={700} at={DN.frz} sec={sec} />
    <div style={{ position: "absolute", left: 160, top: 960, width: 760, fontFamily: "Arial Black", fontSize: 76, color: "#fff", lineHeight: 1.25 }}>
      {([["COIFA", DN.coifa], ["CHAPA", DN.chapa], ["MESA DE MONTAGEM", DN.mesa], ["GELADEIRA", DN.gel], ["FREEZER", DN.frz]] as [string, number][]).map(([l, at]) => sec >= at && <div key={l}><span style={{ color: GOOD }}>✓</span> {l}</div>)}</div>
    {sec >= DN.mil8 && <Big text="R$ 1.800" at={DN.mil8} sec={sec} top={1560} size={150} col={Y} />}</Dark></Cam>],
  [DN.s7, (sec) => <Cam a={DN.s7} z0={1.0} z1={1.06} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Cap top={150} size={84} alpha={clamp01((sec - DN.s7) / 0.2)}>EQUIPAMENTO</Cap>
    {sec >= DN.q15 && <Big text="R$ 1.500" at={DN.q15} sec={sec} top={300} size={150} col={Y} />}
    <Emo e="🍟" x={270} y={640} at={DN.frit} sec={sec} size={200} /><Emo e="🍟" x={540} y={640} at={DN.frit + 0.3} sec={sec} size={200} />
    <Emo e="🖨️" x={810} y={640} at={DN.impr} sec={sec} size={200} /><Emo e="🍴" x={540} y={980} at={DN.utens} sec={sec} size={200} />
    {sec >= DN.frit && <Tag text="2 FRITADEIRAS" x={380} y={1250} sec={sec} since={DN.frit} col={R} />}
    {sec >= DN.impr && <Tag text="IMPRESSORA" x={720} y={1400} sec={sec} since={DN.impr} col={PUR} />}
    {sec >= DN.utens && <Tag text="UTENSÍLIOS" x={380} y={1550} sec={sec} since={DN.utens} col={GOOD} />}</Dark></Cam>],
  [DN.s8, (sec) => <Cam a={DN.s8} z0={1.0} z1={1.05} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Cap top={150} size={84} alpha={clamp01((sec - DN.s8) / 0.2)}>PRIMEIRO ESTOQUE</Cap>
    <Row e="🥩" label="80 CARNES" i={0} at={DN.carn} sec={sec} /><Row e="🍞" label="100 PÃES" i={1} at={DN.paes} sec={sec} />
    <Row e="🥓" label="10 KG BACON" i={2} at={DN.bacon} sec={sec} /><Row e="🧀" label="184 FATIAS CHEDDAR" i={3} at={DN.ched} sec={sec} />
    <Row e="🥫" label="5 KG MAIONESE" i={4} at={DN.maio} sec={sec} /><Row e="🍟" label="20 KG BATATA" i={5} at={DN.bat} sec={sec} /></Dark></Cam>],
  [DN.s8b, (sec) => <Cam a={DN.s8b} z0={1.0} z1={1.05} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Cap top={150} size={84} alpha={clamp01((sec - DN.s8b) / 0.2)}>E MAIS</Cap>
    <Row e="🥤" label="100 REFRIS" i={0} at={DN.refri} sec={sec} /><Row e="🍩" label="MINI CHURROS" i={1} at={DN.chur} sec={sec} /><Row e="📦" label="EMBALAGENS" i={2} at={DN.emb} sec={sec} />
    {sec >= DN.q19 && <Cap top={1120} size={70} color="#ffffff" alpha={1}>PRIMEIRO ESTOQUE</Cap>}
    {sec >= DN.q19 && <Big text="R$ 1.900" at={DN.q19} sec={sec} top={1250} size={170} col={Y} />}
    {sec >= DN.mini && <Cap top={1560} size={62} color={PUR}>O MÍNIMO PRA ABRIR A PORTA</Cap>}</Dark></Cam>],
  [DN.s9, (sec) => <Cam a={DN.s9} z0={1.0} z1={1.06} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Emo e="📄" x={300} y={420} at={DN.s9 + 0.9} sec={sec} size={230} /><Emo e="⛽" x={780} y={420} at={DN.gas} sec={sec} size={230} />
    {sec >= DN.cnpj && <Tag text="CNPJs" x={300} y={820} sec={sec} since={DN.cnpj} col={PUR} />}
    {sec >= DN.cnpj && <Big text="R$ 1.600" at={DN.cnpj} sec={sec} top={1000} size={130} col={Y} />}
    {sec >= DN.gas && <Tag text="GASOLINA" x={780} y={1300} sec={sec} since={DN.gas} col={R} />}
    {sec >= DN.gas && <Big text="R$ 200" at={DN.gas} sec={sec} top={1480} size={130} col={Y} />}</Dark></Cam>],
  [DN.s10, (sec) => <Cam a={DN.s10} z0={1.0} z1={1.06} kicks={[DN.sete]} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Cap top={150} size={84} alpha={clamp01((sec - DN.s10) / 0.2)}>TOTAL GASTO</Cap>
    <div style={{ position: "absolute", left: 140, top: 420, width: 800, fontFamily: "Arial Black", fontSize: 60, color: "#fff", lineHeight: 1.45 }}>
      {[["COZINHA", "1.800"], ["EQUIPAMENTO", "1.500"], ["ESTOQUE", "1.900"], ["CNPJs", "1.600"], ["GASOLINA", "200"]].map(([l, v], i) => sec >= DN.s10 + 0.3 + i * 0.35 && <div key={l} style={{ display: "flex", justifyContent: "space-between" }}><span>{l}</span><span style={{ color: Y }}>R$ {v}</span></div>)}</div>
    {sec >= DN.sete && <Big text="R$ 7.000" at={DN.sete} sec={sec} top={1100} size={190} col={R} />}</Dark></Cam>],
  [DN.s11, (sec) => <Cam a={DN.s11} z0={1.0} z1={1.1} noZap><Dark bg="#05040f">
    <Big text="?" at={DN.s11} sec={sec} top={420} size={620} col={PUR} />
    <Cap top={1250} size={84} alpha={clamp01((sec - DN.s11) / 0.2)}>E OS OUTROS</Cap>
    {sec >= DN.oito && <Cap top={1380} size={110} color={Y}>8 MIL?</Cap>}</Dark></Cam>],
  [DN.s12, (sec) => <Cam a={DN.s12} z0={1.0} z1={1.05} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
    <Cap top={130} size={84} alpha={clamp01((sec - DN.s12) / 0.2)}>ELE NÃO GASTOU</Cap>
    <div style={{ position: "absolute", left: 90, top: 330, width: 900, height: 150, border: `10px solid ${INK}`, borderRadius: 24, overflow: "hidden", display: "flex", boxSizing: "border-box" }}>
      <div style={{ width: "47%", background: "#7d7a88", fontFamily: "Arial Black", fontSize: 32, color: "#fff", textAlign: "center", paddingTop: 52 }}>ESTRUTURA R$ 7 MIL</div>
      {sec >= DN.caixa && <div style={{ width: "53%", background: PURD, fontFamily: "Arial Black", fontSize: 32, color: "#fff", textAlign: "center", paddingTop: 52 }}>CAIXA R$ 8 MIL</div>}</div>
    {sec >= DN.caixa && <Tag text="R$ 8 MIL NO CAIXA" x={540} y={620} sec={sec} since={DN.caixa} col={PUR} />}
    {sec >= DN.app && <Cap top={880} size={64} alpha={clamp01((sec - DN.app) / 0.2)}>O APP NÃO PAGA NA HORA</Cap>}
    {sec >= DN.quebra - 0.6 && <div style={{ position: "absolute", left: 140, top: 1020, width: 800, height: 400, background: "#3a3040", border: `10px solid ${INK}`, borderRadius: 20, boxSizing: "border-box", textAlign: "center" }}>
      <div style={{ fontSize: 120, marginTop: 40 }}>🍔</div>
      <div style={{ display: "inline-block", marginTop: 20, background: "#d63a2e", color: "#fff", fontFamily: "Arial Black", fontSize: 90, padding: "6px 40px", border: `8px solid ${INK}`, transform: "rotate(-4deg)" }}>FECHADO</div></div>}
    {sec >= DN.quebra && <Tag text="SEM CAIXA = FECHADO" x={540} y={1620} sec={sec} since={DN.quebra} col={R} />}</Dark></Cam>],
  [DN.s13, (sec) => <Cam a={DN.s13} z0={1.0} z1={1.08} noZap><Room wall={KIT} floor={KFLOOR}>
    <Toon o={DAN} expr="grin" seed={41} h={1000} x={540} y={1850} /></Room>
    <Cap top={150} size={84} alpha={clamp01((sec - DN.s13) / 0.2)}>A OPERAÇÃO RODANDO</Cap>
    {[0, 1, 2, 3, 4].map((i) => sec >= DN.s13 + 0.3 + i * 0.35 && <Tag key={i} text="PEDIDO" x={200 + (i % 3) * 340} y={430 + i * 150} sec={sec} since={DN.s13 + 0.3 + i * 0.35} col={i % 2 ? Y : GOOD} />)}</Cam>],
  [DN.s14, (sec) => { const v = interpolate(sec, [DN.s14 + 0.4, 69.29], [0, 38000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return <Cam a={DN.s14} z0={1.0} z1={1.06} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
      <Cap top={420} size={110} alpha={clamp01((sec - DN.s14) / 0.2)}>MÊS 1</Cap>
      <Counter v={v} top={720} size={150} />
      {sec >= 69.6 && <Cap top={1050} size={84} color={Y}>FATURADOS</Cap>}</Dark></Cam>; }],
  [DN.s15, (sec) => { const v = interpolate(sec, [DN.s15 + 0.5, 74.72], [38000, 250000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const pts = Array.from({ length: 12 }, (_, i) => [90 + i * 80, 1650 - Math.pow((i + 1) / 12, 2.2) * 700 * clamp01((sec - DN.s15) / 4)]);
    return <Cam a={DN.s15} z0={1.0} z1={1.06} noZap><Dark bg="linear-gradient(#2a2160,#120e33)">
      <Cap top={250} size={96} alpha={clamp01((sec - DN.s15) / 0.2)}>3 MESES DEPOIS</Cap>
      <Counter v={v} top={560} size={120} plus />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={GOOD} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" /></svg></Dark></Cam>; }],
  [DN.s16, (sec) => <Cam a={DN.s16} z0={1.0} z1={1.06} noZap><Room wall={KIT} floor={KFLOOR}>
    <Toon o={DAN} expr="smile" seed={41} h={880} x={140} y={1850} look={0.3} />
    {[0, 1, 2].map((i) => <Toon key={i} o={OWN(i)} expr="smile" seed={50 + i} h={i === 1 ? 960 : 820} x={400 + i * 250} y={1850} look={i === 0 ? 0.2 : -0.3} />)}</Room>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><polyline points="140,820 330,720 520,740 710,560 940,420" fill="none" stroke={GOOD} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" /></svg>
    {sec >= DN.s16 + 0.4 && <Tag text="O MESMO MÉTODO" x={540} y={230} sec={sec} since={DN.s16 + 0.4} col={PUR} />}</Cam>],
  [DN.s17, (sec) => <Cam a={DN.s17} z0={1.0} z1={1.12} noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={DAN} expr="smile" seed={41} h={1400} x={540} y={1850} /></Room>
    <Cap top={170} size={88} alpha={clamp01((sec - DN.s17) / 0.2)}>ESSE GAROTO SE CHAMA</Cap>
    {sec >= DN.nome && <Cap top={300} size={96} color={Y}>DANIEL MARKEL</Cap>}
    {sec >= DN.nome && <Tag text="@daniellmarkel" x={540} y={560} sec={sec} since={DN.nome} col={PUR} />}</Cam>],
  [DN.s18, (sec) => { const pul = 1 + 0.05 * Math.sin(sec * 8), bounce = Math.sin(sec * 7) * 14;
    return <Cam a={DN.s18} z0={1.0} z1={1.06} noZap><Room wall={WALL} floor={FLOOR}>
      <Toon o={DAN} expr="grin" seed={41} h={1200} x={540} y={1850} /></Room>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120 + bounce, textAlign: "center", fontSize: 220 }}>👆</div>
      <Cap top={430} size={72} alpha={clamp01((sec - DN.s18) / 0.2)}>APRENDA A FAZER ISSO</Cap>
      {sec >= 82.13 && <Cap top={540} size={72} color={Y}>NO SEU RESTAURANTE</Cap>}
      {sec >= DN.link && <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", transform: `scale(${pul})` }}><span style={{ display: "inline-block", background: PURD, color: "#fff", fontFamily: "Arial Black", fontSize: 70, padding: "20px 44px", border: `10px solid ${INK}`, borderRadius: 24 }}>LINK NA BIO</span></div>}</Cam>; }],
];

export const DanielP1: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  const flash = [DN.sete, DN.quinze].some((a) => f >= s(a) && f < s(a) + 2);
  const whip = since < 0.1 && start !== 0;
  const fade = interpolate(sec, [84.38, 85.38], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("daniel3/voice.mp3")} />
      <Audio src={staticFile("daniel3/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      {flash && <AbsoluteFill style={{ background: "#ffffff", opacity: 0.7 }} />}
      <AbsoluteFill style={{ background: "#0f1220", opacity: fade }} />
    </AbsoluteFill>
  );
};
