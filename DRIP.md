# DRIP.md — Build Spec

Read PLAN.md first for the research and reasoning behind this. This file is
the actual spec: what to build, why it's built this way, and what to use.

## What we're building

A trustless recurring-subscription product on Flare. A customer pays in
XRP; the payment mints into FXRP and streams to a merchant over a billing
period via a fork of Sablier's audited linear-vesting contracts. One XRPL
payment funds one billing cycle. The merchant draws down what's accrued at
any time. The customer can cancel and reclaim the unstreamed remainder at
any time.

## Why this design

- **Why streaming instead of a repeated debit.** XRPL has no native
  recurring-payment primitive — no card-style auto-debit. A streaming/
  vesting model lets the customer prepay once per cycle while both sides
  still get trustless guarantees: the merchant can't drain the deposit
  early, the customer can't be charged after cancelling. Neither side needs
  a second signature from the other mid-cycle.
- **Why fork Sablier instead of writing vesting math from scratch.**
  Sablier's Lockup contracts have been in production since 2019, are
  audited by Cantina and independent researchers, and the deposit →
  linear-accrual → withdraw/cancel pattern is exactly what a subscription
  needs. Writing this from scratch in a two-week window is pure risk with
  no product upside — the differentiated part of Drip is the FXRP
  integration, not the streaming math. Don't reinvent it.
- **Why direct minting instead of the standard reserve/agent mint flow.**
  FAssets v1.3 removes collateral reservation and agent selection entirely:
  one XRPL payment with a memo, an executor finalizes it, FXRP lands at the
  recipient. That recipient can be a contract, which means a customer's
  payment can fund a stream directly — no separate deposit step after
  bridging, no extra transaction for the customer.

## Architecture

1. **XRPL side**: customer sends one XRP payment to the FXRP Core Vault
   address on XRPL, memo-encoded per the direct-minting format (see
   REFERENCE.md), with the recipient set to Drip's subscription contract.
2. **Mint**: an executor calls `executeDirectMinting` on Flare; FXRP mints
   directly into the subscription contract. No action needed from Drip's
   backend to trigger this — it's driven by the executor network.
3. **Stream**: the subscription contract deposits the minted FXRP into a
   Sablier-style `LockupLinear` stream targeting the merchant, with
   start/end times matching the billing period (e.g. 30 days).
4. **Merchant**: withdraws vested FXRP from the stream at any time (standard
   Sablier `withdraw`).
5. **Cancel**: the customer can cancel at any time; the unvested remainder
   returns to them (standard Sablier `cancel`).
6. **Renewal**: the customer reuses the same reserved destination tag (via
   `IMintingTagManager`, built for repeat minters) to fund the next cycle —
   no re-onboarding, no new memo construction each time.

## Contracts to write

- **`DripLockup.sol`** — a fork of `sablier-labs/lockup`'s `SablierLockup`
  (or the minimal subset needed for one-directional linear streams). Do not
  hand-roll the accrual math. Adapt the deposit/withdraw/cancel interface
  for FXRP; don't touch the vesting logic itself.
- **`DripSubscriptions.sol`** — thin wrapper/factory. Maps a subscription ID
  (or destination tag) to a merchant address and billing period, receives
  the direct-minted FXRP, and calls into `DripLockup` to create or top up
  the stream. This is the actual new logic in the project — keep it small
  and readable, this is what differentiates Drip, not the vesting fork.
- Look up the FXRP token address via Flare's `FlareContractRegistry` at
  runtime. **Never hardcode it** — Flare's own docs explicitly warn against
  this because addresses can change between deployments.

## Stack

- **Contracts**: Solidity, Foundry (matches Sablier's own tooling —
  `forge install sablier-labs/lockup`)
- **Network**: Coston2 testnet only for this submission
- **FAssets integration reference**: `flare-viem-starter` (viem-based
  TypeScript examples for direct minting — locate on Flare Foundation's
  GitHub before writing integration code from scratch)
- **XRPL side**: `xrpl.js` to construct and send the testnet payment with
  the memo
- **Frontend**: minimal dApp — a merchant view (create plan, see accrued
  balance, withdraw) and a customer view (subscribe, view stream status,
  cancel). Keep it thin — this is a hackathon demo, not a product launch.

## MVP scope — build in this order

1. Prove FXRP mints correctly to a **contract address** on Coston2. Use the
   faucet for FXRP during contract dev — don't block this step on the XRPL
   memo flow working first, they're independent.
2. Deploy the forked Lockup contract + `DripSubscriptions` wrapper to
   Coston2.
3. Wire one full cycle end to end: fund → stream created → merchant
   withdraws a partial amount → customer cancels → remainder returns. Get
   this loop rock solid before anything else — it's the entire product.
4. One merchant, one subscription tier, one fixed monthly period. No
   multi-tier pricing.
5. Thin frontend showing both sides of the loop in step 3.
6. **Stretch goal only, if time allows**: a real XRPL testnet payment
   triggering the direct mint live in the demo, instead of using the
   faucet for the recipient's initial funding.

## Explicitly out of scope for this submission

- Multi-tier pricing, mid-cycle plan changes
- Mainnet deployment
- Polished UI beyond functional
- Edge cases beyond Sablier's built-in cancel/refund behavior
- FCC/TEE integration of any kind — unrelated track, not part of Drip

## Submission notes

Judging on Flare hackathons has favored demoable products with a specific,
named target user over broad feature lists. When narrating the demo, be
explicit: who is the merchant, who is the customer, what happens on either
side if a subscription is cancelled mid-cycle. That story matters as much
as the code.
