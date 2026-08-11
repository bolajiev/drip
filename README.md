# DRIP — XRP subscription streaming on Flare

Pay once in XRP. It **streams** to the merchant over the billing period.

DRIP is a trustless recurring-subscription product built on Flare's
FAssets/FXRP rails. A customer sends one XRP payment to the FXRP Core Vault
with a destination tag; the direct-minted FXRP lands in the subscription's
escrow and flows to the merchant as a Sablier-style linear stream. Cancel
anytime — the unstreamed remainder returns to you. No auto-debits, no
chargebacks, no second signature mid-cycle.

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
1 XRP + tag ──► FXRP Core Vault ──► [executor direct-mints]
                                     FXRP lands in the subscription's escrow
                                     (tag bound to the escrow on
                                     MintingTagManager)
                                     └─► finalize: escrow balance becomes a
                                         LockupLinear stream
                                         sender=customer → recipient=merchant
                                         duration = billing cycle
                                         merchant: withdraw vested FXRP anytime
                                         customer: cancel → unstreamed back
```

1. Customer sends one XRP payment to the FXRP Core Vault (destination tag =
   subscription, reserved via `IMintingTagManager`). An FAssets executor
   finalizes the mint — no Drip backend involved.
2. The minted FXRP lands in the subscription's dedicated escrow (the tag's
   minting recipient is the escrow — verified on-chain). `finalize` pulls
   it into a linear stream in `DripLockup`.
3. `DripSubscriptions` (thin factory — the only new logic) maps a
   subscription/destination tag to merchant + billing period. Early renewal
   payments wait in the escrow — `finalize`/`refundPending` revert while the
   current cycle streams, so overlapping streams are impossible.
4. `DripLockup` is a minimal fork of Sablier's `LockupLinear`: deposit,
   linear accrual, `withdrawMax`, `cancel` (refunds remainder), all audited
   math preserved.
5. Renewal reuses the same reserved tag — no re-onboarding.

FXRP is resolved at runtime via `FlareContractRegistry`
(`getContractAddressByName("AssetManagerFXRP")` →
`getFxrp()`, `getMintingTagManager()`) — never hardcoded.

## Live deployment (Coston2)

| Contract | Address |
|---|---|
| DripSubscriptions (v3, escrow + no-overlap guard) | `0xe55dc9Fbe39feBa6A6cAD0347F5F17E3af5501CB` |
| DripLockup | `0x0Dbe50349C0CF45e8cF5417E100fc63a9fdb6589` |
| FXRP (resolved at runtime) | `0x0b6A3645c240605887a5532109323A3E12273dc7` |
| MintingTagManager (resolved at runtime) | `0x094511737909b626391106bBc21B25feb2D67B96` |

Full E2E cycle verified on-chain (v3): subscribe → tag 369 reserved to a
fresh per-subscription escrow → escrow funded → `finalize` → stream
STREAMING → double-`finalize` and `refundPending` both revert on-chain
(no-overlap guard) → stream SETTLED → renewal with the same tag → cycle 2
streaming → merchant withdraws vested FXRP.

**Real XRPL → FXRP mint verified (Aug 9):** subscriber 3, tag 377 — a real
5.2 test-XRP payment to the Coston2 FXRP Core Vault (`rDhpmiPq4BVBDWMVdSrmkgt8thKyRzGV1p`,
destination tag 377) was picked up by Flare's live executor and minted 5 FXRP
into the subscription's escrow in ~2.5 minutes; `finalize` opened stream 9.
The XRPL payment is the only external step — no agent selection, no
collateral, no simulation. **Real renewal verified too**: a second payment
with the same tag minted while stream 9 was streaming — `finalize` reverted
live (no-overlap guard holds real funds in the escrow), and when the cycle
settled, finalize opened cycle 2 (stream 10) with the held FXRP. The UI
auto-finalizes (stream opens without a click) and prompts to renew with the
same tag after each cycle. See `REFERENCE.md` for the full log and the
be-your-own-executor FDC pipeline.

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

The subscribe page quotes the live payment amount (net + mint fee + executor
fee, read from the AssetManager) and shows the vault address and destination
tag for the XRPL testnet payment; mint detection watches FXRP `Transfer` to
the subscription's escrow. Use the Coston2 faucet for C2FLR and the XRPL
faucet for test XRP: https://faucet.flare.network/coston2

## Contracts — develop & test

```bash
forge build
forge test        # 34 tests, incl. full subscribe→stream→cancel cycle
                  # and the v3 escrow/no-overlap suite
```

## For merchants — how to take payments in real time

1. **Deploy once** (registry-based, no hardcoded addresses — same code runs
   on Coston2 today and Flare mainnet): `forge create` `DripSubscriptions`
   with the Flare contract registry + your `DripLockup`; fund it with native
   tokens (one tag fee per subscriber — Coston2: 100 C2FLR; mainnet: FLR,
   returned when the tag is retired).
2. **Create a plan** — `createPlan(name, description, pricePerCycle, cycleDuration)`
   from your wallet. You are the merchant; the plan is live immediately.
3. **Share the plan link** — every customer gets `https://dripfxrp.vercel.app/#/s/<planId>`,
   which walks them through subscribe → XRP payment → live stream.
4. **Get paid continuously** — FXRP streams to you by the second for the
   whole cycle; withdraw the vested amount anytime (`withdrawMax` on the
   lockup). Your dashboard shows every active stream, what's streamed, and
   what's withdrawable.
5. **Gate your product on-chain** — `DripSubscriptions.isActive(planId, customer)`
   returns `true` exactly while a customer's cycle is live, so your app or
   content server can check paid status per subscriber with one read:
   ```js
   const paid = await contract.isActive(planId, customerAddress);
   ```
   No webhooks, no payment provider, no KYC for the rails.

**Customer flow (real time):** open the link → connect an EVM wallet →
one-click "Reserve tag & subscribe" (their permanent XRPL destination tag)
→ pay XRP from any XRPL wallet → Flare's executor mints FXRP into their
escrow within ~2 minutes → the stream opens automatically (auto-finalize)
→ cancel anytime and the unstreamed remainder is refunded instantly.

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
