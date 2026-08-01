# PLAN.md — Drip: Research & Decision Log

This is the research and reasoning behind Drip, produced before any code was
written. Read this before DRIP.md if you want the "why," not just the "what."

## Hackathon

- **Flare Summer Signal**, hosted on DoraHacks:
  https://dorahacks.io/hackathon/flaresummersignal
- Registration/dev opened June 29, 2026. **Submission deadline: August 14,
  2026.** Judging Aug 15–21. Winners announced Aug 24.
- $12,000 total prize pool split into two $6,000 tracks (1st $4k / 2nd $2k
  each):
  - Track 1: Interoperable asset products
  - Track 2: Private applications on Flare Confidential Compute (FCC)
- **We are building for Track 1 only.** Track 2 was evaluated and rejected
  for this hackathon — see "Rejected directions" below.

## Goal

Ship a working, demoable product on Flare's FAssets/FXRP rails that solves a
real problem — not another yield vault. "Done" for the hackathon = a
merchant can set up a subscription, a customer can pay in XRP and get billed
recurringly in FXRP without manually re-bridging every cycle, trustlessly on
both sides.

## Landscape — what already exists

The FXRP/XRPFi ecosystem on Flare is dense and well-funded. Do not build in
these lanes, they're already occupied by live, funded teams:

- **Lending**: Kinetic, Morpho Blue (live since Feb 2026)
- **Yield vaults**: Upshift (earnXRP, curated by Clearstar; MXRPY, Monarq
  Asset Management, backed by FalconX/Deribit OTC strategies)
- **Vault aggregation**: Superform bizFXRP (Byzantine Labs)
- **Staking**: Firelight (stXRP, Economically Secured Services)
- **CDP/borrowing**: Enosys Liquity v2
- **DEX**: SparkDex, Blazeswap, Enosys
- **Yield ranking/aggregation**: Harvest.finance publishes a cross-protocol
  APY ranking across 10+ products
- **One-click onboarding**: Flare + Xaman shipped a one-click xApp (mint →
  vault deposit → yield in a single XRPL-signed transaction) in Feb 2026
- **Agent-side tooling**: Flare's own FAssets Agent Admin Console (dashboard,
  alerts, vault management)
- **Not live yet**: FBTC, FDOGE — still roadmap, out of scope for this
  window regardless of idea quality

**The gap**: everything above is about generating yield on *idle* FXRP.
Nothing on Flare addresses *moving* FXRP over time — no streaming payments,
vesting, payroll, or subscription billing exists on the chain. Superfluid
and Sablier, the two dominant streaming-payment protocols elsewhere, are not
deployed on Flare at all (Superfluid's networks are Ethereum, Optimism,
Polygon, Arbitrum, Avalanche, Base, Gnosis — Flare isn't on that list).

## Decision: build Drip

A merchant-side recurring billing/subscription tool for FXRP.

**Target user**: creators/SaaS operators who want to accept XRP for ongoing
services, and XRP holders who want to pay for services without manually
bridging into DeFi every billing cycle.

**Why this over a yield product**: judges reward usable products with a
specific target user, not another vault competing with institutionally
backed teams. This is genuinely unclaimed territory in an otherwise
saturated space.

## Assumptions

1. **Users**: XRP holders have no way today to pay for a recurring service
   directly from XRP without first learning to bridge/swap into a
   stablecoin manually, every cycle. Merchants have no trustless recurring
   crypto-billing tool at all.
2. **Feasibility**: FAssets v1.3 direct minting (live on mainnet since ~May
   2026) lets a single XRPL payment mint FXRP straight to any Flare
   address — including a contract address — with no collateral reservation
   and no agent selection. This is the core primitive the product depends
   on. See DRIP.md and REFERENCE.md for the mechanics.
3. **Differentiation**: trustless on both sides — the merchant can only
   withdraw what's accrued so far (can't front-run future months), the
   customer can cancel anytime and reclaim the unstreamed remainder.
4. **Scope**: the smallest version that proves the bet is one merchant, one
   subscription tier, one fixed billing period, one stream contract.
   Multi-tier pricing, polished dashboards, and non-default refund logic
   are later phases, not this submission.
5. **Cost**: testnet only (Coston2), nothing paid. The Coston2 faucet
   dispenses C2FLR, FXRP, and USDT0 directly, so contract dev/testing
   doesn't require the full XRPL mint flow to be working first.
6. **Risk**: the one real open question is whether direct-minting-to-a-
   contract behaves exactly as documented once actually tested on Coston2.
   Everything else (Sablier's accrual math, FAssets' mint mechanics) is
   already proven in production elsewhere.

## Rejected directions (and why)

- **FCC / Track 2 (private applications)**: Coston2's FCC deployment was
  redeployed mid-hackathon (per the hackathon Telegram, confirmed by the
  host). The infra is being actively patched in real time — a healthier
  signal than a dead testnet — but it's still a second, unrelated build
  (TEE registration, extension lifecycle, tunnel config) competing for the
  same ~2 weeks as Drip. Not worth the context-switch for this submission.
  FCC-related threads in the hackathon chat are not relevant to this
  project unless scope explicitly changes.
- **One-click CEX-to-yield onboarding**: already shipped by Flare + Xaman
  (Feb 2026).
- **Yield aggregator/dashboard**: already covered by Harvest.finance.
- **Agent monitoring dashboard**: already covered by Flare's own Agent
  Admin Console.
- **New FAsset product (FBTC/FDOGE)**: not live on mainnet or testnet yet.

## Open item before build

Confirm the exact current `LICENSE` file on `sablier-labs/lockup`.
Historically Sablier V2 Core shipped under the Business Source License 1.1,
which restricts *commercial production* use for ~4 years post-launch before
converting to GPL. This build is testnet, non-commercial, and for a
hackathon, so it's very unlikely to be an issue — but verify the current
file rather than assume the terms haven't shifted. Low-stakes, not a
blocker.

See **DRIP.md** for the build spec (what to build, why, and how) and
**REFERENCE.md** for concrete technical facts, addresses, and links.
