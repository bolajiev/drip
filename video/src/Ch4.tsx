import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Chip, FadeIn, FONT_MONO, Panel } from "../ui";

const Step: React.FC<{ n: string; text: string; accent?: boolean }> = ({ n, text, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, border: `1px solid ${accent ? C.acid : C.border}`, background: accent ? "rgba(215,255,63,0.05)" : C.bg, padding: "15px 20px" }}>
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 16,
        fontWeight: 800,
        color: accent ? C.bg : C.acid,
        background: accent ? C.acid : "transparent",
        border: `1px solid ${accent ? C.acid : C.border}`,
        width: 30,
        height: 30,
        display: "grid",
        placeItems: "center",
      }}
    >
      {n}
    </span>
    <span style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.paper }}>{text}</span>
  </div>
);

/** r1 — merchant steps. */
export const R1: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <Panel title="FOR MERCHANTS" right="set up once, earn continuously" width={760} accent>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Step n="1" text="Deploy the contracts — registry-based, one-time" />
          <Step n="2" text="createPlan(name, price, cycle) — live instantly" accent />
          <Step n="3" text="Share the plan link — customers self-serve" />
          <Step n="4" text="Withdraw vested FXRP anytime · gate with isActive()" accent />
        </div>
      </Panel>
    </FadeIn>
  </AbsoluteFill>
);

/** r2 — customer steps. */
export const R2: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <Panel title="FOR CUSTOMERS" right="full control, zero lock-in" width={760} accent>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Step n="1" text="Connect your EVM wallet — it holds your cancel rights" />
          <Step n="2" text="Subscribe — you get a permanent XRPL destination tag" accent />
          <Step n="3" text="Pay XRP each cycle with the same tag" />
          <Step n="4" text="Watch the value stream to the merchant in real time" />
          <Step n="5" text="Cancel anytime — the unspent remainder returns instantly" accent />
        </div>
      </Panel>
    </FadeIn>
  </AbsoluteFill>
);

/** r3 — roadmap. */
export const R3: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 36 }}>
          {[
            { t: "MAINNET", d: "Same contracts on Flare mainnet\nwith Xaman + real XRP", c: C.acid },
            { t: "REDEMPTION", d: "Merchants redeem FXRP\nback to XRP (FAssets)", c: C.paper },
            { t: "DRIP EXECUTOR", d: "Our own FDC executor service\n— no single point of failure", c: C.paper },
          ].map((x) => (
            <div key={x.t} style={{ width: 340, border: `1px solid ${x.c === C.acid ? C.acid : C.border}`, background: C.panel, padding: "26px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 800, letterSpacing: 1.5, color: x.c as string }}>{x.t}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.muted, whiteSpace: "pre-line", lineHeight: 1.6 }}>{x.d}</div>
            </div>
          ))}
        </div>
        <Chip color={C.paper}>THE RAILS NEVER DEPEND ON ANY SINGLE PARTY</Chip>
      </div>
    </FadeIn>
  </AbsoluteFill>
);
