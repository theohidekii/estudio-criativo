// Composição genérica: desenha um vídeo a partir do JSON de cenas (personagens, textos, cenário, câmera) + narração.
// O campo `estilo` escolhe o pacote visual (clássico ou Volta por Cima).
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INK, Outfit } from "../videos/bridge/toon";
import { Cam, Room, Tag, Toon } from "../videos/milgram/Milgram";
import type { Cena, Cenas, Roupa, Texto } from "./tipos";
import { CenarioBiblia, FaixaBiblia, IconeBiblia, LegendaBiblia, ReferenciaBiblia, SeloBiblia } from "./biblia";
import { CenarioCinema, LegendaCinema, ObjetoCinema } from "./matrixxtz";
import { AnotacaoMundo, CenarioMundo, FiltrosMundo, IconeGiz, LegendaMundo } from "./mundo";
import { AdesivoVPC, CelularVPC, CenarioVPC, HudVPC, LegendaVPC, Pilula, Titulo, hudDaCena } from "./vpc";

const FPS = 30;
export type GenericoProps = { cenas: Cenas; audio?: string };

const paraOutfit = (r: Roupa): Outfit => ({
  jacket: r.jacket, pants: r.pants, boots: r.boots ?? INK, hat: r.hat ?? "hair", hair: r.hair, cap: r.cap, skin: r.skin, glasses: r.glasses, build: r.build, dress: r.tunica, moustache: r.barba,
});

const Grande: React.FC<{ t: Texto; sec: number }> = ({ t, sec }) => {
  const k = sec - (t.aparece ?? 0);
  if (k < 0) return null;
  const sc = k < 0.15 ? 0.6 + 2.7 * k : 1;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: t.y, textAlign: "center", fontFamily: "Arial Black", fontSize: t.tamanho, color: t.cor, lineHeight: 1.05,
      WebkitTextStroke: `${Math.max(8, t.tamanho / 8)}px ${INK}`, paintOrder: "stroke", transform: `scale(${sc})`, transformOrigin: "50% 50%" }}>{t.texto}</div>
  );
};

const Fundo: React.FC<{ c: Cena; children: React.ReactNode }> = ({ c, children }) => {
  const { tipo, cor, piso } = c.cenario;
  if (tipo === "sala") return <Room wall={cor ?? "#9fb6b0"} floor={piso ?? "#8a7a66"}>{children}</Room>;
  if (tipo === "parque") return <Room wall={cor ?? "#6f9aa6"} floor={piso ?? "#5b7f55"} lamp={false}>{children}</Room>;
  const bg = tipo === "cor" ? (cor ?? "#2a2f45") : "linear-gradient(#10172b,#070912)";
  return <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>;
};

export const Generico: React.FC<GenericoProps> = ({ cenas, audio }) => {
  const f = useCurrentFrame(), sec = f / FPS;
  const lista = cenas.cenas;
  let i = 0;
  for (let k = 0; k < lista.length; k++) if (sec >= lista[k].inicio) i = k;
  const c = lista[i];
  const local = sec - c.inicio;
  const fim = cenas.duracao;
  const fade = interpolate(f, [Math.round(fim * FPS) - 15, Math.round(fim * FPS)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const src = audio ? (/^(https?:)?\//.test(audio) ? audio : staticFile(audio)) : undefined;
  const vpc = cenas.estilo === "volta-por-cima";
  const personagens = c.personagens.map((p, j) => (
    <Toon key={`${i}-${j}`} o={paraOutfit(p.roupa)} expr={p.expr} seed={p.seed ?? j + 1} h={p.altura} x={p.x} y={p.y} mode={p.modo} flip={p.flip} />
  ));

  if (cenas.estilo === "matrixxtz-2d") {
    const origem = c.origem ? `${c.origem[0]}% ${c.origem[1]}%` : "50% 50%";
    return (
      <AbsoluteFill style={{ background: "#000", opacity: fade }}>
        {src && <Audio src={src} />}
        <CenarioCinema c={c}>
          <Cam a={c.inicio} z0={c.zoom?.[0] ?? 1} z1={c.zoom?.[1] ?? 1.1} origin={origem} noZap>
            <AbsoluteFill style={{ filter: "drop-shadow(8px -2px 0 rgba(255,214,150,.28)) drop-shadow(0 14px 18px rgba(20,10,4,.4))" }}>{personagens}</AbsoluteFill>
            {(c.objetos ?? []).map((o, j) => <ObjetoCinema key={`o${i}-${j}`} o={o} sec={local} />)}
          </Cam>
        </CenarioCinema>
        <LegendaCinema sec={sec} legendas={cenas.legendas} destaques={cenas.destaques} />
        {c.flash && local < 2 / FPS && <AbsoluteFill style={{ background: "#fff", opacity: 0.8 }} />}
      </AbsoluteFill>
    );
  }

  if (cenas.estilo === "mundo-oculto") {
    return (
      <AbsoluteFill style={{ background: "#000", opacity: fade }}>
        {src && <Audio src={src} />}
        <FiltrosMundo />
        <CenarioMundo c={c}>
          <AbsoluteFill style={{ filter: "url(#tremor)" }}>
            <Cam a={c.inicio} z0={c.zoom?.[0] ?? 1} z1={c.zoom?.[1] ?? 1.05} noZap>
              <AbsoluteFill style={{ filter: "url(#giz)" }}>{personagens}</AbsoluteFill>
            </Cam>
            {(c.icones ?? []).map((ic, j) => <IconeGiz key={`i${i}-${j}`} i={ic} sec={local} />)}
            {c.textos.map((t, j) => <AnotacaoMundo key={`${i}-${j}`} t={t} sec={local} />)}
          </AbsoluteFill>
        </CenarioMundo>
        <LegendaMundo sec={sec} legendas={cenas.legendas} destaques={cenas.destaques} />
        {c.flash && local < 2 / FPS && <AbsoluteFill style={{ background: "#fff", opacity: 0.8 }} />}
      </AbsoluteFill>
    );
  }

  if (cenas.estilo === "biblia-animada") {
    return (
      <AbsoluteFill style={{ background: "#000", opacity: fade }}>
        {src && <Audio src={src} />}
        <CenarioBiblia c={c}>
          <Cam a={c.inicio} z0={c.zoom?.[0] ?? 1} z1={c.zoom?.[1] ?? 1.05} noZap>{personagens}</Cam>
          {(c.icones ?? []).map((ic, j) => <IconeBiblia key={`i${i}-${j}`} i={ic} sec={local} />)}
          {c.textos.map((t, j) => t.estilo === "grande" ? <FaixaBiblia key={`${i}-${j}`} t={t} sec={local} /> : <SeloBiblia key={`${i}-${j}`} t={t} sec={local} />)}
          {c.referencia && <ReferenciaBiblia texto={c.referencia} sec={local} />}
        </CenarioBiblia>
        <LegendaBiblia sec={sec} legendas={cenas.legendas} destaques={cenas.destaques} />
        {c.flash && local < 2 / FPS && <AbsoluteFill style={{ background: "#fff", opacity: 0.8 }} />}
      </AbsoluteFill>
    );
  }

  if (vpc) {
    const hud = hudDaCena(lista, i);
    return (
      <AbsoluteFill style={{ background: "#000", opacity: fade }}>
        {src && <Audio src={src} />}
        <CenarioVPC c={c}>
          <Cam a={c.inicio} z0={c.zoom?.[0] ?? 1} z1={c.zoom?.[1] ?? 1.06} noZap>{personagens}</Cam>
          {c.celular && <CelularVPC c={c.celular} sec={local} />}
          {c.textos.map((t, j) => t.estilo === "grande" ? <Titulo key={`${i}-${j}`} t={t} sec={local} /> : <Pilula key={`${i}-${j}`} t={t} sec={local} />)}
          {(c.adesivos ?? []).map((a, j) => <AdesivoVPC key={`a${i}-${j}`} a={a} sec={local} />)}
        </CenarioVPC>
        {hud && <HudVPC h={hud} />}
        <LegendaVPC sec={sec} legendas={cenas.legendas} destaques={cenas.destaques} />
        {c.flash && local < 2 / FPS && <AbsoluteFill style={{ background: "#fff", opacity: 0.8 }} />}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "#000", opacity: fade }}>
      {src && <Audio src={src} />}
      <Fundo c={c}>
        <Cam a={c.inicio} z0={c.zoom?.[0] ?? 1} z1={c.zoom?.[1] ?? 1.08} noZap>{personagens}</Cam>
        {c.textos.map((t, j) => t.estilo === "grande"
          ? <Grande key={`${i}-${j}`} t={t} sec={local} />
          : <Tag key={`${i}-${j}`} text={t.texto} x={t.x} y={t.y} sec={local} since={t.aparece ?? 0} col={t.cor} />)}
      </Fundo>
      {c.flash && local < 2 / FPS && <AbsoluteFill style={{ background: "#fff", opacity: 0.8 }} />}
    </AbsoluteFill>
  );
};
