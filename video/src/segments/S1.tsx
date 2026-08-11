import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { FadeIn, FONT_MONO, Panel } from "../ui";

/** S1 — SUBSCRIPTIONS ARE BROKEN: a debit card bleeding a recurring charge. */
export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [0, 40, 80], [1, 0.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", gap: 90, alignItems: "center" }}>
          <Panel title="DEBIT CARD · AUTO-CHARGE" right="X2Y3…" width={430}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  color: C.paper,
                  letterSpacing: 2,
                  opacity: pulse,
                }}
              >
                CHARGED $49.99 · MONTHLY
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 40,
                  fontWeight: 700,
                  color: C.red,
                  opacity: 0.9,
                }}
              >
                -$49.99
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                MERCHANT: SUBCRIPTION CO LTD
                <br />
                NEXT CHARGE: EVERY MONTH. FOREVER.
              </div>
            </div>
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 34,
                fontWeight: 800,
                color: C.red,
                border: `1px solid ${C.red}`,
                padding: "16px 26px",
                transform: "rotate(-4deg)",
                letterSpacing: 2,
              }}
            >
              NO CANCEL BUTTON
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 22,
                color: C.paper,
                opacity: 0.85,
              }}
            >
              "PLEASE EMAIL US FOR A REFUND"
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.muted }}>
              → 3 WEEKS LATER · STILL PENDING
            </div>
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
