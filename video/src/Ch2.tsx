import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Chip, FadeIn, FONT_MONO, Panel, ScreenShot, Term } from "../ui";

/** p1 — the evidence ledger. */
export const P1: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <Panel title="THE EVIDENCE — 4 REAL TRANSACTIONS" right="COSTON2 + XRPL TESTNET" width={820} accent>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["XRPL TESTNET", "PAYMENT", "5.20 XRP · TAG 377", "728B39D8…"],
            ["COSTON2", "EXECUTOR MINT", "5 FXRP → ESCROW", "484AEEA8…"],
            ["COSTON2", "FINALIZE", "STREAM #9 OPENED", "F38B350E…"],
            ["COSTON2", "RENEWAL", "STREAM #10 · CYCLE 2", "788EA8BE…"],
          ].map(([net, act, what, hash]) => (
            <div key={hash} style={{ display: "flex", alignItems: "center", gap: 14, border: `1px solid ${C.border}`, background: C.bg, padding: "13px 18px" }}>
              <Chip>{net}</Chip>
              <span style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: C.acid, width: 150 }}>{act}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.paper }}>{what}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted, marginLeft: "auto" }}>{hash}</span>
            </div>
          ))}
        </div>
      </Panel>
    </FadeIn>
  </AbsoluteFill>
);

/** p2 — the XRPL payment. */
export const P2: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        <ScreenShot
          src="shots/xrpl_payment.png"
          title="XRPL TESTNET — TRANSACTION"
          url="testnet.xrpl.org"
          width={820}
        />
        <Panel title="THE PAYMENT" width={400} accent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <KV k="AMOUNT" v="5.20 XRP" />
            <KV k="DESTINATION TAG" v="377" />
            <KV k="TO (CORE VAULT)" v="rDhpmiPq4…" />
            <KV k="RESULT" v="tesSUCCESS" green />
          </div>
        </Panel>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

const KV: React.FC<{ k: string; v: string; green?: boolean }> = ({ k, v, green }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted, letterSpacing: 1 }}>{k}</span>
    <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: green ? C.green : C.paper }}>{v}</span>
  </div>
);

/** p3 — the mint. */
export const P3: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        <ScreenShot
          src="shots/c2_mint1.png"
          title="COSTON2 EXPLORER — DIRECT MINT"
          url="coston2-explorer.flare.network"
          width={820}
        />
        <Panel title="DirectMintingExecuted" right="event" width={430} accent>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <KV k="mintedAmountUBA" v="5,000,000" />
            <KV k="target (escrow)" v="0x37d7…867" />
            <KV k="executor" v="0x103b…437" />
            <KV k="mintingFeeUBA" v="100,000" />
            <KV k="executorFeeUBA" v="100,000" />
          </div>
        </Panel>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** p4 — the guard revert. */
export const P4: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
        <Term
          title="cast call — attempt to finalize while streaming"
          lines={[
            { t: "$ cast call 0xe55dc9… \"finalize(uint256)\" 3" },
            { t: "→ cycle 1 is STILL STREAMING", c: C.muted },
            { t: "Error: execution reverted:", c: C.red },
            { t: "  0x96439519 DripSubscriptions_CycleStillStreaming(3)", c: C.red },
          ]}
        />
        <div style={{ display: "flex", gap: 16 }}>
          <Chip>OVERLAPPING STREAMS = IMPOSSIBLE</Chip>
          <Chip color={C.paper}>THE GUARD IS LIVE ON-CHAIN</Chip>
        </div>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** p5 — cycle 2 renewal. */
export const P5: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        <ScreenShot
          src="shots/c2_finalize2.png"
          title="COSTON2 EXPLORER — RENEWAL FINALIZE"
          url="coston2-explorer.flare.network"
          width={820}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Chip color={C.paper}>STREAM 9</Chip>
            <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.muted, alignSelf: "center" }}>✓ SETTLED →</div>
            <Chip>STREAM 10 · LIVE</Chip>
          </div>
          <Panel title="CYCLE 2" width={380} accent>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <KV k="customer" v="0xa248…f453" />
              <KV k="tag" v="377 (same)" />
              <KV k="streamId" v="10" />
              <KV k="status" v="STREAMING" green />
            </div>
          </Panel>
        </div>
      </div>
    </FadeIn>
  </AbsoluteFill>
);

/** p6 — cancel/refund. */
export const P6: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <FadeIn>
      <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
        <Panel title="YOU CANCEL" right="lockup.cancel(streamId)" width={440} accent>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: FONT_MONO }}>
            <div style={{ fontSize: 14, color: C.muted }}>UNSTREAMED REMAINDER</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: C.green }}>1.87 FXRP</div>
            <div style={{ fontSize: 13, color: C.paper }}>SENT BACK TO THE SENDER — THE SAME TRANSACTION</div>
          </div>
        </Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 380 }}>
          <Chip color={C.paper}>MERCHANT KEEPS WHAT WAS STREAMED</Chip>
          <Chip color={C.paper}>NO REFUND REQUEST · NO DISPUTE · NO TICKET</Chip>
        </div>
      </div>
    </FadeIn>
  </AbsoluteFill>
);
