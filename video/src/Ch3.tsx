import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Arrow, Chip, FadeIn, FONT_MONO, Panel } from "../ui";

/** a1 — one escrow per subscription. */
export const A1: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 60 }}>
          {[
            { tag: "TAG 369", esc: "0x333B…a7f", stream: "STREAM 7" },
            { tag: "TAG 377", esc: "0x37d7…867", stream: "STREAM 10" },
          ].map((s) => (
            <div key={s.tag} style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
              <Chip>{s.tag}</Chip>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.acid }}>↓</div>
              <div style={{ border: `1px solid ${C.acid}`, background: "rgba(215,255,63,0.06)", padding: "14px 26px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.acid, fontWeight: 700 }}>ESCROW</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted, marginTop: 6 }}>{s.esc}</div>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.acid }}>↓</div>
              <Chip color={C.paper}>{s.stream}</Chip>
            </div>
          ))}
        </div>
        <Chip color={C.paper}>PAYMENTS ARE SEGREGATED — ONE ESCROW PER SUBSCRIPTION, ONE TAG EACH</Chip>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** a2 — Sablier lockup fork. */
export const A2: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 42, alignItems: "center" }}>
        <Panel title="LOCKUP LINEAR STREAM — SABLIER FORK" right="audited vesting math" width={880} accent>
          <div style={{ display: "flex", alignItems: "center", gap: 18, justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>DEPOSIT</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 800, color: C.paper }}>5 FXRP</div>
            </div>
            <Arrow label="3600s" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>STREAM</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 800, color: C.acid }}>SECOND BY SECOND</div>
            </div>
            <Arrow label="sender = customer" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>MERCHANT</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 800, color: C.paper }}>WITHDRAWS</div>
            </div>
          </div>
        </Panel>
        <div style={{ display: "flex", gap: 16 }}>
          <Chip color={C.paper}>AUDITED VESTING MATH — NOT HAND-ROLLED</Chip>
          <Chip color={C.paper}>CANCEL = REFUND TO SENDER, BY CONTRACT</Chip>
        </div>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** a3 — FAssets v1.3 rails + fee breakdown. */
export const A3: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 44, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {["CORE VAULT", "EXECUTOR", "YOUR ESCROW"].map((n, i, arr) => (
            <React.Fragment key={n}>
              <div style={{ width: 250, border: `1px solid ${C.border}`, background: C.panel, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10, padding: 24 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, letterSpacing: 1, color: C.paper }}>{n}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>
                  {i === 0 ? "receives XRP + tag" : i === 1 ? "FAssets v1.3" : "FXRP lands"}
                </div>
              </div>
              {i < arr.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
        </div>
        <Panel title="WHERE THE 5.20 XRP GOES" width={560} accent>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              ["NET MINTED", "5.00 FXRP", C.paper],
              ["MINT FEE (0.25%, min 0.1)", "0.10", C.muted],
              ["EXECUTOR FEE", "0.10", C.muted],
              ["PAID TO VAULT", "5.20 XRP", C.acid],
            ].map(([k, v, c]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>{k}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: c as string }}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** a4 — registry-based, mainnet-ready. */
export const A4: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {["DRIP CONTRACTS", "FLARE CONTRACT REGISTRY", "ASSET MANAGER FXRP", "fAsset + MINTING TAG MANAGER"].map((n, i, arr) => (
            <React.Fragment key={n}>
              <div style={{ width: 270, border: `1px solid ${i === 1 ? C.acid : C.border}`, background: i === 1 ? "rgba(215,255,63,0.06)" : C.panel, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10, padding: 22, textAlign: "center" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, letterSpacing: 1, color: i === 1 ? C.acid : C.paper }}>{n}</div>
              </div>
              {i < arr.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Chip>ZERO HARDCODED ADDRESSES</Chip>
          <Chip color={C.paper}>SAME CONTRACTS → FLARE MAINNET, UNCHANGED</Chip>
        </div>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** a5 — merchant access control. */
export const A5: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
        <Panel title="ACCESS CONTROL — ONE READ" right="viem / ethers" width={620} accent>
          <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: C.paper, background: C.bg, border: `1px solid ${C.border}`, padding: "20px 24px", lineHeight: 1.8 }}>
            <span style={{ color: C.muted }}>const </span>paid = await drip
            <br />
            &nbsp;&nbsp;.isActive(<span style={{ color: C.acid }}>planId</span>, <span style={{ color: C.acid }}>customer</span>)
            <br />
            <span style={{ color: C.green }}>// true while a cycle is live</span>
          </div>
        </Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 380 }}>
          <Chip color={C.paper}>GATE YOUR APP OR CONTENT SERVER ON IT</Chip>
          <Chip color={C.paper}>NO WEBHOOKS · NO PROVIDER · NO KYC</Chip>
        </div>
      </div>
    </FadeIn>
  </AbsoluteFill>
);
