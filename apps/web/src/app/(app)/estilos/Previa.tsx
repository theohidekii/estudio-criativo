"use client";
import { Player } from "@remotion/player";
import { Generico } from "@estudio/video/src/generic/Generico";
import { AMOSTRA_BIBLIA, AMOSTRA_CINEMA, AMOSTRA_CLASSICO, AMOSTRA_MUNDO, AMOSTRA_VPC } from "@estudio/video/src/generic/amostras";

/** Pré-visualização animada de um estilo, com as cenas de exemplo. */
export default function Previa({ estilo }: { estilo: string }) {
  const cenas = estilo === "volta-por-cima" ? AMOSTRA_VPC : estilo === "biblia-animada" ? AMOSTRA_BIBLIA : estilo === "mundo-oculto" ? AMOSTRA_MUNDO : estilo === "matrixxtz-2d" ? AMOSTRA_CINEMA : AMOSTRA_CLASSICO;
  return (
    <Player
      component={Generico}
      inputProps={{ cenas, audio: undefined }}
      durationInFrames={Math.round(cenas.duracao * 30)}
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{ width: 240, border: "1px solid var(--linha-forte)" }}
      controls
      loop
      acknowledgeRemotionLicense
    />
  );
}
