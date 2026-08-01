# DRIP — XRP subscription streaming on Flare

Pay once in XRP. It **streams** to the merchant over the billing period.

DRIP is a trustless recurring-subscription product built on Flare's
FAssets/FXRP rails. A customer sends one XRP payment to the FXRP Core Vault
with a destination tag; the direct-minted FXRP lands inside DRIP's contract
and flows to the merchant as a Sablier-style linear stream. Cancel anytime —
the unstreamed remainder returns to you. No auto-debits, no chargebacks,
no second signature mid-cycle.

> Flare Summer Signal hackathon 2026, Track 1 (Interoperable asset
> products). Live on **Coston2 testnet**.

## Why this design

- **XRPL has no recurring-payment primitive.** Streaming a prepaid cycle
  (Sablier Lockup fork — audited vesting math, not hand-rolled) gives both
  sides trustless guarantees: the merchant can't drain the deposit early,
  the customer can't be charged after cancelling.
- **Direct minting (FAssets v1.3)** removes reserve/agent flows: one XRPL
  payment with a memo mints FXRP straight into the subscription contract,
  which opens the stream — no bridging hop, no extra customer transaction.
- **Destination-tag renewal**: the customer reuses their reserved minting
  tag to fund the next cycle — no re-onboarding.

## Architecture

```
Customer (XRPL)                      Flare (Coston2)
──────────────                       ─────────────────
1 XRP + memo ──► FXRP Core Vault ──► [executor direct-mints]
                                     FXRP lands in DripSubscriptions
                                     └─► opens LockupLinear stream
                                         sender=customer → recipient=merchant
                                         duration = billing cycle
                                         merchant: withdraw vested FXRP anytime
                                         customer: cancel → unstreamed back
```

1. Customer sends one XRP payment to the FXRP Core Vault (memo-encoded,
   recipient = `DripSubscriptions`). An FAssets executor finalizes the mint
   — no Drip backend involved.
2. `DripSubscriptions` (thin factory — the only new logic) maps a
   subscription/destination tag to merchant + billing period and creates
   the stream in `DripLockup`.
3. `DripLockup` is a minimal fork of Sablier's `LockupLinear`: deposit,
   linear accrual, `withdrawMax`, `cancel` (refunds remainder), all audited
   math preserved.
4. Renewal reuses the same reserved tag via `IMintingTagManager`.

FXRP is resolved at runtime via `FlareContractRegistry`
(`getContractAddressByName("AssetManagerFXRP")` →
`getFxrp()`, `getMintingTagManager()`) — never hardcoded.

## Live deployment (Coston2)

| Contract | Address |
|---|---|
| DripLockup | `0x0Dbe50349C0CF45e8cF5417E100fc63a9fdb6589` |
| DripSubscriptions | `0x79fa101D31d30e764394b115E9738d27B185f3d9` |
| FXRP (resolved at runtime) | `0x0b6A3645c240605887a5532109323A3E12273dc7` |
| MintingTagManager (resolved at runtime) | `0x094511737909b626391106bBc21B25feb2D67B96` |

Full E2E cycle verified on-chain: subscribe → tag reserved (ERC-721) →
fund → finalize → stream STREAMING → merchant withdraw → cancel → exact
unstreamed remainder refunded (balance-checksum verified). See
`REFERENCE.md` for the log and gotchas.

## Frontend (`frontend/`)

Vite + React + wagmi/viem + Tailwind v4. Two role views on one page:

- **Merchant**: create a plan (price/cycle), watch incoming streams, withdraw
  vested FXRP, deactivate plans.
- **Customer**: browse plans, subscribe, fund the cycle, watch the live
  ticking meter, cancel and reclaim the remainder.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 — connect MetaMask on Coston2
```

On testnet the XRPL mint is simulated with a faucet-FXRP transfer into the
contract (same effect on-chain); the real direct-mint flow is the same code
path once an XRPL payment lands. Use the Coston2 faucet for C2FLR + FXRP:
https://faucet.flare.network/coston2

## Contracts — develop & test

```bash
forge build
forge test        # 21 tests, incl. full subscribe→stream→cancel cycle
```

## Docs

- `PLAN.md` — research & decision log (why fork Sablier, why direct minting)
- `DRIP.md` — build spec & MVP scope
- `REFERENCE.md` — deployment log, FAssets v1.3 memo format, gotchas

## Demo narrative

*Maya runs a newsletter paid in crypto. She creates a plan: 5 FXRP / 30
days. Dev subscribes, sends one XRP payment (tag = his subscription), and
his FXRP starts streaming to Maya at 0.19 FXRP/day. Ten days in, Dev
cancels: Maya keeps what she earned, the remaining 65% flows straight back
to Dev's wallet. No refund request, no dispute — the contract does it.*

## Out of scope (this submission)

Multi-tier pricing, mid-cycle plan changes, mainnet, FCC/TEE (Track 2).
