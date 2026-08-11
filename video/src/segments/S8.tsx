import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Chip, DripLogo, FONT_MONO, FONT_SANS } from "../ui";

/** S8 — END CARD. */
export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse at 50% 30%, rgba(215,255,63,0.07), ${C.bg} 60%)`,
      }}
    >
      <div style={{ opacity: o, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <DripLogo size={110} />
        <div style={{ fontFamily: FONT_SANS, fontSize: 130, fontWeight: 800, letterSpacing: -2, color: C.paper }}>
          DRIP
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 22,
            letterSpacing: 3,
            color: C.acid,
            border: `1px solid ${C.border}`,
            padding: "12px 26px",
          }}
        >
          RECURRING PAYMENTS · REBUILT ON THE XRP RAILS
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <Chip color={C.paper}>FLARE FASSETS v1.3</Chip>
          <Chip color={C.paper}>LIVE ON COSTON2</Chip>
          <Chip>FLARE SUMMER SIGNAL 2026</Chip>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 34, fontWeight: 800, color: C.paper, marginTop: 14 }}>
          dripfxrp<span style={{ color: C.acid }}>.</span>vercel<span style={{ color: C.acid }}>.</span>app
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.muted }}>
          TRY IT — CONNECT AN EVM WALLET AND PAY WITH XRPL TESTNET XRP
        </div>
      </div>
    </AbsoluteFill>
  );
};
