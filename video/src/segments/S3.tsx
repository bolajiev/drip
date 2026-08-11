import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Count, FadeIn, FONT_MONO, Panel } from "../ui";

/** S3 — PAY XRP + TAG → FXRP IN ESCROW: payment card + escrow counting up. */
export const S3: React.FC = () => {
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", gap: 70, alignItems: "stretch" }}>
          <Panel title="XRPL PAYMENT — SENT" right="TX 728B…D83AE" width={470}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row k="FROM" v="rh4cMfmu…WVNE3L" />
              <Row k="TO (CORE VAULT)" v="rDhpmiPq4BVBDWMVdSrmkgt8thKyRzGV1p" small />
              <Row k="AMOUNT" v="5.20 XRP" accent />
              <Row k="DESTINATION TAG" v="377" accent />
              <Row k="STATUS" v="tesSUCCESS ✓" green />
            </div>
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 64, fontWeight: 800, color: C.acid }}>
              →
            </div>
          </div>
          <Panel title="YOUR ESCROW" right="pendingFxrp(3)" width={470} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.muted }}>FXRP BALANCE</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 58, fontWeight: 800, color: C.paper }}>
                <Count to={5} duration={46} start={14} suffix=" FXRP" />
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.acid, letterSpacing: 1 }}>
                MINTING… EXECUTOR FOUND YOUR TAG
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>
                MINTER FEE 0.10 · EXECUTOR FEE 0.10 — PAID FROM THE PAYMENT
              </div>
            </div>
          </Panel>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ k: string; v: string; accent?: boolean; green?: boolean; small?: boolean }> = ({
  k,
  v,
  accent,
  green,
  small,
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20 }}>
    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted, letterSpacing: 1 }}>{k}</span>
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: small ? 12 : 15,
        fontWeight: 600,
        color: accent ? C.acid : green ? C.green : C.paper,
        wordBreak: "break-all",
        textAlign: "right",
      }}
    >
      {v}
    </span>
  </div>
);
