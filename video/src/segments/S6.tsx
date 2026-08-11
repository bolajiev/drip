import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Chip, FadeIn, FONT_MONO, Panel } from "../ui";

/** S6 — SAME TAG, EVERY RENEWAL: cycle dots, tag 377 reused. */
export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [0, 30], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: 50, alignItems: "center" }}>
          <Panel title="RENEWAL — NO RE-ONBOARDING" right="CYCLE 2" width={760} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
                <Chip>TAG 377</Chip>
                <div style={{ fontFamily: FONT_MONO, fontSize: 30, color: C.acid }}>→</div>
                <Chip color={C.paper}>PAY 5.2 XRP AGAIN</Chip>
                <div style={{ fontFamily: FONT_MONO, fontSize: 30, color: C.acid }}>→</div>
                <Chip color={C.paper}>ESCROW CREDITED</Chip>
                <div style={{ fontFamily: FONT_MONO, fontSize: 30, color: C.acid }}>→</div>
                <Chip color={C.paper}>STREAM REOPENS</Chip>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {["CYCLE 1", "CYCLE 2", "CYCLE 3", "CYCLE 4", "…"].map((c, i) => (
                  <div
                    key={c}
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 13,
                      letterSpacing: 1,
                      padding: "10px 16px",
                      border: `1px solid ${i < 2 ? C.acid : C.border}`,
                      background: i < 2 ? (i === 1 ? C.acid : "rgba(215,255,63,0.08)") : C.panel,
                      color: i === 1 ? C.bg : C.paper,
                      transform: `scale(${i === 1 ? grow : 1})`,
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.muted }}>
            THE SAME TAG FUNDS EVERY CYCLE — YOUR SUBSCRIPTION ID, ON XRPL, FOREVER
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
