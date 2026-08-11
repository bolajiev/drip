import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Bar, Count, FadeIn, FONT_MONO, Panel } from "../ui";

/** S4 — STREAM OPENS AUTOMATICALLY: the live meter + merchant balance. */
export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [10, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => Math.min(1, t * 1.35),
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", gap: 70, alignItems: "stretch" }}>
          <Panel title="STREAM #10 · CYCLE 1" right="STATUS STREAMING" width={620} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>
                <span>5.00 FXRP / 3600s</span>
                <span>SENDER = YOU (CANCEL ANYTIME)</span>
              </div>
              <Bar progress={p} height={26} />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>
                <span>STREAMED SO FAR</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.paper }}>
                  <Count to={5} duration={100} start={10} suffix=" FXRP" />
                </span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.acid, letterSpacing: 1 }}>
                AUTO-FINALIZED ON-CHAIN — NO CLICK NEEDED
              </div>
            </div>
          </Panel>
          <Panel title="MERCHANT RECEIVING" right="AMAKA'S NEWSLETTER" width={430}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 44, fontWeight: 800, color: C.acid }}>
                +<Count to={3.42} duration={100} start={10} suffix=" FXRP" />
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                PAID BY THE SECOND
                <br />
                WITHDRAWABLE RIGHT NOW — ANYTIME
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.green }}>✓ NO CHARGEBACKS · NO SECOND SIGNATURE</div>
            </div>
          </Panel>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
