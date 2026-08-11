import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import captions from "./captions.json";
import { C } from "./theme";
import { DripLogo, FONT_MONO, FONT_SANS, Grid } from "./ui";
import { S1 } from "./segments/S1";
import { S2 } from "./segments/S2";
import { S3 } from "./segments/S3";
import { S4 } from "./segments/S4";
import { S5 } from "./segments/S5";
import { S6 } from "./segments/S6";
import { S7 } from "./segments/S7";
import { S8 } from "./segments/S8";

const SEGMENTS: Record<string, React.FC> = {
  s1: S1,
  s2: S2,
  s3: S3,
  s4: S4,
  s5: S5,
  s6: S6,
  s7: S7,
  s8: S8,
};

const Header: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "26px 44px",
      zIndex: 10,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <DripLogo size={44} />
      <div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: C.paper }}>
          DRIP
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, color: C.muted }}>
          XRP SUBSCRIPTION STREAMING
        </div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: C.acid,
          boxShadow: "0 0 12px rgba(215,255,63,0.9)",
        }}
      />
      <span style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: 2, color: C.paper }}>LIVE</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>· COSTON2</span>
    </div>
  </div>
);

const CaptionBar: React.FC<{ caption: string; sub: string }> = ({ caption, sub }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 10, 58, 70], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 12], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: o,
        transform: `translateY(${y}px)`,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: 2,
          color: C.acid,
          textAlign: "center",
          padding: "0 40px",
          textShadow: "0 0 30px rgba(215,255,63,0.25)",
        }}
      >
        {caption}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 17, color: C.paper, opacity: 0.7, letterSpacing: 1 }}>
        {sub}
      </div>
    </div>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = { durationInFrames: 1350 };
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 5,
        background: C.panel2,
        zIndex: 10,
      }}
    >
      <div style={{ width: `${p * 100}%`, height: "100%", background: C.acid }} />
    </div>
  );
};

export const Demo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Grid />
      <Header />
      {captions.map((c) => {
        const Seg = SEGMENTS[c.id];
        return (
          <Sequence key={c.id} from={c.startFrame} durationInFrames={c.durationFrames} name={c.id}>
            <AbsoluteFill>
              <Seg />
              <CaptionBar caption={c.caption} sub={c.sub} />
              <Audio src={staticFile(`vo/${c.audio}`)} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <ProgressBar />
    </AbsoluteFill>
  );
};
