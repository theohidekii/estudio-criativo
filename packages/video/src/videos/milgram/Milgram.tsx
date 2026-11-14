// "Milgram, Parte 1" v2: faster edit (a cut every 1-3 s), animated electrocution (x-ray flash, bolts, jitter),
// close-ups of the finger pressing each switch, punch-ins on key words, whip and flash transitions, and a
// synthesized SFX + tension music track (public/milgram/fx.wav, made by scripts/milgram_fx.py from the same cues).
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Pen, bodyFront, Outfit, Expr, INK } from "../bridge/toon";

export const FPS = 30;
export const MILGRAM_FRAMES = Math.round(56.9 * FPS);
const s = (sec: number) => Math.round(sec * FPS);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const rnd = (a: number, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- cast (our own; the protagonist keeps this outfit for the whole series) ----
const HERO: Outfit = { jacket: "#e0a526", pants: "#34405a", boots: "#4a3426", hat: "hair", hair: "#3a2a20", skin: "#f5c9a0" };
const SCIENTIST: Outfit = { jacket: "#a7b0b5", pants: "#3a3d44", boots: INK, hat: "hair", hair: "#22201f", skin: "#ffe2c2" };
const LEARNER: Outfit = { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#7a5a3a", moustache: "#4a3426", build: "stout", skin: "#ecd0b6" };
const LAB_WALL = "#9fb6b0", LAB_FLOOR = "#8a7a66", ROOM2_WALL = "#b7a98f";

// ---- cue sheet (seconds, from the narration's words.json); scripts/milgram_fx.py uses the same numbers ----
export const T = {
  pessoas: 1.97, choques: 3.58, so: 5.41, mandou: 6.94, ad: 7.6, quatro: 11.71, voce: 13.58, vira: 15.24, outro: 16.48, amarrado: 18.91,
  antes: 21.18, choque: 23.0, doi: 24.24, cada: 25.08, forte: 27.36, v15: 28.03, v75: 29.24, v150: 30.61, grita: 32.14,
  olha: 33.33, cont: 36.42, v300: 37.36, bang: 39.12, silence: 40.36, exige: 42.32, cont2: 44.23, vote: 45.16, aperta: 46.4,
  optA: 48.2, optB: 50.2, coment: 51.46, part2: 52.37,
};
/** moments of electrocution: [start, duration, strength] */
const ZAPS: [number, number, number][] = [[T.choques, 0.9, 1], [T.doi, 0.75, 0.8], [T.v15 + 0.15, 0.35, 0.35], [T.v75 + 0.15, 0.5, 0.6], [T.v150 + 0.12, 1.4, 1], [T.v300 + 0.5, 1.2, 1]];
const zapAt = (sec: number) => { for (const [a, d, k] of ZAPS) if (sec >= a && sec < a + d) return { t: (sec - a) / d, k }; return null; };

const blinkAt = (f: number, seed: number) => { const period = 40 + (seed * 17) % 30, k = (f + seed * 13) % period; return k < 2 ? 1 : k < 4 ? 0.5 : 0; };

type ToonProps = { o: Outfit; expr: Expr; seed: number; h: number; x: number; y: number; mode?: "stand" | "sit"; look?: number; flip?: boolean;
  zap?: number; tilt?: number; headTilt?: number; wave?: number; breathe?: boolean };
/** one cartoon character on its own canvas, redrawn every frame (idle breathing, head bob, electrocution jitter) */
const Toon: React.FC<ToonProps> = ({ o, expr, seed, h, x, y, mode = "stand", look = 0, flip = false, zap = 0, tilt = 0, headTilt = 0, wave, breathe = true }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const z = zap > 0;
  const e: Expr = z ? (f % 4 < 2 ? "shock" : "pained") : expr;
  const blink = z || expr === "shock" ? 0 : blinkAt(f, seed);
  const tl = tilt + (z ? (rnd(f, seed) - 0.5) * 14 * zap : Math.sin(f / 23 + seed) * 1.2);
  const ht = headTilt + (z ? (rnd(f, seed + 3) - 0.5) * 18 * zap : Math.sin(f / 31 + seed * 2) * 2.5);
  const wv = z ? 0.6 + 0.4 * rnd(f, seed + 9) : wave;
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, 600, 1000);
    bodyFront(new Pen(g), o, { mode, expr: e, blink, look, seed, phase: 0, tilt: tl, headTilt: ht, wave: wv });
  }, [o, e, blink, look, seed, mode, tl, ht, wv]);
  const w = h * 0.6;
  const dx = z ? (rnd(f, seed + 5) - 0.5) * 40 * zap : 0, dy = z ? (rnd(f, seed + 7) - 0.5) * 30 * zap : 0;
  const sy = breathe && !z ? 1 + 0.012 * Math.sin(f / 14 + seed) : 1;
  const xray = z && f % 4 < 2; // classic cartoon electrocution: alternate frames in negative
  return (
    <canvas ref={ref} width={600} height={1000} style={{ position: "absolute", left: x - w / 2 + dx, top: y - h + dy, width: w, height: h,
      transform: `${flip ? "scaleX(-1) " : ""}scaleY(${sy})`, transformOrigin: "50% 100%", filter: xray ? "invert(1) hue-rotate(180deg) brightness(1.3)" : undefined }} />
  );
};

/** zig-zag lightning around a box, new shape every 2 frames */
const Bolts: React.FC<{ x: number; y: number; w: number; h: number; k?: number; n?: number }> = ({ x, y, w, h, k = 1, n = 7 }) => {
  const f = useCurrentFrame(), q = Math.floor(f / 2);
  const bolts = Array.from({ length: Math.round(n * k) }, (_, i) => {
    const a = rnd(q, i) * Math.PI * 2, cx = x + w / 2, cy = y + h / 2;
    const r0 = 0.25 + 0.2 * rnd(q, i + 30), r1 = 0.65 + 0.35 * rnd(q, i + 60);
    const pts: string[] = [];
    for (let j = 0; j <= 5; j++) {
      const r = r0 + (r1 - r0) * (j / 5), jit = (rnd(q, i * 9 + j) - 0.5) * 0.5;
      pts.push(`${cx + Math.cos(a + jit) * r * w * 0.7},${cy + Math.sin(a + jit) * r * h * 0.6}`);
    }
    return pts.join(" ");
  });
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "visible" }}>
      {bolts.map((p, i) => <polyline key={"o" + i} points={p} fill="none" stroke={INK} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" />)}
      {bolts.map((p, i) => <polyline key={"i" + i} points={p} fill="none" stroke={i % 3 ? "#fff36b" : "#9be7ff"} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />)}
    </svg>
  );
};

/** comic burst with a word (BZZT!, BAM!) */
const Burst: React.FC<{ x: number; y: number; r: number; text: string; t: number; col?: string }> = ({ x, y, r, text, t, col = "#ffd54a" }) => {
  const sc = t < 0.15 ? 0.4 + 4 * t : 1 + 0.05 * Math.sin(t * 30);
  const pts = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? r * 0.62 : r; return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`; }).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${sc}) rotate(${-8 + 4 * Math.sin(t * 9)}deg)`, transformOrigin: `${x}px ${y}px`, opacity: t > 0.85 ? (1 - t) / 0.15 : 1 }}>
      <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}><polygon points={pts} fill={col} stroke={INK} strokeWidth={12} strokeLinejoin="round" /></svg>
      <div style={{ position: "absolute", left: x - r, top: y - r * 0.32, width: 2 * r, textAlign: "center", fontFamily: "Arial Black, Impact", fontSize: r * 0.5, color: "#fff", WebkitTextStroke: `${r * 0.04}px ${INK}`, paintOrder: "stroke" }}>{text}</div>
    </div>
  );
};

// ---- sets ----
function shadeHex(c: string, k: number) {
  const n = parseInt(c.slice(1), 16), ch = (v: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}
const Room: React.FC<{ wall: string; floor: string; dark?: number; lamp?: boolean; children?: React.ReactNode }> = ({ wall, floor, dark = 0, lamp = true, children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${shadeHex(wall, 1.06)}, ${shadeHex(wall, 0.82)})`, overflow: "hidden" }}>
      {/* wall panels */}
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: 40 + i * 270, top: 520, width: 230, height: 560, border: `5px solid ${shadeHex(wall, 0.78)}`, borderRadius: 6 }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1180, height: 60, background: shadeHex(wall, 0.68), borderTop: `6px solid ${INK}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, bottom: 0, background: `linear-gradient(${floor}, ${shadeHex(floor, 0.7)})`, borderTop: `10px solid ${INK}` }} />
      {/* hanging lamp cone */}
      {lamp && <div style={{ position: "absolute", left: 140, top: -40, width: 800, height: 1700, background: "radial-gradient(ellipse at 50% 0%, rgba(255,240,200,.28), rgba(255,240,200,0) 65%)", opacity: 0.85 + 0.15 * Math.sin(f / 5) * Math.sin(f / 13) }} />}
      {children}
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,8,20,.55) 100%)" }} />
      {dark > 0 && <AbsoluteFill style={{ background: "#0b0d1a", opacity: dark }} />}
    </AbsoluteFill>
  );
};

const SWITCHES = 30;
/** the shock generator: 30 switches 15..450 V; pressed ones glow */
const Machine: React.FC<{ volts: number; x: number; y: number; w: number; hover?: number; flash?: boolean }> = ({ volts, x, y, w, hover = -1, flash = false }) => {
  const h = w * 0.42, sw = (w - 60) / SWITCHES;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: "#3b4148", border: `8px solid ${INK}`, borderRadius: 18, boxShadow: "0 18px 0 rgba(0,0,0,.25)" }}>
      <div style={{ position: "absolute", left: 24, right: 24, top: 18, height: h * 0.18, background: flash ? "#ff5a4a" : "#1e2227", borderRadius: 8, color: "#d8dde2", fontFamily: "Arial Black, Arial", fontSize: h * 0.09, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 2 }}>GERADOR DE CHOQUE</div>
      {Array.from({ length: SWITCHES }, (_, i) => {
        const on = 15 * (i + 1) <= volts, danger = i >= 24, warn = i >= 14;
        const c = danger ? "#ff5a4a" : warn ? "#ff9a3a" : "#ffd54a";
        return <div key={i} style={{ position: "absolute", left: 30 + i * sw + sw * 0.15, top: h * 0.5, width: sw * 0.7, height: h * 0.32, borderRadius: 4,
          background: on ? c : i === hover ? "#e9eef2" : "#8a949c", border: `3px solid ${INK}`, boxShadow: on ? `0 0 ${sw}px ${c}` : undefined, transform: on ? "translateY(6px)" : undefined }} />;
      })}
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 10, display: "flex", justifyContent: "space-between", color: "#c9d1d8", fontFamily: "Arial", fontWeight: 700, fontSize: h * 0.06 }}>
        <span>15 V</span><span>LEVE</span><span>FORTE</span><span style={{ color: "#ff8a7a" }}>PERIGO</span><span style={{ color: "#ff8a7a" }}>XXX</span>
      </div>
    </div>
  );
};

/** extreme close-up: the finger over one big switch, pressing at `press` (seconds, absolute) */
const PressCU: React.FC<{ sec: number; press: number; volts: number; label: string; danger?: boolean; tremble?: number }> = ({ sec, press, volts, label, danger = false, tremble = 0 }) => {
  const f = useCurrentFrame();
  const t = sec - press, down = t >= 0 ? (t < 0.12 ? t / 0.12 : 1) : 0, approach = clamp01(1 + t / 1.0);
  const fy = 1060 - 260 * (1 - approach) + 120 * down + (tremble ? Math.sin(f * 1.7) * tremble : 0), fx = 560 + (tremble ? Math.cos(f * 2.3) * tremble * 0.6 : 0);
  const col = danger ? "#ff5a4a" : "#ffd54a";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #4a5058, #1d2025 75%)" }}>
      {/* the panel strip with three switches; the middle one is ours */}
      <div style={{ position: "absolute", left: -60, right: -60, top: 980, height: 620, background: "#3b4148", border: `12px solid ${INK}`, borderRadius: 30 }} />
      {[-1, 0, 1].map((i) => (
        <div key={i} style={{ position: "absolute", left: 540 - 140 + i * 360, top: 1100, width: 280, height: 380, borderRadius: 24, border: `10px solid ${INK}`,
          background: i < 0 || (i === 0 && down) ? col : "#8a949c", boxShadow: i === 0 && down ? `0 0 120px ${col}` : undefined, transform: i === 0 && down ? "translateY(18px)" : undefined }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1530, textAlign: "center", fontFamily: "Arial Black", fontSize: 110, color: danger ? "#ff8a7a" : "#e9eef2", WebkitTextStroke: `5px ${INK}`, paintOrder: "stroke" }}>{label}</div>
      {/* sleeve + finger */}
      <div style={{ position: "absolute", left: fx - 60, top: fy - 1100, width: 120, height: 1000, background: "linear-gradient(90deg,#f5c9a0,#e2ac80)", border: `10px solid ${INK}`, borderRadius: 60 }} />
      <div style={{ position: "absolute", left: fx - 230, top: fy - 1500, width: 460, height: 560, background: "#f5c9a0", border: `10px solid ${INK}`, borderRadius: "45% 45% 40% 40%" }} />
      <div style={{ position: "absolute", left: fx - 300, top: fy - 1900, width: 600, height: 520, background: "#e0a526", border: `10px solid ${INK}`, borderRadius: 40 }} />
      <div style={{ position: "absolute", left: fx - 30, top: fy - 70, width: 60, height: 40, background: "#fff1e4", border: `6px solid ${INK}`, borderRadius: 12 }} />
      <div style={{ position: "absolute", top: 140, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black", fontSize: 200, color: danger ? "#ff5a4a" : col, WebkitTextStroke: `8px ${INK}`, paintOrder: "stroke",
        transform: `scale(${down ? 1 + 0.25 * Math.max(0, 1 - t * 5) : 0.9})`, opacity: down ? 1 : 0.35 }}>{volts} V</div>
    </AbsoluteFill>
  );
};

/** the series counter: big number on screen, slams in */
const Counter: React.FC<{ label: string; value: string; color?: string; since: number; sec: number; top?: number }> = ({ label, value, color = "#ffffff", since, sec, top = 120 }) => {
  const t = sec - since, sc = t < 0.18 ? 1.8 - 0.8 * (t / 0.18) : 1;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, Impact, Arial", color, WebkitTextStroke: `7px ${INK}`, paintOrder: "stroke", opacity: clamp01(t / 0.08) }}>
      <div style={{ fontSize: 54, letterSpacing: 4, WebkitTextStroke: `3px ${INK}` }}>{label}</div>
      <div style={{ fontSize: 210, lineHeight: 1, transform: `scale(${sc}) rotate(${t < 0.18 ? -4 : -2}deg)` }}>{value}</div>
    </div>
  );
};

const Tag: React.FC<{ text: string; x: number; y: number; sec: number; since: number; col?: string }> = ({ text, x, y, sec, since, col = "#ffd54a" }) => {
  const t = sec - since; if (t < 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,0) scale(${t < 0.15 ? 0.5 + 3.3 * t : 1}) rotate(-4deg)`, background: col, border: `8px solid ${INK}`, borderRadius: 16, padding: "8px 30px", fontFamily: "Arial Black", fontSize: 64, color: INK }}>{text}</div>;
};

/** camera: push-in over the shot, optional punch-in at a word, impact kicks */
const Cam: React.FC<{ a: number; z0?: number; z1?: number; origin?: string; punch?: number; kicks?: number[]; pan?: [number, number]; noZap?: boolean; children: React.ReactNode }> =
  ({ a, z0 = 1, z1 = 1.08, origin = "50% 50%", punch, kicks = [], pan = [0, 0], noZap = false, children }) => {
    const f = useCurrentFrame(), sec = f / FPS, t = sec - a;
    let z = z0 + (z1 - z0) * clamp01(t / 4);
    if (punch !== undefined && sec >= punch) z *= 1 + 0.18 * clamp01((sec - punch) / 0.12);
    let dx = pan[0] * clamp01(t / 4), dy = pan[1] * clamp01(t / 4);
    for (const k of kicks) { const n = f - s(k); if (n >= 0 && n < 9) { const amp = 34 * (1 - n / 9) * (n % 2 ? -1 : 1); dx += amp; dy -= amp * 0.6; } }
    const zz = noZap ? null : zapAt(sec); if (zz) { dx += (rnd(f, 77) - 0.5) * 30 * zz.k; dy += (rnd(f, 78) - 0.5) * 30 * zz.k; }
    return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${z})`, transformOrigin: origin }}>{children}</AbsoluteFill>;
  };

// ---- edit: list of shots [start, render]; each shot plays until the next one starts ----
type ShotFn = (sec: number, f: number) => React.ReactNode;
/** the experiment chair: wooden, with leather wrist and ankle straps, electrodes, cables to a wall box, an observation window */
const Chair: React.FC<{ sec: number; expr: Expr; zap: number; strap: number }> = ({ sec, expr, zap, strap }) => {
  const f = useCurrentFrame();
  const WOOD = "#8a5a32", WOOD_D = "#6e4626", WOOD_L = "#b98250", LEATHER = "#2c2622";
  const ox = zap > 0 ? (rnd(f, 41) - 0.5) * 16 * zap : 0, oy = zap > 0 ? (rnd(f, 42) - 0.5) * 8 * zap : 0;
  const hot = zap > 0, wire = hot ? (f % 4 < 2 ? "#fff36b" : "#9be7ff") : "#4a4f55";
  const box = (x: number, y: number, w: number, h: number, fill: string, r = 10, bw = 8) =>
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: fill, border: `${bw}px solid ${INK}`, borderRadius: r, boxSizing: "border-box" }} />;
  const sx = (side: -1 | 1) => (side < 0 ? 292 : 668);
  return (
    <>
      {/* observation window on the wall, someone watching behind the glass */}
      <div style={{ position: "absolute", left: 790, top: 420, width: 250, height: 380, background: "linear-gradient(135deg,#d9edf2,#9fc3cf 60%,#c4dde4)", border: `12px solid ${INK}`, borderRadius: 10, overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 80, top: 150, width: 90, height: 100, borderRadius: "45%", background: "#22201f", opacity: 0.4 }} />
        <div style={{ position: "absolute", left: 40, top: 240, width: 170, height: 200, borderRadius: "40% 40% 0 0", background: "#22201f", opacity: 0.4 }} />
        <div style={{ position: "absolute", left: -40, top: -40, width: 60, height: 600, background: "rgba(255,255,255,.35)", transform: "rotate(20deg)" }} />
      </div>
      {/* wall box with dial and lights */}
      <div style={{ position: "absolute", left: 30, top: 820, width: 190, height: 280, background: "#4a5a60", border: `10px solid ${INK}`, borderRadius: 14, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 35, top: 28, width: 90, height: 90, borderRadius: 45, background: "#d8dde2", border: `7px solid ${INK}` }}>
          <div style={{ position: "absolute", left: 38, top: 8, width: 6, height: 34, background: INK, transformOrigin: "50% 100%", transform: `rotate(${hot ? 40 + 30 * rnd(f, 3) : -50}deg)` }} />
        </div>
        {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 20 + i * 44, top: 150, width: 28, height: 28, borderRadius: 14, border: `5px solid ${INK}`, background: hot ? "#ff5a4a" : "#6a3a3a", boxShadow: hot ? "0 0 24px #ff5a4a" : undefined }} />)}
        <div style={{ position: "absolute", left: 20, top: 205, width: 130, height: 24, background: "#1e2227", border: `5px solid ${INK}`, borderRadius: 6 }} />
      </div>
      {/* floor shadow */}
      <div style={{ position: "absolute", left: 200, top: 1470, width: 680, height: 80, borderRadius: "50%", background: "rgba(10,8,20,.32)" }} />
      {/* cables, drawn behind the chair front */}
      <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "visible" }}>
        {["M205 1090 C 250 1150, 270 1100, 305 1060", "M120 1100 C 120 1300, 930 1330, 790 1062"].map((d, i) => (
          <g key={i}><path d={d} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" /><path d={d} fill="none" stroke={wire} strokeWidth={10} strokeLinecap="round" /></g>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${ox}px, ${oy}px)` }}>
        {/* chair back: posts, slats, top rail */}
        {box(322, 700, 40, 470, WOOD_D)}{box(718, 700, 40, 470, WOOD_D)}
        {box(340, 770, 400, 360, WOOD, 8)}
        {[1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 340 + i * 80, top: 780, width: 6, height: 340, background: WOOD_D, opacity: 0.55 }} />)}
        {box(312, 735, 456, 70, WOOD_D, 24)}
        {/* seat top face (behind the body) */}
        <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}><polygon points="330,1120 750,1120 810,1082 270,1082" fill={WOOD_L} stroke={INK} strokeWidth={8} strokeLinejoin="round" /></svg>
        <Toon o={LEARNER} expr={expr} seed={11} h={1250} x={540} y={1204} mode="sit" zap={zap} />
        {/* seat front board and legs */}
        {box(300, 1115, 480, 70, WOOD, 12)}
        {box(305, 1180, 38, 330, WOOD_D)}{box(737, 1180, 38, 330, WOOD_D)}
        {box(343, 1380, 394, 34, WOOD_D, 8, 7)}
        {/* the learner's lower legs and shoes, strapped at the ankles */}
        {[-1, 1].map((side) => {
          const cx = 540 + side * 82;
          return (
            <div key={side}>
              <div style={{ position: "absolute", left: cx - 29, top: 1170, width: 58, height: 280, background: "#3b3f52", border: `8px solid ${INK}`, borderRadius: 29, boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: cx - 62 + side * 24, top: 1440, width: 124, height: 50, background: "#4a3426", border: `8px solid ${INK}`, borderRadius: "40px 40px 14px 14px", boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: cx - 40, top: 1385, width: 80, height: 28, background: LEATHER, border: `6px solid ${INK}`, borderRadius: 6, boxSizing: "border-box", transform: `scaleX(${clamp01(strap * 2 - 1)})` }} />
            </div>
          );
        })}
        {/* armrests with wrist straps and electrodes */}
        {([-1, 1] as const).map((side) => (
          <div key={side}>
            {box(side < 0 ? 262 : 742, 1020, 76, 50, WOOD_D, 14)}
            {box(side < 0 ? 290 : 770, 1060, 20, 70, WOOD_D, 4, 6)}
            <div style={{ position: "absolute", left: sx(side) - 14, top: 1008, width: 124, height: 46, background: LEATHER, border: `7px solid ${INK}`, borderRadius: 8, boxSizing: "border-box",
              transform: `scaleX(${clamp01(strap * 2)})`, transformOrigin: side < 0 ? "0% 50%" : "100% 50%" }}>
              <div style={{ position: "absolute", left: 46, top: 6, width: 22, height: 22, background: "#d9b34a", border: `4px solid ${INK}`, borderRadius: 4 }} />
            </div>
            <div style={{ position: "absolute", left: sx(side) + 12, top: 1048, width: 76, height: 30, background: "#9aa3a8", border: `6px solid ${INK}`, borderRadius: 8, boxSizing: "border-box", opacity: clamp01(strap * 2 - 0.4) }} />
          </div>
        ))}
        {hot && <Bolts x={270} y={460} w={540} h={900} k={zap} />}
      </div>
    </>
  );
};

const learnerRoom = (sec: number, expr: Expr, zap: number, z: [number, number], a: number, kicks: number[] = [], strap = 1) => (
  <Cam a={a} z0={z[0]} z1={z[1]} origin="50% 55%" kicks={kicks}>
    <Room wall={ROOM2_WALL} floor={LAB_FLOOR}>
      <Chair sec={sec} expr={expr} zap={zap} strap={strap} />
    </Room>
    {zap > 0 && (Math.floor(sec * FPS) % 4 < 2) && <AbsoluteFill style={{ background: "#fff8c0", opacity: 0.25 * zap }} />}
  </Cam>
);

const SHOTS: [number, ShotFn][] = [
  // HOOK -----------------------------------------------------------------
  [0, (sec) => <PressCU sec={sec} press={1.2} volts={450} label="XXX" danger tremble={4} />],
  [T.pessoas, (sec) => <>
    <Cam a={T.pessoas} z0={1.05} z1={1.15}><Room wall={LAB_WALL} floor={LAB_FLOOR}>
      <Toon o={SCIENTIST} expr="stern" seed={7} h={1200} x={800} y={1320} />
      <Machine volts={180} x={60} y={1150} w={960} />
      <Toon o={HERO} expr="nervous" seed={3} h={1450} x={300} y={2100} look={0.6} />
    </Room></Cam>
    <Counter label="NEW HAVEN, EUA" value="1961" color="#ffd54a" since={T.pessoas} sec={sec} />
  </>],
  [T.choques, (sec) => { const z = zapAt(sec); return <>{learnerRoom(sec, "pained", z ? z.k : 0, [1.0, 1.1], T.choques)}{z && <Burst x={870} y={330} r={185} text="BZZT!" t={z.t} />}</>; }],
  [T.so, () => <Cam a={T.so} z0={1.1} z1={1.3} origin="50% 30%" punch={T.mandou}><Room wall={shadeHex(LAB_WALL, 0.9)} floor={LAB_FLOOR}>
    <Toon o={SCIENTIST} expr="stern" seed={7} h={2300} x={540} y={2500} /></Room></Cam>],
  // SETUP ----------------------------------------------------------------
  [T.ad, (sec) => {
    const slide = 1 - clamp01((sec - T.ad) / 0.25);
    return <Cam a={T.ad} z0={1.0} z1={1.12}><AbsoluteFill style={{ background: "#e8dcc2" }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 260, bottom: 760, background: "#f6efdf", border: `10px solid ${INK}`, borderRadius: 10, transform: `translateX(${slide * 1200}px) rotate(${-3 - slide * 15}deg)`, padding: 50, fontFamily: "Georgia, serif", color: "#2a2420" }}>
        <div style={{ fontSize: 46, borderBottom: "4px solid #2a2420", paddingBottom: 14 }}>NEW HAVEN REGISTER</div>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.05, marginTop: 40 }}>PROCURAM-SE VOLUNTÁRIOS</div>
        <div style={{ fontSize: 58, marginTop: 30 }}>Estudo sobre memória<br />Universidade Yale</div>
      </div>
      {sec >= T.quatro && <div style={{ position: "absolute", left: 160, top: 1000, fontFamily: "Arial Black", fontSize: 150, color: "#b8322c", border: "12px solid #b8322c", borderRadius: 20, padding: "0 30px",
        transform: `rotate(-12deg) scale(${sec - T.quatro < 0.12 ? 2.2 - 10 * (sec - T.quatro) : 1})`, opacity: 0.92 }}>US$ 4/H</div>}
      <Toon o={HERO} expr={sec >= T.quatro ? "grin" : "smile"} seed={3} h={1050} x={780} y={2060} look={-0.5} />
    </AbsoluteFill></Cam>;
  }],
  [T.voce, (sec) => <Cam a={T.voce} z0={1.0} z1={1.06}><Room wall={LAB_WALL} floor={LAB_FLOOR}>
    <div style={{ position: "absolute", left: 100, right: 100, top: 280, height: 600, background: "#b98a62", border: `10px solid ${INK}`, borderRadius: 8 }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: 50 + i * 205, top: 90, width: 130, height: 240, background: "#f3e2a8", border: `6px solid ${INK}` }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, textAlign: "center", fontFamily: "Georgia, serif", fontSize: 90, color: "#fff", WebkitTextStroke: `3px ${INK}`, paintOrder: "stroke" }}>YALE</div>
    </div>
    <Toon o={SCIENTIST} expr="smile_closed" seed={7} h={1250} x={780} y={1720} />
    <Toon o={HERO} expr="smile" seed={3} h={1250} x={300} y={1720} look={0.5} />
    <Tag text="PROFESSOR" x={300} y={1000} sec={sec} since={T.vira} />
  </Room></Cam>],
  [T.outro, (sec) => <>{learnerRoom(sec, "nervous", 0, [1.0, 1.12], T.outro, [], clamp01((sec - T.amarrado) / 0.7))}
    <Tag text="ALUNO" x={540} y={260} sec={sec} since={17.9} col="#9be7ff" />
  </>],
  // SAMPLE SHOCK ---------------------------------------------------------
  [T.antes, (sec) => <Cam a={T.antes} z0={1.0} z1={1.15} origin="50% 40%"><Room wall={LAB_WALL} floor={LAB_FLOOR}>
    <Toon o={HERO} expr={sec >= T.choque ? "nervous" : "neutral"} seed={3} h={1700} x={540} y={1900} look={-0.4} />
    <div style={{ position: "absolute", left: 160, top: 1200, width: 150, height: 60, background: "#9aa3a8", border: `7px solid ${INK}`, borderRadius: 14 }} />
  </Room></Cam>],
  [T.doi - 0.05, (sec) => { const z = zapAt(sec); return <Cam a={T.doi} z0={1.2} z1={1.2} origin="50% 40%"><Room wall={LAB_WALL} floor={LAB_FLOOR}>
    <Toon o={HERO} expr="pained" seed={3} h={1700} x={540} y={1900} zap={z ? z.k : 0} />
    {z && <Bolts x={240} y={400} w={600} h={1300} k={z.k} />}
  </Room>{z && <Burst x={760} y={420} r={200} text="AI!" t={z.t} />}<Counter label="CHOQUE DE AMOSTRA" value="45 V" color="#ffd54a" since={T.doi} sec={sec} top={1300} /></Cam>; }],
  // ESCALATION -----------------------------------------------------------
  [T.cada, (sec) => <Cam a={T.cada} z0={1.0} z1={1.1}><Room wall={LAB_WALL} floor={LAB_FLOOR}>
    <div style={{ position: "absolute", left: 660, top: 300, width: 420, height: 900, background: shadeHex(LAB_WALL, 0.82), borderLeft: `10px solid ${INK}` }} />
    <Toon o={SCIENTIST} expr="neutral" seed={7} h={1150} x={870} y={1300} look={-0.6} />
    <Toon o={HERO} expr="nervous" seed={3} h={1350} x={330} y={1720} look={0.8} />
    <Machine volts={0} x={40} y={1330} w={1000} hover={0} />
  </Room></Cam>],
  [T.forte - 0.2, (sec) => <PressCU sec={sec} press={T.v15} volts={15} label="LEVE" />],
  [T.v15 + 0.15, (sec) => { const z = zapAt(sec); return learnerRoom(sec, z ? "pained" : "nervous", z ? z.k : 0, [1.15, 1.2], T.v15); }],
  [T.v75 - 0.45, (sec) => <PressCU sec={sec} press={T.v75} volts={75} label="MODERADO" />],
  [T.v75 + 0.15, (sec) => { const z = zapAt(sec); return learnerRoom(sec, "pained", z ? z.k : 0, [1.2, 1.3], T.v75); }],
  [T.v150 - 0.4, (sec) => <PressCU sec={sec} press={T.v150} volts={150} label="FORTE" />],
  [T.v150 + 0.12, (sec) => { const z = zapAt(sec); return <>{learnerRoom(sec, "shock", z ? z.k : 0, [1.25, 1.45], T.v150, [T.grita])}{sec >= T.grita && <Burst x={190} y={420} r={170} text="ME SOLTA!" t={clamp01((sec - T.grita) / 1.2)} col="#ff8a7a" />}</>; }],
  // LOOK AT THE SCIENTIST --------------------------------------------------
  [T.olha, (sec) => <Cam a={T.olha} z0={1.0} z1={1.08}><Room wall={LAB_WALL} floor={LAB_FLOOR}>
    <Toon o={SCIENTIST} expr="stern" seed={7} h={1500} x={800} y={1500} />
    <Toon o={HERO} expr="nervous" seed={3} h={1700} x={250} y={2150} look={1} headTilt={-6} />
  </Room></Cam>],
  [T.cont - 0.6, () => <Cam a={T.cont - 0.6} z0={1.3} z1={1.45} origin="50% 28%" punch={T.cont}><Room wall={shadeHex(LAB_WALL, 0.85)} floor={LAB_FLOOR}>
    <Toon o={SCIENTIST} expr="stern" seed={7} h={2400} x={540} y={2600} breathe={false} /></Room></Cam>],
  // 300 V, BANG, SILENCE ---------------------------------------------------
  [T.v300 - 0.3, (sec) => <PressCU sec={sec} press={T.v300} volts={300} label="PERIGO" danger tremble={6} />],
  [T.v300 + 0.5, (sec) => { const z = zapAt(sec); return learnerRoom(sec, "shock", z ? z.k : 0, [1.3, 1.4], T.v300); }],
  [T.bang - 0.15, (sec) => <Cam a={T.bang} z0={1.0} z1={1.05} kicks={[T.bang, T.bang + 0.35]}><Room wall={LAB_WALL} floor={LAB_FLOOR}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 1000, background: shadeHex(LAB_WALL, 0.82), borderTop: `10px solid ${INK}`,
      transform: sec >= T.bang && sec < T.bang + 0.8 ? `translateX(${Math.sin(sec * 90) * 18}px)` : undefined }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 200 + i * 260, top: 300 + (i % 2) * 120, width: 120, height: 8, background: INK, transform: `rotate(${30 + i * 40}deg)`, opacity: sec >= T.bang ? 1 : 0 }} />)}
    </div>
    <Toon o={HERO} expr="shock" seed={3} h={1300} x={540} y={1900} />
  </Room>{sec >= T.bang && sec < T.bang + 1 && <Burst x={540} y={560} r={260} text="BAM!" t={(sec - T.bang)} col="#ff8a7a" />}</Cam>],
  [T.silence, (sec) => <Cam a={T.silence} z0={1.0} z1={1.25} origin="50% 40%"><Room wall={LAB_WALL} floor={LAB_FLOOR} lamp={false} dark={interpolate(sec, [T.silence, T.silence + 1.5], [0.1, 0.55], { extrapolateRight: "clamp" })}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 1000, background: shadeHex(LAB_WALL, 0.82), borderTop: `10px solid ${INK}` }} />
    <Toon o={HERO} expr="dazed" seed={3} h={1300} x={540} y={1900} breathe={false} />
  </Room><Counter label="DO OUTRO LADO" value="..." color="#c9d1d8" since={T.silence + 0.4} sec={sec} /></Cam>],
  [T.exige, () => <Cam a={T.exige} z0={1.35} z1={1.5} origin="50% 28%" punch={T.cont2}><Room wall={shadeHex(LAB_WALL, 0.8)} floor={LAB_FLOOR} dark={0.25}>
    <Toon o={SCIENTIST} expr="stern" seed={7} h={2400} x={540} y={2600} breathe={false} /></Room></Cam>],
  // VOTE -----------------------------------------------------------------
  [T.vote, (sec) => <PressCU sec={sec} press={999} volts={315} label="315 V ?" danger tremble={10} />],
  [T.aperta + 0.6, (sec) => <>
    <Cam a={T.aperta} z0={1.0} z1={1.06}><Room wall={shadeHex(LAB_WALL, 0.8)} floor={LAB_FLOOR} dark={0.4}>
      <Toon o={HERO} expr="nervous" seed={3} h={1300} x={540} y={1650} look={Math.sin(sec * 2.2) * 0.8} />
    </Room></Cam>
    <div style={{ position: "absolute", left: 60, right: 60, top: 1180, textAlign: "center", fontFamily: "Arial Black, Impact, Arial", color: "#fff", fontSize: 92, lineHeight: 1.05, WebkitTextStroke: `6px ${INK}`, paintOrder: "stroke" }}>
      VOCÊ APERTA O <span style={{ color: "#ffd54a" }}>PRÓXIMO BOTÃO?</span>
    </div>
    {([["A", "CONTINUO", T.optA, "#ff8a7a"], ["B", "PARO", T.optB, "#9be7a0"]] as const).map(([k, label, at, c], i) => {
      const t = sec - at;
      return <div key={k} style={{ position: "absolute", top: 1500, left: 70 + i * 490, width: 450, height: 150, background: t >= 0 ? c : "#f4f1ea", border: `8px solid ${INK}`, borderRadius: 26,
        display: "flex", alignItems: "center", gap: 24, padding: "0 28px", fontFamily: "Arial Black, Arial", fontSize: 50, color: INK,
        transform: `scale(${t < 0 ? 0.9 : t < 0.15 ? 1.25 - t : 1.1 - 0.1 * clamp01(t / 0.4)})`, opacity: t >= -0.05 ? 1 : 0.4 }}>
        <span style={{ width: 90, height: 90, borderRadius: 45, background: INK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{k}</span>{label}
      </div>;
    })}
    {sec >= T.coment && <Tag text="COMENTA 👇" x={540} y={1720} sec={sec} since={T.coment} col="#ffffff" />}
  </>],
  [T.part2, (sec, f) => <AbsoluteFill style={{ background: "#0f1220", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "#ffd54a", border: `10px solid ${INK}`, borderRadius: 20, padding: "20px 60px", fontFamily: "Arial Black, Impact, Arial", fontSize: 150, color: INK,
      transform: `scale(${interpolate(f, [s(T.part2), s(T.part2) + 6], [1.6, 1], { extrapolateRight: "clamp" })}) rotate(-3deg)` }}>PARTE 2</div>
    <div style={{ marginTop: 60, fontFamily: "Arial Black, Arial", fontSize: 64, color: "#fff", textAlign: "center", opacity: clamp01((sec - 53.8) / 0.3) }}>O que as pessoas<br />de verdade fizeram</div>
  </AbsoluteFill>],
];

export const MilgramP1: React.FC = () => {
  const f = useCurrentFrame(), sec = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && sec >= SHOTS[i + 1][0]) i++;
  const start = SHOTS[i][0], since = sec - start;
  // transitions: 2-frame white flash on every zap start, whip blur on the first 3 frames of setup shots
  const zapFlash = ZAPS.some(([a]) => f >= s(a) && f < s(a) + 2);
  const whip = since < 0.1 && [T.ad, T.voce, T.olha, T.vote, T.antes].includes(start);
  return (
    <AbsoluteFill style={{ background: "#0f1220", overflow: "hidden" }}>
      <Audio src={staticFile("milgram/voice.mp3")} />
      <Audio src={staticFile("milgram/fx.wav")} />
      <AbsoluteFill style={{ filter: whip ? "blur(14px)" : undefined, transform: whip ? `translateX(${(1 - since / 0.1) * 160}px)` : undefined }}>{SHOTS[i][1](sec, f)}</AbsoluteFill>
      {zapFlash && <AbsoluteFill style={{ background: "#ffffff", opacity: 0.85 }} />}
    </AbsoluteFill>
  );
};

export { Toon, Bolts, Burst, Room, Counter, Tag, Cam, Chair, PressCU, HERO, SCIENTIST, LEARNER, LAB_WALL, LAB_FLOOR, ROOM2_WALL, shadeHex, clamp01, rnd, s };
