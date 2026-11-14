// "O garoto reprovado no teste de gênios": Terman x Alvarez (teste de QI, Parte 1)
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../bridge/toon";
import { Toon, Room, Counter, Tag, Cam, shadeHex, clamp01, rnd, s } from "./Milgram";
import { Cap, Stamp } from "./Milgram2";

const FPS = 30;
export const TERMAN_FRAMES = Math.round(49.2 * FPS);
export const TT = {
  rep: 0.83, dec: 2.84, nobel: 3.8, nome: 5.42, luis: 6.08, pai: 7.24, med: 7.68, lab: 8.61, luis2: 10.3, desm: 11.9, aos: 14.28, qi: 16.04, stan: 17.12,
  terman: 17.92, proc: 18.85, nota: 21.98, nao: 22.92, fora: 24.44, esc: 25.48, mil: 26.38, cup: 28.03, muitos: 29.04, mas: 30.9, nenhum: 31.56, eluis: 32.72,
  raios: 34.0, pir: 36.86, gan: 37.69, ast: 39.88, matou: 40.48, din: 40.92, qi2: 42.0, mas2: 43.58, quer: 44.85, faca: 45.92, link: 46.93,
};
const WHITE = "#f4f6f7";
const LUIS: Outfit = { jacket: "#5a8fbf", pants: "#6b5a3e", boots: "#4a3426", hat: "hair", hair: "#5a3a22", skin: "#f5c9a0", build: "kid", goggles: "#8fd4e8" };
const LUIS_AD: Outfit = { jacket: WHITE, pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: "#5a3a22", skin: "#f5c9a0", glasses: true };
const DAD: Outfit = { jacket: WHITE, pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20", skin: "#f0c8a0", steth: true };
const TERMAN: Outfit = { jacket: WHITE, pants: "#3a3d44", boots: "#22201f", hat: "hair", hair: "#cfcfcf", skin: "#ffe2c2", glasses: true, bow: "#b8322c", build: "stout" };
const cupim = (i: number): Outfit => ({ jacket: "#2b3a5a", pants: "#3a3d44", boots: "#22201f", hat: "cap", cap: "#1d1f2a", hair: ["#5a3a22", "#22201f", "#8a5a32", "#caa05a", "#3a2a20"][i % 5], skin: ["#f5c9a0", "#e8b88c", "#ffe2c2", "#d9a577", "#f5c9a0"][i % 5], build: "kid", glasses: i % 2 === 0 });
const WALL = "#9fb6b0", FLOOR = "#8a7a66", CLASS = "#b7a98f";

const Medal: React.FC<{ x: number; y: number; r: number; sc?: number; cross?: number }> = ({ x, y, r, sc = 1, cross = 0 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, transform: `scale(${sc})` }}>
    <div style={{ position: "absolute", left: r * 0.5, top: -r * 1.1, width: r, height: r * 1.3, background: "linear-gradient(90deg,#c0353a 33%,#f4f1ea 33% 66%,#c0353a 66%)", border: `8px solid ${INK}`, boxSizing: "border-box" }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#fff3b0,#e8b630 55%,#b8860b)", border: `12px solid ${INK}`, boxSizing: "border-box" }} />
    <div style={{ position: "absolute", inset: r * 0.22, borderRadius: "50%", border: `6px solid ${INK}`, opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial Black", fontSize: r * 0.42, color: INK }}>NOBEL</div>
    {cross > 0 && <div style={{ position: "absolute", left: -r * 0.2, right: -r * 0.2, top: r * 0.9, height: r * 0.3, background: "#d63a2e", border: `8px solid ${INK}`, transform: `rotate(-35deg) scaleX(${clamp01(cross)})` }} />}
  </div>
);

const Paper: React.FC<{ x: number; y: number; rot?: number; children?: React.ReactNode }> = ({ x, y, rot = -4, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 460, height: 560, background: "#f6efdf", border: `8px solid ${INK}`, transform: `rotate(${rot}deg)`, padding: 28, boxSizing: "border-box", fontFamily: "Arial Black", color: "#2a2420" }}>
    <div style={{ fontSize: 44, borderBottom: "4px solid #2a2420", paddingBottom: 8 }}>TESTE DE QI</div>
    {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ height: 10, background: "#2a2420", opacity: 0.25, marginTop: 30, width: `${90 - i * 12}%` }} />)}
    {children}
  </div>
);

const Gadgets: React.FC<{ sec: number }> = ({ sec }) => (
  <>{[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: 60 + i * 250, top: 330 + (i % 2) * 40, width: 190, height: 150, background: "#4a5a60", border: `8px solid ${INK}`, borderRadius: 12, boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 20, top: 20, width: 56, height: 56, borderRadius: 28, background: "#d8dde2", border: `6px solid ${INK}` }}>
      <div style={{ position: "absolute", left: 22, top: 4, width: 5, height: 22, background: INK, transformOrigin: "50% 100%", transform: `rotate(${Math.sin(sec * 3 + i) * 50}deg)` }} /></div>
    {[0, 1, 2].map((k) => <div key={k} style={{ position: "absolute", left: 100 + k * 26, top: 30, width: 16, height: 16, borderRadius: 8, background: (Math.floor(sec * 4) + k + i) % 3 === 0 ? "#ffd54a" : "#6a3a3a", border: `3px solid ${INK}` }} />)}
  </div>)}</>
);

const Parts: React.FC<{ sec: number }> = ({ sec }) => (
  <>{Array.from({ length: 10 }, (_, i) => {
    const t = sec - TT.desm - i * 0.12; if (t < 0) return null;
    const a = -Math.PI / 2 + (rnd(i, 1) - 0.5) * 2.2, v = 700 + 500 * rnd(i, 2), x = 540 + Math.cos(a) * v * t, y = 1300 + Math.sin(a) * v * t + 1400 * t * t;
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: 50, height: 50, borderRadius: i % 2 ? 10 : 25, background: i % 3 ? "#9aa3a8" : "#ffd54a", border: `6px solid ${INK}`, transform: `rotate(${t * 400}deg)` }} />;
  })}</>
);

const Dino: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 700, height: 420 }}>
    {[200, 380].map((l) => <div key={l} style={{ position: "absolute", left: l, top: 200, width: 60, height: 200, background: "#4f9a58", border: `8px solid ${INK}`, borderRadius: 24 }} />)}
    <div style={{ position: "absolute", left: 120, top: 80, width: 420, height: 220, background: "#5fb068", border: `10px solid ${INK}`, borderRadius: "50%" }} />
    <div style={{ position: "absolute", left: 470, top: -60, width: 70, height: 240, background: "#5fb068", border: `10px solid ${INK}`, borderRadius: 35, transform: "rotate(12deg)" }} />
    <div style={{ position: "absolute", left: 480, top: -110, width: 190, height: 100, background: "#5fb068", border: `10px solid ${INK}`, borderRadius: "50%" }} />
    <div style={{ position: "absolute", left: 590, top: -80, width: 20, height: 20, background: INK, borderRadius: 10 }} />
    <div style={{ position: "absolute", left: -90, top: 150, width: 260, height: 70, background: "#5fb068", border: `10px solid ${INK}`, borderRadius: "50%", transform: "rotate(-14deg)" }} />
  </div>
);

type ShotFn = (sec: number, f: number) => React.ReactNode;
const row5 = (expr: "neutral" | "grin" | "smile", y = 1750) => [0, 1, 2, 3, 4].map((i) => <Toon key={i} o={cupim(i)} expr={expr} seed={40 + i} h={760} x={110 + i * 215} y={y + (i % 2) * 40} look={i % 2 ? 0.4 : -0.4} />);
const GOLD = "radial-gradient(circle at 50% 38%,#4a3d1a,#0f1220 70%)";

const SHOTS: [number, ShotFn][] = [
  [0, (sec) => <Cam a={0} z0={1.05} z1={1.2} origin="50% 30%" noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={LUIS} expr={sec >= TT.rep ? "pained" : "smile"} seed={5} h={1500} x={540} y={1900} /></Room>
    <Stamp text="REPROVADO" at={TT.rep} sec={sec} top={1300} size={110} /></Cam>],
  [TT.dec, (sec) => <Cam a={TT.dec} z0={1.0} z1={1.08} noZap><AbsoluteFill style={{ background: GOLD }}>
    <Cap top={150} size={100} alpha={clamp01((sec - TT.dec) / 0.2)}>DÉCADAS DEPOIS</Cap>
    {sec >= TT.nobel && <Medal x={540} y={900} r={260} sc={interpolate(sec - TT.nobel, [0, 0.15, 0.3], [2.2, 0.9, 1], { extrapolateRight: "clamp" })} />}
    {sec >= TT.nobel && <Cap top={1300} size={96} color="#ffd54a">NOBEL DE FÍSICA</Cap>}
  </AbsoluteFill></Cam>],
  [TT.nome, (sec) => <Cam a={TT.nome} z0={1.0} z1={1.1} noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={LUIS} expr="smile" seed={5} h={1400} x={540} y={1850} /></Room>
    <Cap top={200} size={110} color="#ffd54a" alpha={clamp01((sec - TT.luis) / 0.15)}>LUIS ALVAREZ</Cap>
    <Cap top={380} size={60} alpha={clamp01((sec - 6.6) / 0.3)}>SÃO FRANCISCO, 1911</Cap></Cam>],
  [TT.pai, (sec) => <Cam a={TT.pai} z0={1.0} z1={1.1} noZap><Room wall={WALL} floor={FLOOR}>
    <Gadgets sec={sec} />
    <Toon o={LUIS} expr="smile" seed={5} h={1000} x={230} y={1700} look={0.6} />
    <Toon o={DAD} expr="smile_closed" seed={9} h={1400} x={730} y={1800} /></Room>
    {sec >= TT.med && <Tag text="PAI: MÉDICO" x={730} y={330} sec={sec} since={TT.med} col="#ffffff" />}</Cam>],
  [TT.luis2, (sec) => <Cam a={TT.luis2} z0={1.0} z1={1.1} noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={LUIS} expr={sec >= TT.desm ? "grin" : "smile"} seed={5} h={1300} x={540} y={1650} />
    <div style={{ position: "absolute", left: 80, right: 80, top: 1330, height: 70, background: "#8a5a32", border: `10px solid ${INK}`, borderRadius: 10 }} />
    <div style={{ position: "absolute", left: 120, right: 120, top: 1400, bottom: 0, background: "#6e4626", border: `10px solid ${INK}` }} />
    <div style={{ position: "absolute", left: 400, top: 1220, width: 280, height: 120, background: "#7d848c", border: `8px solid ${INK}`, borderRadius: 14, transform: sec >= TT.desm ? `rotate(${Math.sin(sec * 30) * 4}deg)` : undefined }} />
    {sec >= TT.desm && <Parts sec={sec} />}</Room>
    <Tag text="DESMONTANDO TUDO" x={540} y={230} sec={sec} since={TT.desm - 0.4} /></Cam>],
  [TT.aos, (sec) => <Cam a={TT.aos} z0={1.0} z1={1.1} noZap><Room wall={CLASS} floor={FLOOR}>
    <Toon o={LUIS} expr="nervous" seed={5} h={1300} x={540} y={1750} />
    <div style={{ position: "absolute", left: 100, right: 100, top: 1450, height: 80, background: "#b98250", border: `10px solid ${INK}`, borderRadius: 10 }} />
    <Paper x={300} y={1180} rot={-6}>{sec >= TT.qi && <div style={{ fontSize: 120, marginTop: 20, textAlign: "center" }}>QI</div>}</Paper></Room>
    <Counter label="ANOS DE IDADE" value="10" color="#ffd54a" since={TT.aos} sec={sec} top={120} />
    {sec >= TT.stan && <Tag text="STANFORD" x={540} y={460} sec={sec} since={TT.stan} col="#ffffff" />}</Cam>],
  [TT.terman, (sec) => {
    const tap = sec >= TT.proc && sec < TT.proc + 0.3 ? Math.sin((sec - TT.proc) * 40) * 10 : 0;
    return <Cam a={TT.terman} z0={1.0} z1={1.1} noZap><Room wall={CLASS} floor={FLOOR} lamp={false}>
      <div style={{ position: "absolute", left: 60, top: 300, width: 960, height: 560, background: "#2f5a46", border: "14px solid #6e4626", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontFamily: "Arial Black", fontSize: 190, color: "#f4f1ea", transform: `translateY(${tap}px)` }}>QI 135+</div></div>
      <Toon o={TERMAN} expr="stern" seed={8} h={1500} x={760} y={1850} />
      <div style={{ position: "absolute", left: 140, top: 1000 + tap, width: 560, height: 14, background: "#c9a06a", border: `5px solid ${INK}`, borderRadius: 7, transformOrigin: "100% 50%", transform: "rotate(-24deg) translateX(40px)" }} />
      {sec >= 19.33 && [0, 1, 2].map((i) => <Toon key={i} o={cupim(i)} expr="neutral" seed={50 + i} h={620} x={110 + i * 170} y={1900} />)}</Room>
      <Tag text="PROF. TERMAN" x={760} y={1300} sec={sec} since={TT.terman + 0.4} col="#ffffff" /></Cam>;
  }],
  [TT.nota, (sec) => <Cam a={TT.nota} z0={1.0} z1={1.12} noZap><Room wall={CLASS} floor={FLOOR}>
    <Toon o={LUIS} expr={sec >= TT.nao ? "pained" : "nervous"} seed={5} h={1300} x={300} y={1750} look={0.6} />
    <Paper x={540} y={900} rot={5}>{sec >= TT.nao && <div style={{ fontSize: 80, color: "#d63a2e", marginTop: 20, textAlign: "center" }}>NOTA<br />INSUFICIENTE</div>}</Paper></Room></Cam>],
  [TT.fora, (sec) => <Cam a={TT.fora} z0={1.1} z1={1.25} kicks={[TT.fora]} noZap><Room wall={shadeHex(CLASS, 0.85)} floor={FLOOR} dark={0.25}>
    <Toon o={LUIS} expr="pained" seed={5} h={1500} x={540} y={1900} look={-0.6} /></Room>
    <Stamp text="DE FORA" at={TT.fora} sec={sec} top={1350} /></Cam>],
  [TT.esc, (sec) => <Cam a={TT.esc} z0={1.0} z1={1.06} noZap><Room wall={CLASS} floor={FLOOR}>{row5("neutral")}</Room>
    <Counter label="CRIANÇAS ESCOLHIDAS" value={sec >= TT.mil ? "1.500" : "..."} color="#ffd54a" since={TT.esc} sec={sec} top={140} />
    {sec >= TT.cup && <Tag text="OS CUPINS" x={540} y={560} sec={sec} since={TT.cup} />}</Cam>],
  [TT.muitos, () => <Cam a={TT.muitos} z0={1.0} z1={1.08} noZap><Room wall={CLASS} floor={FLOOR}>{row5("grin")}</Room>
    <Cap top={230} size={100} color="#9be7a0">BOAS CARREIRAS</Cap></Cam>],
  [TT.mas, (sec) => <Cam a={TT.mas} z0={1.0} z1={1.08} kicks={[TT.nenhum]} noZap><AbsoluteFill style={{ background: GOLD }}>
    <Medal x={540} y={880} r={260} cross={(sec - TT.nenhum) / 0.2} />
    <Cap top={1300} size={100} color="#ff8a7a">NENHUM NOBEL</Cap></AbsoluteFill></Cam>],
  [TT.eluis, (sec) => <Cam a={TT.eluis} z0={1.0} z1={1.15} origin="50% 30%" noZap><Room wall={WALL} floor={FLOOR}>
    <Toon o={LUIS_AD} expr="smile" seed={12} h={1700} x={540} y={1950} /></Room>
    <Tag text="E O LUIS?" x={540} y={230} sec={sec} since={TT.eluis} col="#9be7ff" /></Cam>],
  [TT.raios, (sec) => <Cam a={TT.raios} z0={1.0} z1={1.06} noZap><AbsoluteFill style={{ background: "linear-gradient(#f2b866,#e8d6a8 60%,#d9b873)" }}>
    {Array.from({ length: 14 }, (_, i) => { const ph = ((sec * 1.6 + i * 0.37) % 1); return <div key={i} style={{ position: "absolute", left: 60 + i * 72, top: -100 + ph * 1500, width: 10, height: 130, background: "#fff36b", border: `4px solid ${INK}`, borderRadius: 6, transform: "rotate(12deg)" }} />; })}
    <div style={{ position: "absolute", left: 90, top: 700, width: 900, height: 700, background: sec >= TT.pir ? "#e8c070" : "#d9a95a", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1390, bottom: 0, background: "#d9b873", borderTop: `12px solid ${INK}` }} />
    <Toon o={LUIS_AD} expr="smile" seed={12} h={700} x={170} y={1750} />
    {sec >= TT.raios + 0.4 && <Tag text="RAIOS CÓSMICOS" x={540} y={230} sec={sec} since={TT.raios + 0.4} />}
    {sec >= TT.pir && <Tag text="PIRÂMIDE" x={700} y={1500} sec={sec} since={TT.pir} col="#ffffff" />}
  </AbsoluteFill></Cam>],
  [TT.gan, (sec) => <Cam a={TT.gan} z0={1.0} z1={1.08} kicks={[TT.gan + 0.3]} noZap><AbsoluteFill style={{ background: GOLD }}>
    <Medal x={540} y={620} r={200} sc={interpolate(sec - TT.gan, [0, 0.15, 0.3], [2.2, 0.9, 1], { extrapolateRight: "clamp" })} />
    <Toon o={LUIS_AD} expr="grin" seed={12} h={800} x={540} y={1930} />
    <Counter label="NOBEL DE FÍSICA" value="1968" color="#ffd54a" since={TT.gan + 0.3} sec={sec} top={820} /></AbsoluteFill></Cam>],
  [TT.ast - 1.2, (sec) => {
    const t = sec - TT.matou, ax = interpolate(sec, [TT.ast - 1.2, TT.matou], [900, 330], { extrapolateRight: "clamp" }), ay = interpolate(sec, [TT.ast - 1.2, TT.matou], [100, 700], { extrapolateRight: "clamp" });
    return <Cam a={TT.ast} z0={1.0} z1={1.05} kicks={[TT.matou]} noZap><AbsoluteFill style={{ background: "linear-gradient(#f08a4a,#f6d28a 55%,#7ab35a)" }}>
      <Dino x={190} y={1100} />
      {sec < TT.matou + 0.1 && <div style={{ position: "absolute", left: ax, top: ay, width: 140, height: 140, borderRadius: 70, background: "#6e5a4a", border: `10px solid ${INK}`, boxShadow: "-120px -100px 80px rgba(255,160,40,.6)" }} />}
      {t >= 0 && t < 0.3 && <AbsoluteFill style={{ background: "#fff", opacity: 1 - t / 0.3 }} />}
      {sec >= TT.ast && <Cap top={230} size={90} color="#ffd54a">UM ASTEROIDE</Cap>}
      {sec >= TT.din && <Cap top={820} size={100}>DINOSSAUROS</Cap>}
    </AbsoluteFill></Cam>;
  }],
  [TT.qi2, (sec) => <Cam a={TT.qi2} z0={1.0} z1={1.05} noZap><AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Cap top={300} size={110} color="#9be7a0" alpha={clamp01((sec - TT.qi2) / 0.15)}>O QI MEDE<br />ALGO REAL</Cap>
    <Cap top={800} size={110} color="#ff8a7a" alpha={clamp01((sec - TT.mas2) / 0.15)}>MAS NÃO<br />MEDE TUDO</Cap>
    <Toon o={LUIS_AD} expr="smile_closed" seed={12} h={800} x={540} y={1880} /></AbsoluteFill></Cam>],
  [TT.quer, (sec) => <AbsoluteFill style={{ background: "linear-gradient(#141a33,#0b0d1a)" }}>
    <Cap top={300} size={110}>QUER SABER</Cap><Cap top={450} size={130} color="#ffd54a" alpha={clamp01((sec - 45.3) / 0.15)}>O SEU?</Cap>
    {sec >= TT.faca && <div style={{ position: "absolute", left: 120, right: 120, top: 760, textAlign: "center", background: "#ffd54a", border: `12px solid ${INK}`, borderRadius: 36, padding: "36px 0", fontFamily: "Arial Black", fontSize: 110, color: INK,
      transform: `scale(${sec - TT.faca < 0.15 ? 0.6 + 2.7 * (sec - TT.faca) : 1}) rotate(-2deg)` }}>FAÇA O TESTE</div>}
    {sec >= TT.link && <div style={{ position: "absolute", left: 0, right: 0, top: 1150, textAlign: "center", fontFamily: "Arial Black", fontSize: 92, color: "#fff", WebkitTextStroke: `6px ${INK}`, paintOrder: "stroke" }}>🔗 LINK NA BIO</div>}
    <Toon o={LUIS_AD} expr={sec >= TT.faca ? "grin" : "smile"} seed={12} h={700} x={540} y={1880} />
  </AbsoluteFill>],
];

export const TermanP1: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  const flash = [TT.rep, TT.nobel, TT.fora, TT.matou].some((a) => f >= s(a) && f < s(a) + 2);
  const whip = since < 0.1 && [TT.nome, TT.pai, TT.aos, TT.terman, TT.esc, TT.eluis, TT.qi2, TT.quer].includes(start);
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("terman/voice.mp3")} />
      <Audio src={staticFile("terman/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      {flash && <AbsoluteFill style={{ background: "#ffffff", opacity: 0.8 }} />}
    </AbsoluteFill>
  );
};
export { Medal };
