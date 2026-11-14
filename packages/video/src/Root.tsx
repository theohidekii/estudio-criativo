import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { MilgramP1, MILGRAM_FRAMES } from "./videos/milgram/Milgram";
import { MilgramP2, MILGRAM2_FRAMES } from "./videos/milgram/Milgram2";
import { TermanP1, TERMAN_FRAMES } from "./videos/milgram/Terman";
import { TempoP1, TEMPO_FRAMES } from "./videos/milgram/Tempo";
import { MarshallP1, MARSHALL_FRAMES } from "./videos/milgram/Marshall";
import { ManiacoP1, MANIACO_FRAMES } from "./videos/milgram/Maniaco";
import { DanielP1, DANIEL_FRAMES } from "./videos/milgram/Daniel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MilgramP1"
        component={MilgramP1}
        durationInFrames={MILGRAM_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="MilgramP2" component={MilgramP2} durationInFrames={MILGRAM2_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TermanP1" component={TermanP1} durationInFrames={TERMAN_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TempoP1" component={TempoP1} durationInFrames={TEMPO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="MarshallP1" component={MarshallP1} durationInFrames={MARSHALL_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="ManiacoP1" component={ManiacoP1} durationInFrames={MANIACO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="DanielP1" component={DanielP1} durationInFrames={DANIEL_FRAMES} fps={30} width={1080} height={1920} />
    </>
  );
};
