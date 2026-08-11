import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";
import { Arrow, Chip, FadeIn, FONT_MONO, Panel } from "../ui";

/** S2 — REBUILT ON THE XRP RAILS: the one-transaction flow + live app shot. */
export const S2: React.FC = () => {
  const nodes: { title: string; sub: string; accent?: boolean }[] = [
    { title: "YOU PAY", sub: "XRP + TAG" },
    { title: "CORE VAULT", sub: "on XRPL" },
    { title: "EXECUTOR", sub: "FAssets" },
    { title: "YOUR ESCROW", sub: "FXRP lands", accent: true },
    { title: "STREAM", sub: "→ merchant" },
  ];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: 46, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "stretch" }}>
            {nodes.map((n, i) => (
              <React.Fragment key={n.title}>
                <div
                  style={{
                    width: 240,
                    border: `1px solid ${n.accent ? C.acid : C.border}`,
                    background: n.accent ? "rgba(215,255,63,0.06)" : C.panel,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    padding: "26px 10px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 19,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      color: n.accent ? C.acid : C.paper,
                    }}
                  >
                    {n.title}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.muted }}>{n.sub}</div>
                </div>
                {i < nodes.length - 1 && <Arrow />}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Chip>ONE XRPL TRANSACTION</Chip>
            <Chip color={C.paper}>NO AGENT · NO COLLATERAL · NO BRIDGE</Chip>
            <Chip color={C.paper}>MINTED BY FLARE IN ~2 MIN</Chip>
          </div>
          <div style={{ width: 640, border: `1px solid ${C.border}`, background: C.panel }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 16px",
                borderBottom: `1px solid ${C.border}`,
                fontFamily: FONT_MONO,
                fontSize: 12,
                color: C.muted,
                letterSpacing: 1,
              }}
            >
              <span>LIVE APP</span>
              <span style={{ color: C.acid }}>dripfxrp.vercel.app</span>
            </div>
            <Img src={staticFile("shots/landing.png")} style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
