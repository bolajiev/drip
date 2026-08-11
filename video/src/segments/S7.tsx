import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Count, FadeIn, FONT_MONO, Panel } from "../ui";

/** S7 — MERCHANTS: paid by the second + one-read access control. */
export const S7: React.FC = () => {
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", gap: 70, alignItems: "stretch" }}>
          <Panel title="MERCHANT DASHBOARD" right="AMAKA'S NEWSLETTER" width={520}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>
                <span>WITHDRAWABLE NOW</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: C.acid }}>
                  <Count to={4.58} duration={46} start={8} suffix=" FXRP" />
                </span>
              </div>
              <div style={{ border: `1px solid ${C.border}`, background: C.panel2, padding: "14px 18px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>WITHDRAW</div>
                <div
                  style={{
                    marginTop: 8,
                    display: "inline-block",
                    fontFamily: FONT_MONO,
                    fontSize: 14,
                    fontWeight: 700,
                    background: C.acid,
                    color: C.bg,
                    padding: "10px 22px",
                    letterSpacing: 1,
                  }}
                >
                  WITHDRAW MAX →
                </div>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>
                FXRP → YOUR WALLET → REDEEM FOR XRP ANYTIME
              </div>
            </div>
          </Panel>
          <Panel title="ACCESS CONTROL — ONE READ" right="SOLIDITY / JS" width={470} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 19,
                  color: C.paper,
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: C.muted }}>const </span>paid = await contract
                <br />
                &nbsp;&nbsp;.isActive(<span style={{ color: C.acid }}>planId</span>,{" "}
                <span style={{ color: C.acid }}>customer</span>)
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.green }}>→ TRUE (STREAM LIVE)</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                GATE YOUR APP OR CONTENT SERVER ON IT.
                <br />
                NO WEBHOOKS · NO PAYMENT PROVIDER · NO KYC ON THE RAILS
              </div>
            </div>
          </Panel>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
