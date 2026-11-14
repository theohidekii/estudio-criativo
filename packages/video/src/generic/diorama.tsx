// Pacote de estilo "Natan Madeira 3D": diorama 3D de poucos polígonos visto de cima. A câmera visita "estações" (hexágonos numa trilha),
// personagens de bloco sem rosto andam entre elas, objetos aparecem e ficam, etiquetas em pílula nomeiam cada elemento, a legenda mostra
// uma palavra por vez e o vídeo fecha com "PARABÉNS!". Linguagem visual própria, em three.js (react-three-fiber).
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import type { Cena, Cenas, Etiqueta3D, Fecho, Legenda, Objeto3D, Personagem3D } from "./tipos";

const FPS = 30;
const PASSO = 6.0; // distância entre estações (eixo z)
const RAIO = 2.6;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const suave = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rng = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

/** Posição da estação i no mundo: trilha em zigue-zague descendo o eixo z. */
export const estacaoPos = (i: number): [number, number] => [i % 2 === 0 ? -1.2 : 1.2, -i * PASSO];

type Cam = { pos: THREE.Vector3; alvo: THREE.Vector3 };
const DIST = { aberto: 22, medio: 17, close: 13.5 } as const;

/** Estado da câmera no instante `sec`: voa suavemente (0,9 s) da estação anterior para a da cena atual. */
export function camera(cenas: Cenas, sec: number): Cam {
  const lista = cenas.cenas;
  let i = 0;
  for (let k = 0; k < lista.length; k++) if (sec >= lista[k].inicio) i = k;
  const alvoDe = (c: Cena) => { const [x, z] = estacaoPos(c.estacao ?? 0); return new THREE.Vector3(x * 0.9, 0.6, z); };
  const distDe = (c: Cena) => DIST[c.plano ?? "medio"];
  const atual = lista[i], ant = lista[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : suave(clamp01((sec - atual.inicio) / 0.9));
  const alvo = alvoDe(ant).lerp(alvoDe(atual), p);
  const dist = lerp(distDe(ant), distDe(atual), p) - 0.4 * clamp01((sec - atual.inicio) / 4); // push-in lento
  const el = (52 * Math.PI) / 180, giro = Math.sin(sec * 0.35) * 0.07;
  const pos = new THREE.Vector3(alvo.x + Math.sin(giro) * dist, alvo.y + Math.sin(el) * dist, alvo.z + Math.cos(el) * dist * Math.cos(giro));
  return { pos, alvo };
}

/** Projeta um ponto do mundo para pixels da tela 1080x1920, com a mesma câmera do canvas. */
function paraTela(c: Cam, ponto: THREE.Vector3): [number, number] {
  const cam = new THREE.PerspectiveCamera(38, 1080 / 1920, 0.2, 400);
  cam.position.copy(c.pos); cam.lookAt(c.alvo); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const v = ponto.clone().project(cam);
  return [(v.x * 0.5 + 0.5) * 1080, (-v.y * 0.5 + 0.5) * 1920];
}

// ---------- peças 3D ----------
const M: React.FC<{ c: string }> = ({ c }) => <meshStandardMaterial color={c} flatShading roughness={0.9} />;
const Caixa: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number] }> = ({ p, s, c, r }) => (
  <mesh position={p} rotation={r}><boxGeometry args={s} /><M c={c} /></mesh>
);
const Cil: React.FC<{ p: [number, number, number]; r: number; h: number; c: string; seg?: number }> = ({ p, r, h, c, seg = 10 }) => (
  <mesh position={p}><cylinderGeometry args={[r, r, h, seg]} /><M c={c} /></mesh>
);
const Cone: React.FC<{ p: [number, number, number]; r: number; h: number; c: string }> = ({ p, r, h, c }) => (
  <mesh position={p}><coneGeometry args={[r, h, 7]} /><M c={c} /></mesh>
);
const Anel: React.FC<{ p: [number, number, number]; r: number; t: number; c: string; rot?: [number, number, number] }> = ({ p, r, t, c, rot }) => (
  <mesh position={p} rotation={rot}><torusGeometry args={[r, t, 6, 14]} /><M c={c} /></mesh>
);

const Arvore: React.FC<{ x: number; z: number; e: number }> = ({ x, z, e }) => (
  <group position={[x, 0, z]} scale={e}>
    <Caixa p={[0, 0.5, 0]} s={[0.4, 1, 0.4]} c="#7a5230" />
    <Cone p={[0, 1.7, 0]} r={1.1} h={1.8} c="#3a9a45" />
    <Cone p={[0, 2.6, 0]} r={0.8} h={1.5} c="#47ad4f" />
  </group>
);

const Objeto: React.FC<{ o: Objeto3D; sec: number; inicio: number }> = ({ o, sec, inicio }) => {
  const k = sec - inicio - (o.aparece ?? 0);
  if (k < 0) return null;
  const [ex, ez] = estacaoPos(o.estacao);
  const e = (o.escala ?? 1) * (k >= 0.4 ? 1 : 1 + 0.3 * Math.sin((k / 0.4) * Math.PI)) * clamp01(k / 0.12 + 0.01);
  const c = o.cor;
  let corpo: React.ReactNode;
  switch (o.tipo) {
    case "quadro": corpo = <><Caixa p={[-0.95, 0.9, 0]} s={[0.12, 1.8, 0.12]} c="#6b4a2c" /><Caixa p={[0.95, 0.9, 0]} s={[0.12, 1.8, 0.12]} c="#6b4a2c" /><Caixa p={[0, 1.35, 0]} s={[2, 1.3, 0.12]} c={c ?? "#2c4a7a"} />{[0.35, 0, -0.35].map((y, i) => <Caixa key={i} p={[0, 1.35 + y, 0.08]} s={[1.5 - i * 0.3, 0.1, 0.02]} c="#f4f1e8" />)}</>; break;
    case "tela": corpo = <><Caixa p={[0, 0.5, 0]} s={[0.25, 1, 0.25]} c="#4a4e56" /><Caixa p={[0, 1.4, 0]} s={[1.8, 1.1, 0.12]} c="#2a2a30" /><Caixa p={[0, 1.4, 0.07]} s={[1.6, 0.9, 0.02]} c={c ?? "#e8eef5"} /><Caixa p={[-0.3, 1.5, 0.09]} s={[0.8, 0.14, 0.02]} c="#7b5cd6" /><Caixa p={[-0.1, 1.25, 0.09]} s={[1.2, 0.14, 0.02]} c="#3fb26a" /></>; break;
    case "moeda": corpo = <>{[0, 1, 2].map((i) => <Cil key={i} p={[i === 2 ? 0.5 : 0, 0.1 + i * 0.18, 0]} r={0.55} h={0.16} c={c ?? "#f4c542"} seg={16} />)}</>; break;
    case "porta": corpo = <><Caixa p={[0, 1, 0]} s={[1.2, 2, 0.22]} c="#4a2f1c" /><Caixa p={[0, 0.95, 0.12]} s={[0.95, 1.8, 0.06]} c={c ?? "#8a5a34"} /><Cil p={[0.32, 1, 0.2]} r={0.07} h={0.08} c="#f4c542" /></>; break;
    case "chave": corpo = <><Anel p={[0, 1.2, 0]} r={0.45} t={0.14} c={c ?? "#f4c542"} /><Caixa p={[0, 0.5, 0]} s={[0.16, 1, 0.16]} c={c ?? "#f4c542"} /><Caixa p={[0.18, 0.2, 0]} s={[0.3, 0.14, 0.16]} c={c ?? "#f4c542"} /></>; break;
    case "mesa": corpo = <><Caixa p={[0, 0.85, 0]} s={[2, 0.14, 1.1]} c={c ?? "#a8744a"} />{[[-0.9, -0.45], [0.9, -0.45], [-0.9, 0.45], [0.9, 0.45]].map(([x, z], i) => <Caixa key={i} p={[x, 0.42, z]} s={[0.14, 0.85, 0.14]} c="#7a5230" />)}</>; break;
    case "placa": corpo = <><Caixa p={[0, 0.8, 0]} s={[0.14, 1.6, 0.14]} c="#6b4a2c" /><Caixa p={[0, 1.6, 0.05]} s={[1.5, 0.9, 0.1]} c={c ?? "#f4c542"} /></>; break;
    case "arvore": corpo = <Arvore x={0} z={0} e={0.8} />; break;
    case "cadeado": corpo = <><Anel p={[0, 1.15, 0]} r={0.38} t={0.1} c="#b8bcc6" /><Caixa p={[0, 0.55, 0]} s={[1, 0.85, 0.45]} c={c ?? "#f4c542"} /><Caixa p={[0, 0.55, 0.24]} s={[0.12, 0.3, 0.04]} c="#4a3a10" /></>; break;
    case "cofre": corpo = <><Caixa p={[0, 0.55, 0]} s={[1.4, 1.1, 1]} c={c ?? "#44464f"} /><Cil p={[0, 0.6, 0.52]} r={0.28} h={0.1} c="#f4c542" seg={14} /></>; break;
    case "bandeira": corpo = <><Caixa p={[0, 1, 0]} s={[0.1, 2, 0.1]} c="#6b4a2c" /><Caixa p={[0.5, 1.7, 0]} s={[1, 0.6, 0.05]} c={c ?? "#e0483a"} /></>; break;
    default: corpo = <Caixa p={[0, 0.5, 0]} s={[1, 1, 1]} c={c ?? "#c8864a"} />;
  }
  return <group position={[ex + o.dx, 0.25, ez + o.dz]} rotation={[0, ((o.rotacao ?? 0) * Math.PI) / 180, 0]} scale={e}>{corpo}</group>;
};

/** Personagem de bloco sem rosto. Anda com pernas e braços balançando; também acena e comemora. */
const Bloco: React.FC<{ p: Personagem3D; pos: [number, number]; sec: number; anda: boolean; olha: number; escala: number }> = ({ p, pos, sec, anda, olha, escala }) => {
  const t = sec * 10;
  const bal = anda ? Math.sin(t) * 0.7 : 0;
  const acao = anda ? "andar" : p.acao ?? "parado";
  const pulo = acao === "comemorar" ? Math.abs(Math.sin(sec * 7)) * 0.45 : anda ? Math.abs(Math.sin(t)) * 0.08 : Math.sin(sec * 2.2 + pos[0]) * 0.03;
  const bracoD = acao === "acenar" ? -2.6 + Math.sin(sec * 9) * 0.5 : acao === "comemorar" ? -2.8 : -bal;
  const bracoE = acao === "comemorar" ? -2.8 : bal;
  return (
    <group position={[pos[0], 0.25 + pulo, pos[1]]} rotation={[0, olha, 0]} scale={escala}>
      <group position={[-0.17, 0.55, 0]} rotation={[bal, 0, 0]}><Caixa p={[0, -0.27, 0]} s={[0.24, 0.55, 0.28]} c={p.calca ?? "#2c3a66"} /></group>
      <group position={[0.17, 0.55, 0]} rotation={[-bal, 0, 0]}><Caixa p={[0, -0.27, 0]} s={[0.24, 0.55, 0.28]} c={p.calca ?? "#2c3a66"} /></group>
      <Caixa p={[0, 0.95, 0]} s={[0.66, 0.8, 0.42]} c={p.camisa} />
      <group position={[-0.44, 1.28, 0]} rotation={[bracoE, 0, 0]}><Caixa p={[0, -0.3, 0]} s={[0.18, 0.62, 0.2]} c={p.camisa} /></group>
      <group position={[0.44, 1.28, 0]} rotation={[bracoD, 0, 0]}><Caixa p={[0, -0.3, 0]} s={[0.18, 0.62, 0.2]} c={p.camisa} /></group>
      <Caixa p={[0, 1.62, 0]} s={[0.52, 0.5, 0.5]} c={p.pele ?? "#e8b88c"} />
      <Caixa p={[0, 1.9, 0]} s={[0.56, 0.2, 0.54]} c={p.cabelo ?? "#3a2a20"} />
    </group>
  );
};

type Estado = { id: string; def: Personagem3D; pos: [number, number]; anda: boolean; olha: number; k: number };
/** Posição de cada personagem no instante `sec`: cada cena que cita o id define um novo destino, alcançado em 1,1 s. */
function personagensEm(cenas: Cenas, sec: number): Estado[] {
  const hist = new Map<string, { def: Personagem3D; t: number; pos: [number, number] }[]>();
  for (const c of cenas.cenas) {
    if (c.inicio > sec) break;
    for (const q of c.personagens3d ?? []) {
      const [ex, ez] = estacaoPos(q.estacao ?? c.estacao ?? 0);
      const lista = hist.get(q.id) ?? [];
      lista.push({ def: q, t: c.inicio, pos: [ex + q.dx, ez + q.dz] });
      hist.set(q.id, lista);
    }
  }
  const out: Estado[] = [];
  hist.forEach((l, id) => {
    const ult = l[l.length - 1], ant = l.length > 1 ? l[l.length - 2] : null;
    const k = sec - ult.t;
    const p = ant ? suave(clamp01(k / 1.1)) : 1;
    const pos: [number, number] = ant ? [lerp(ant.pos[0], ult.pos[0], p), lerp(ant.pos[1], ult.pos[1], p)] : ult.pos;
    const dx = ant ? ult.pos[0] - ant.pos[0] : 0, dz = ant ? ult.pos[1] - ant.pos[1] : 0;
    const anda = !!ant && p < 1 && Math.hypot(dx, dz) > 0.2;
    out.push({ id, def: ult.def, pos, anda, olha: anda ? Math.atan2(dx, dz) : 0, k });
  });
  return out;
}

const Mundo: React.FC<{ cenas: Cenas; sec: number; cam: Cam }> = ({ cenas, sec, cam }) => {
  const { camera: cam3, gl, advance, frameloop } = useThree();
  const maxEst = Math.max(3, ...cenas.cenas.map((c) => c.estacao ?? 0)) + 2;
  // Câmera do canvas = a mesma do overlay de etiquetas.
  const pc = cam3 as THREE.PerspectiveCamera;
  pc.position.copy(cam.pos); pc.lookAt(cam.alvo); pc.updateMatrixWorld();
  // Com frameloop "never" o primeiro quadro pode sair em branco: segura o render até o canvas ter desenhado de verdade.
  const [firstDraw] = useState(() => delayRender("diorama first draw"));
  const drawn = useRef(0);
  useEffect(() => {
    if (frameloop === "never" && gl.info.render.frame === drawn.current) advance(performance.now());
    drawn.current = gl.info.render.frame;
    if (frameloop !== "never" || drawn.current > 0) continueRender(firstDraw);
  });
  useEffect(() => () => continueRender(firstDraw), [firstDraw]);

  const ate = Math.max(...cenas.cenas.map((c) => c.estacao ?? 0), 1);
  const estacoes = Array.from({ length: ate + 2 }, (_, i) => i);
  const arvores = Array.from({ length: 90 }, (_, k) => ({ x: (rng(k + 1) - 0.5) * 80, z: 14 - rng(k + 200) * (PASSO * maxEst + 50), e: 0.7 + rng(k + 400) * 0.9 })).filter((a) => Math.abs(a.x) > 4.8);
  const nuvens = Array.from({ length: 9 }, (_, k) => ({ x: ((rng(k + 7) - 0.5) * 70 + sec * 0.6 * (k % 2 ? 1 : -1) + 100) % 70 - 35, y: 10 + rng(k + 30) * 5, z: -rng(k + 60) * PASSO * maxEst, e: 1.2 + rng(k + 90) * 1.6 }));
  return (
    <>
      <color attach="background" args={["#74bdf0"]} />
      <fog attach="fog" args={["#cfe9f7", 28, 85]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#ffffff", "#8dd25f", 0.45]} />
      <directionalLight position={[8, 16, 10]} intensity={1.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -PASSO * maxEst * 0.5]}><planeGeometry args={[240, 240 + PASSO * maxEst * 2]} /><M c="#8dd25f" /></mesh>
      {arvores.map((a, i) => <Arvore key={i} x={a.x} z={a.z} e={a.e} />)}
      {nuvens.map((n, i) => (
        <group key={i} position={[n.x, n.y, n.z]} scale={n.e}>
          <mesh><sphereGeometry args={[1.1, 7, 6]} /><meshStandardMaterial color="#ffffff" flatShading /></mesh>
          <mesh position={[1.1, -0.15, 0]}><sphereGeometry args={[0.8, 7, 6]} /><meshStandardMaterial color="#ffffff" flatShading /></mesh>
          <mesh position={[-1, -0.2, 0.1]}><sphereGeometry args={[0.75, 7, 6]} /><meshStandardMaterial color="#ffffff" flatShading /></mesh>
        </group>
      ))}
      {estacoes.map((i) => {
        const [x, z] = estacaoPos(i), [x2, z2] = estacaoPos(i + 1);
        return (
          <group key={i}>
            <mesh position={[x, 0.05, z]} rotation={[0, Math.PI / 6, 0]}><cylinderGeometry args={[RAIO + 0.12, RAIO + 0.12, 0.3, 6]} /><M c="#d9c9b2" /></mesh>
            <mesh position={[x, 0.2, z]} rotation={[0, Math.PI / 6, 0]}><cylinderGeometry args={[RAIO, RAIO, 0.2, 6]} /><M c="#f3e8d8" /></mesh>
            <mesh position={[(x + x2) / 2, 0.12, (z + z2) / 2]} rotation={[0, Math.PI / 6, 0]}><cylinderGeometry args={[1.25, 1.25, 0.16, 6]} /><M c="#ece1cf" /></mesh>
          </group>
        );
      })}
      {cenas.cenas.flatMap((c, ci) => (c.inicio <= sec ? (c.objetos3d ?? []).map((o, oi) => <Objeto key={`${ci}-${oi}`} o={{ ...o, estacao: o.estacao ?? c.estacao ?? 0 }} sec={sec} inicio={c.inicio} />) : []))}
      {personagensEm(cenas, sec).map((e) => <Bloco key={e.id} p={e.def} pos={e.pos} sec={sec} anda={e.anda} olha={e.olha} escala={clamp01(e.k / 0.3 + 0.001)} />)}
    </>
  );
};

/** Etiqueta em pílula branca com ponto verde, presa a um ponto do mundo. */
const Pilula: React.FC<{ t: Etiqueta3D; x: number; y: number; k: number }> = ({ t, x, y, k }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) translateY(${Math.sin(k * 2.4) * -5}px) scale(${clamp01(k / 0.18)})`, display: "flex", alignItems: "center", gap: 12,
    background: "#fff", border: "3px solid #1a1d24", borderRadius: 40, padding: "8px 26px 8px 18px", fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 34, color: "#111", whiteSpace: "nowrap", boxShadow: "0 6px 0 rgba(0,0,0,.18)" }}>
    <span style={{ width: 15, height: 15, borderRadius: "50%", background: "#2fbf5a" }} />{t.texto}
  </div>
);

const LegendaPalavra: React.FC<{ sec: number; legendas?: Legenda[] }> = ({ sec, legendas }) => {
  const l = legendas?.find((x) => sec >= x.inicio && sec < Math.max(x.fim, x.inicio + 0.15));
  if (!l) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1180, textAlign: "center", fontFamily: '"Arial Black", Arial, sans-serif', fontSize: 124, lineHeight: 1, color: "#fff", WebkitTextStroke: "15px #14161c", paintOrder: "stroke", transform: `scale(${1 + 0.12 * (1 - clamp01((sec - l.inicio) / 0.1))})` }}>{l.texto}</div>
  );
};

const FechoCartao: React.FC<{ f: Fecho; k: number }> = ({ f, k }) => {
  const partes = f.destaque && f.texto.includes(f.destaque) ? f.texto.split(f.destaque) : [f.texto];
  return (
    <AbsoluteFill style={{ background: `rgba(10,14,24,${0.55 * clamp01(k / 0.4)})`, justifyContent: "center", alignItems: "center", textAlign: "center", padding: 60 }}>
      <div style={{ transform: `scale(${clamp01(k / 0.25) * (1 + 0.08 * Math.sin(clamp01(k / 0.5) * Math.PI))})` }}>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 150, lineHeight: 1, color: "#ffd23f", WebkitTextStroke: "14px #14161c", paintOrder: "stroke" }}>{f.titulo}</div>
        <div style={{ marginTop: 34, fontFamily: '"Arial Black", Arial, sans-serif', fontSize: 62, lineHeight: 1.12, color: "#fff", WebkitTextStroke: "10px #14161c", paintOrder: "stroke" }}>
          {partes.length === 2 ? <>{partes[0]}<span style={{ color: "#ffd23f" }}>{f.destaque}</span>{partes[1]}</> : f.texto}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Diorama: React.FC<{ cenas: Cenas; audio?: string }> = ({ cenas, audio }) => {
  const f = useCurrentFrame(), sec = f / FPS;
  const cam = camera(cenas, sec);
  const lista = cenas.cenas;
  let i = 0;
  for (let k = 0; k < lista.length; k++) if (sec >= lista[k].inicio) i = k;
  const c = lista[i];
  const fim = cenas.duracao;
  const fade = interpolate(f, [Math.round(fim * FPS) - 15, Math.round(fim * FPS)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const src = audio ? (/^(https?:)?\//.test(audio) ? audio : staticFile(audio)) : undefined;
  // etiquetas: as das cenas já iniciadas que estão na estação atual
  const etiquetas = lista.flatMap((cc) => (cc.inicio <= sec ? (cc.etiquetas3d ?? []).filter((t) => (t.estacao ?? cc.estacao ?? 0) === (c.estacao ?? 0)).map((t) => ({ t, k: sec - cc.inicio - (t.aparece ?? 0) })) : []));
  return (
    <AbsoluteFill style={{ background: "#74bdf0", opacity: fade }}>
      {src && <Audio src={src} />}
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }} camera={{ fov: 38, near: 0.2, far: 400, position: [0, 10, 12] }}>
        <Mundo cenas={cenas} sec={sec} cam={cam} />
      </ThreeCanvas>
      {(c.fecho ? [] : etiquetas).filter((e) => e.k >= 0).map(({ t, k }, j) => {
        const [ex, ez] = estacaoPos(t.estacao ?? c.estacao ?? 0);
        const [px, py] = paraTela(cam, new THREE.Vector3(ex + t.dx, t.altura, ez + t.dz));
        return <Pilula key={j} t={t} x={px} y={py} k={k} />;
      })}
      {!c.fecho && <LegendaPalavra sec={sec} legendas={cenas.legendas} />}
      {c.fecho && <FechoCartao f={c.fecho} k={sec - c.inicio} />}
    </AbsoluteFill>
  );
};
