import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Bar, Count, FadeIn, FONT_MONO, Panel } from "../ui";

/** S5 — CANCEL ANYTIME → INSTANT REFUND: meter frozen, remainder refunds. */
export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const frozen = interpolate(frame, [12, 22], [0.62, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
          <Panel title="YOU CLICK CANCEL" right="TX 0x7b3…" width={560} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>
                <span>STREAM STOPPED</span>
                <span>MERCHANT KEEPS WHAT THEY EARNED</span>
              </div>
              <Bar progress={frozen} height={26} />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>
                <span>STREAMED (THEIRS)</span>
                <span style={{ fontWeight: 700, color: C.paper }}>3.13 FXRP</span>
              </div>
            </div>
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 64, fontWeight: 800, color: C.green }}>→</div>
          </div>
          <Panel title="BACK TO YOUR WALLET" right="INSTANT" width={430} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 44, fontWeight: 800, color: C.green }}>
                +<Count to={1.87} duration={40} start={14} suffix=" FXRP" />
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                UNSTREAMED REMAINDER
                <br />
                NO REFUND REQUEST. NO DISPUTE. NO EMAIL.
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.acid }}>DONE IN THE SAME TRANSACTION</div>
            </div>
          </Panel>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
