# REFERENCE.md — Technical Facts & Links

Concrete facts gathered during research, for quick lookup while building.
Flare's FAssets stack has moved fast (v1.3 shipped ~May 2026) — verify
anything address-shaped against current docs before hardcoding it into a
contract, especially anything marked "confirm" below.

## Networks

- **Flare Testnet Coston2** — build here for this submission
  - Explorer: https://coston2-explorer.flare.network
  - RPC: https://coston2-api.flare.network/ext/C/rpc
  - Faucet: faucet.flare.network — dispenses C2FLR, FXRP, and USDT0
    directly, no minting required to get testnet FXRP
- Do not hardcode the AssetManager address. Flare uses a dynamic contract
  registry — look up contracts at runtime via `FlareContractRegistry`.

## FAssets v1.3 direct minting

- Docs: https://dev.flare.network/fassets/developer-guides/fassets-direct-minting
- Flow: single XRPL payment to the FXRP Core Vault address, memo-encoded,
  no collateral reservation, no agent selection. An executor calls
  `executeDirectMinting` on Flare and receives a flat fee for finalizing.
- **Memo format** (32 bytes total):
  `[8-byte prefix][4-byte zero padding][20-byte recipient address]`
  - Direct minting prefix: `4642505266410018`
  - Recipient: any Flare address, including a contract address — this is a
    standard ERC-20 mint target, so no special-casing is expected, but
    **confirm this empirically on Coston2 before relying on it in the
    architecture**, it's the one unverified assumption the whole product
    rests on.
- **Repeat minters / subscriptions**: use the destination-tag flow via
  `IMintingTagManager` instead of constructing a memo per payment — reserve
  one tag, map it to a Flare address once, reuse it every billing cycle.
  This is the natural fit for Drip's renewal flow.
- Core Vault docs: https://dev.flare.network/fassets/core-vault
- FXRP overview: https://dev.flare.network/fxrp/overview
- Reference implementation: `flare-viem-starter` (viem/TypeScript examples
  of the direct-minting flow) — search Flare Foundation's GitHub org for
  the current repo location before writing integration code from scratch.

## Sablier (fork source)

- Contracts repo: https://github.com/sablier-labs/lockup
- Audits: https://github.com/sablier-labs/audits (Cantina + independent
  auditors)
- Docs: https://docs.sablier.com
- Architecture: singleton — all streams live in one `SablierLockup`
  contract, not one contract deployed per stream. Follow this pattern
  rather than deploying per-subscription contracts.
- License: historically Business Source License 1.1 on Sablier V2 Core
  (restricts *commercial production* use for ~4 years post-launch, then
  converts to GPL). Confirmed non-blocking for this build — testnet,
  non-commercial, hackathon submission — but check the current `LICENSE`
  file in the repo before assuming the terms are unchanged.
- Foundry install: `forge install sablier-labs/lockup`

## Drip deployment (Coston2, Aug 1 2026)

**LIVE deployment (v3, Aug 9 2026 — per-subscription escrow + no-overlap guard):**
- **DripSubscriptions**: `0xe55dc9Fbe39feBa6A6cAD0347F5F17E3af5501CB`
  (each subscription gets its own `DripEscrow`; the minting tag is bound to
  the escrow, not the wrapper — `mintingRecipient(tag) == escrow`. Payment
  lands in the escrow; `finalize` pulls it into a linear stream; early
  renewals wait in the escrow because `finalize`/`refundPending` revert
  while the current cycle is STREAMING — no overlapping streams, ever.
  `pendingFxrp(subscriptionId)`, `refundPending(subscriptionId)`,
  `planSubscriptionOf(planId, customer)`, `isActive(customer)` +
  `isActive(planId, customer)`.)
- **DripLockup**: `0x0Dbe50349C0CF45e8cF5417E100fc63a9fdb6589` (unchanged)
- **FXRP** (resolved at runtime): `0x0b6A3645c240605887a5532109323A3E12273dc7`
- **MintingTagManager** (resolved at runtime): `0x094511737909b626391106bBc21B25feb2D67B96`
- **AssetManagerFXRP** (registry): `0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA`

**E2E verified on-chain (v3, Aug 9):** plan 1 = "Amaka's Newsletter" /
"Weekly deep-dive on DeFi rails", 5 FXRP / 3600s → subscribe → tag **369**
reserved, ERC-721 minted to the subscription's **escrow**
`0x333B2741Ce4Ea915F311Cd8BCDf6193215c97a7f` (verified:
`mintingRecipient(369) == escrow` ✓ — v3's core fix) → escrow funded 5 FXRP
(any payer: the v2-wrapper leftovers were routed in as the "customer"
payment) → `pendingFxrp(1)` = 5M ✓ → `finalize` → **stream 6** STREAMING
(5 FXRP / 3600s, customer-sender, merchant-recipient, cycle 1) → both
`isActive` overloads = true → double-`finalize` **reverts** on-chain
(0x7bcb675a, status 0) and `refundPending` **reverts** while streaming
(0x31f8eaf6, status 0) — no-overlap guard proven live. Stream 6 ran its
full hour (statusOf → SETTLED), then the renewal: escrow refunded 5 FXRP →
`finalize` → **cycle 2, stream 7 STREAMING** (same tag 369, no
re-onboarding), and the merchant `withdrawMax`'d the settled stream 6 (5
FXRP). Live demo state: subscription 1 (tag 369) / stream 7, cycle 2 on
v3; **https://dripfxrp.vercel.app/#/s/1**.

**Second subscriber (Aug 9):** after the web faucet topped the contract
with 200 C2FLR (tag fees), subscription 2 created from
`0x396264b005d5426A222e4eD84801972bD7859B2C` (key `0x3c920168...` — note:
REFERENCE's old-customer key entry was wrong; this is the wallet it
actually controls): tag **372**, escrow `0xced419B26596800015006f14176a19A21080f01C`
(`mintingRecipient(372)` = escrow ✓), 5 FXRP funded → `finalize` →
**stream 8 STREAMING, cycle 1**, `isActive` = true. Contract holds
100 C2FLR = one more tag available. NOTE: REFERENCE's old-customer key
record is wrong — the key `0x3c920168...` derives to `0x396264b0...`,
not `0x464C34...`.

**Third subscriber — REAL direct mint (Aug 9):** subscription 3 from fresh
wallet `0xa248A54870AACFff643776f61459cb872c60f453` (key
`0xe65c3a85b4eb24b3da684d2beb57a28f112c39a80a06569c30e9a0ec94b4ea1f`): tag
**377**, escrow `0x37d75341BbDF4b6F9CbDac4F1e48e1F451229867`. **Real XRPL
testnet payment**: 5.2 XRP → vault `rDhpmiPq4BVBDWMVdSrmkgt8thKyRzGV1p`,
`DestinationTag: 377` (tx `728B39D89F8DB08F0D51F59A012F0DEC8863E15718966E9EF38C3D59BA0D83AE`,
tesSUCCESS). Flare's live executor picked it up in ~2.5 min → **5 FXRP minted
into the escrow** (`pendingFxrp(3)` = 5M) → `finalize(3)` (gasUsed 343,786)
→ **stream 9 STREAMING, cycle 1**, `isActive(1, 0xa248...)` = true.

**REAL renewal (Aug 9, same tag):** while stream 9 was STREAMING, a second
real XRPL payment (5.2 XRP, tag 377, tx
`DE352DD18C8AA3E74A50D146C197006C459D458AE8A443119B9ADB1F362B1005`) was
minted by the executor into the escrow (`pendingFxrp(3)` = 5M). `finalize(3)`
**reverts live** with `CycleStillStreaming(3)` (`0x96439519`) — the
no-overlap guard holds real funds. The 5 FXRP sits as next-cycle credit;
when stream 9 SETTLES, `finalize` (now auto-armed in the UI) opens cycle 2
(stream 10) with the held funds. This is the full recurring workflow:
pay with the same tag every cycle, no re-onboarding, no double streams.

**E2E on a real mint — the complete loop:** subscribe (tag fee) → XRPL
testnet payment with tag → Flare executor mints FXRP to the tag's escrow →
finalize → stream → (cycle ends) → same tag again → held/credited → next
stream. Every step verified on-chain Aug 9.

**SUPERSEDED (v2, Aug 8 2026 — named plans + isActive):**
- **DripSubscriptions**: `0x2032C37ff66312788262E542E9a50c71ba5c2830`
  (Plan struct gained `name` + `description`; `createPlan(name, description,
  pricePerCycle, cycleDuration)`; `isActive(customer)` = last finalized
  stream still STREAMING; `lastStreamOf` mapping)
- **DripLockup**: `0x0Dbe50349C0CF45e8cF5417E100fc63a9fdb6589` (unchanged)
- **LockupMath** (library): `0xFeF1acf30d4B2B1Fb275895735aFF471db005e6b`
- **Helpers** (library): `0x7665058e08F74AD0E556aC42cF62b6E10F5b4E8B`
- **FXRP** (resolved at runtime): `0x0b6A3645c240605887a5532109323A3E12273dc7`
- **MintingTagManager** (resolved at runtime): `0x094511737909b626391106bBc21B25feb2D67B96`
- **AssetManagerFXRP** (registry): `0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA`

**E2E verified on-chain (cycle 1):** plan 1 (5 FXRP / 300s) → subscription 1,
tag **257** reserved on real MintingTagManager (ERC-721 minted to wrapper,
100 C2FLR reservation fee) → payment credited (simulated mint) → finalize →
stream 1 STREAMING, merchant withdrew vested FXRP → customer cancel →
unstreamed remainder refunded exactly (10−1−5+3.87 = 7.83 FXRP ✓) →
deactivated.

**E2E verified on-chain (cycle 2, fresh demo state):** subscription 2, tag
**258**, stream 2 STREAMING (customer 0x928047e135bB8F1E1EC805d571e7732F9b675dBf
→ merchant), left live for the demo. Customer wallet key in
`/tmp/opencode/faucet-wallet.txt` (session-local, not in repo).

**E2E verified on-chain (v2, Aug 8 2026 — the full SUBMIT cycle):**
- Plan 1 = "Amaka's Newsletter" / "Weekly deep-dive on DeFi rails", 5 FXRP /
  300s, active (created via cast — the UI locks monthly for merchants; the
  short cycle makes the stream visibly move during demos).
- Subscribe → tag **358** reserved on MintingTagManager (ERC-721 minted to
  the v2 wrapper, 100 C2FLR fee) → payment 5 FXRP (simulated mint) →
  finalize → **stream 3** STREAMING → merchant `withdrawMax` partial
  (1.52 FXRP of the 5) → customer `cancel` → 3.13 FXRP refunded (vesting
  continued between reads; `isActive` = false) → renewal: same tag 358,
  no re-onboarding, pay 5 FXRP + finalize → **stream 4** STREAMING, cycle 2,
  `isActive` = true. `lastStreamOf` tracks the newest stream per customer.
- Live demo state: subscription 1 (tag 358) / stream 4 STREAMING on v2;
  plan 1 (5 FXRP/300s) on v1 with stream 2 still settled.
- **Sustained-drip demo (Aug 8):** plan 2 = "DRIP SIGNALS" / "Daily market
  signals, streamed in real time", 5 FXRP / **3600s**, sub 2, tag **359**,
  **stream 5 STREAMING** (customer → merchant, 1h window, ~1388 UBA/s —
  withdrawable ticks every ~7s on the live dashboard). v2 state — the
  v3 contract is the live one now.
- **v3 sustained demo (Aug 9):** plan 1 (5 FXRP / 3600s), sub 1, tag 369,
  stream 6 STREAMING — **https://dripfxrp.vercel.app/#/s/1**.

**v1 contract (superseded by v2, don't use):** `0x79fa101D31d30e764394b115E9738d27B185f3d9`
— still holds plan 1 / sub 2 (tag 258) demo state; v2 has no plans or
subscriptions yet (fresh slate for the named-plan demo).

**Stale deployments (superseded, don't use):** lockup
`0xDe97183b5CCb436440c2250E51579f12E4A6Cb1b` / wrapper
`0x81578ED3ea764EaEb1B345a5A024634C7900B28B` (pre-string-interface),
lockup `0x90846549d26283A59275c75b853cd249b5CFF0F1` / wrapper
`0xd6921ed112eD0F366bDeDA75183e3379b5fF0736` (pre-ERC721-receiver).
~100 C2FLR stuck in `0xd6921e...` (no spend path) — testnet, acceptable.

**Wallets:** deployer/merchant `0xF1D25481431CFc0226b706C240A390aCbbeDafd9`
(key `0xde064f4b...`), demo customer `0x928047e135bB8F1E1EC805d571e7732F9b675dBf`
(key `0xc866d895...`, `/tmp/opencode/faucet-wallet.txt`), subscriber 2
`0x396264b005d5426A222e4eD84801972bD7859B2C` (key `0x3c920168...`), old
customer `0x464C34704d76944C29672346d4532e22c43220e2` (key unknown — the
`0x3c920168...` key was misattributed in earlier notes; it controls
0x396264b0..., not this wallet), spare `0x80F6C3a87cC0b113c09637893Fe2Ad7503E3c5aC`
(key lost across sessions — ~76.9 C2FLR inaccessible, treat as stuck),
`0xDbf0077E2813209A79CD4716F04D7072B36F6A59` (key in `/tmp/opencode/eoa.json`).

**Funding situation (Aug 9 2026):** on-chain faucet
`0x1000000000000000000000000000000000000001` pool is dry (balance 0, calls
revert); tag reservation fee is 100 C2FLR per new subscription (tags 358,
359, 369, 372 burned so far — 400 C2FLR total). Funding must come from the
web faucet (faucet.flare.network/coston2, ~25 C2FLR/request, captcha). Gas
price ~1.5-1.6k gwei. The v3 contract holds 100 C2FLR (one more tag
available); wallets: customer ~82, deployer ~2.5, subscriber 2 ~3. A fresh
subscriber's own wallet needs only ~2 C2FLR gas to click "RESERVE TAG &
SUBSCRIBE" in the UI.

**Gotchas learned:**
- Registry `getContractAddressByName` takes a dynamic `string`, not `bytes32`.
- MintingTagManager is NOT in the registry; resolve via
  `AssetManagerFXRP.getMintingTagManager()`.
- Minting tags are **ERC-721s**; the wrapper must implement
  `onERC721Received` or `reserve()` reverts.
- `reserve()` requires `msg.value == reservationFee()` **exactly**
  (100 C2FLR on Coston2) — the wrapper must be pre-funded and have a
  `receive()`.
- `forge create`: put the contract path FIRST; `--broadcast` is greedy
  (eats the next arg); passing `--libraries` for contracts without link
  references makes forge fall back to localhost:8545.
- `cast send`'s gas estimator intermittently reports "execution reverted"
  for token transfers when the sender's balance is thin — pass
  `--gas-limit` explicitly.
- Deployer runs out of gas fast at ~1.6k gwei; keep ≥5 C2FLR buffer.
- fAsset (FXRP) `transfer` needs ~151k gas — a `--gas-limit 100000` reverts
  out-of-gas (gasUsed == gasLimit, no logs). Let cast estimate, or use
  `--gas-limit 200000`.
- On-chain faucet `0x1000000000000000000000000000000000000001` pool is
  donation-funded; when empty it reverts at execution. Web faucet
  (faucet.flare.network/coston2) is the reliable on-ramp (~25 C2FLR/request).

## Frontend (`frontend/`, Aug 1 2026)

GitHub: https://github.com/bolajiev/drip (public; libs vendored, no
submodules — clone + `forge build` works out of the box).

Vite + React 19 + TS + Tailwind v4 + wagmi/viem + react-query. Design:
"utility meter editorial" — paper #f3f1ea, ink #17150e, acid #d7ff3f, Space
Grotesk + JetBrains Mono; hero motion = live ticking stream counter (Meter
recomputes vested amount client-side every 100ms, on-chain reads poll at 5s).

- `npm run dev` (port 5173), `npm run build` (tsc + vite, passes).
- Single chain: Coston2 (id 114); connector: injected (MetaMask/Rabby).
- **Layout (HashRouter, Aug 2 2026)**: `/` marketing landing (hero, how-it-
  works, merchant/customer blocks, trust, footer — no wallet connect in
  hero) · `/docs` · `/app` merchant+customer dashboard · `/s/:planId`
  customer subscribe flow: connect EVM wallet → subscribe (gets personal
  XRPL destination tag via MintingTagManager) → pay (Xaman payment-request
  QR: `https://xaman.app/detect/request:<vault>?amount=X&network=XRPL&dt=TAG`
  + simulated-FXRP fallback for testnet) → mint watcher (FXRP Transfer to
  DripSubscriptions) → finalize → live Meter + cancel.
- Merchant dashboard: per-plan shareable subscribe link + QR (QRCodeSVG),
  subscribers table w/ live accrued/withdrawable per stream, WITHDRAW per
  subscriber, total withdrawable header (withdrawableAmountOf sum).
- XRPL Core Vault address `rDhpmiPq4BVBDWMVdSrmkgt8thKyRzGV1p` from
  `AssetManagerFXRP.directMintingPaymentAddress()` (registry entry
  `CoreVaultManager` resolves to zero — use the direct call).
- Deploy: Vercel (token in env of this session), `vercel.json` = framework
  vite, build `npm run build`, output `dist`. Live:
  **https://dripfxrp.vercel.app** (canonical submission URL; aliased, prod
  deploys via `npx vercel deploy --prod --token <vcp_...>` then
  `npx vercel alias set <deployment> dripfxrp.vercel.app`; `drip.vercel.app`
  is taken; legacy alias `frontend-beta-black-19.vercel.app` still works).
- Contract addresses live in `src/lib/config.ts` (v3 since Aug 9); ABIs
  (hand-written, match live contract — verified via eth_call) in
  `src/lib/abis.ts`.
- Verification: all read calls (`nextPlanId`, `plans(1)`, `nextSubscriptionId`,
  `subscriptions(1)`) confirmed returning live state (plan 1 = 5 FXRP/3600s
  active; subscription 1 = tag 369, stream 6, cycle 1, active, escrow
  0x333B27... — v3). Mint detection on `/s/:planId` watches FXRP
  `Transfer` **to the subscription's escrow** (v3) — the v2 watch on
  DripSubscriptions was the payment-path bug this fixes.

## Real XRPL→FXRP direct mint — VERIFIED on Coston2 (Aug 9 2026)

Earlier note ("Coston2 has no v1.3 direct minting") was **WRONG** — that probe
used the wrong signature (`executeDirectMinting(bytes32)` = `0x30dbba46`). The
real entry point takes a full `IXRPPayment.Proof` tuple:
`executeDirectMinting((bytes32[],(bytes32,bytes32,uint64,uint64,(bytes32,address),(uint64,uint64,string,bytes32,bytes32,bytes32,int256,int256,int256,int256,bool,bytes,bool,uint256,uint8)))`
= **`0x78d0299e`** (Songbird = same selector). v1.3 direct minting is LIVE on
Coston2, Songbird, and mainnet. Coston2 AssetManagerFXRP
(`0xc1Ca88...`) shows 11 successful `0x78d0299e` calls on Aug 9 alone from an
**active third-party executor** `0x103b384064ae85577127097a7ccadfd6fb13f437`.
Coston2's vault is on XRPL **testnet** (free XRP).

**Live mint anatomy (real example, Aug 9):** testnet Payment 10.2 XRP
`r48xwNxQfnEVTgQXQhMcPLSGJ3qhpfRoWQ` → `rDhpmiPq4BVBDWMVdSrmkgt8thKyRzGV1p`,
`DestinationTag: 376` → executor `executeDirectMinting` (tx
`0xac0dbb66539b3f400f3308d21bf242a877c34e119344ff830afc23a09843241e`,
gasUsed 390,582) → `DirectMintingExecuted`: minted **10 FXRP**, minting fee
0.1, executor fee 0.1, target = tag's `mintingRecipient`.

**Coston2 direct-mint fee params (live reads):** executor fee 0x186a0 =
0.1 FXRP; fee BIPS 0x19 = 25 (0.25%); min fee 0.1 FXRP. Quote for a 5 FXRP
mint: **5.2 XRP** (5 net + 0.1 mint + 0.1 executor). Minting limits: hourly
50,000 FXRP, daily 200,000 FXRP, large-mint threshold 50,000 FXRP / 24h delay
— irrelevant at subscription scale.

**FDC attestation pipeline (be-your-own-executor, verified endpoints):**
- Verifier prepareRequest: `https://fdc-verifiers-testnet.flare.network/verifier/xrp/XRPPayment/prepareRequest`
  (sourceId `testXRP`; Songbird/mainnet use `fdc-verifiers-mainnet.flare.network` + sourceId `XRP`)
- Submit: `FdcHub.requestAttestation(abiEncodedRequest)` — FdcHub on Coston2
  via registry; fee via `fdcRequestFeeConfigurations().getRequestFee(bytes)`
- Proof: poll DA layer `https://ctn2-data-availability.flare.network/api/v1/fdc/proof-by-request-round-raw`
  (Songbird = `sgb-data-availability.flare.network`) after `Relay.isFinalized`
- Execute: `AssetManager.executeDirectMinting(proof, {value: executorFee})`
- Full reference pipeline: `flare-foundation/flare-viem-starter` `src/utils/fdc.ts`
  (`prepareXrpPaymentRequest` / `submitAttestationRequest` /
  `retrieveXrpPaymentProofWithRetry`)

**Memo format** (no tag needed, anyone can execute): 32 bytes =
`4642505266410018` + `00000000` + 20-byte recipient. Tag flow preferred for
renewals (reuse one tag per subscription, executor-agnostic).

**XRPL testnet wallet (for E2E, session-local):** `rh4cMfmuQU8KCs6Y2KZLCsNA9oN2WVNE3L`
(seed `sEdVn1DX2p4U6oGbNvaqHcdPVLYjDa9`, 100 test XRP from faucet). XRPL
testnet faucet: `faucet.altnet.rippletest.net/accounts` (POST, ~100 XRP).

## Hackathon

- Event page: https://dorahacks.io/hackathon/flaresummersignal
- Submission deadline: **August 14, 2026**
- Track: Interoperable asset products ($6,000 pool, $4k/$2k split)

## Not needed for Drip

FCC (Flare Confidential Compute) infrastructure — `FlareTeeManager`,
`register-tee`, tee-node/tee-proxy, indexer credentials, cloudflared
tunnels — belongs to the hackathon's Track 2 and is unrelated to this
build. Ignore FCC-related discussion in the hackathon chat unless project
scope explicitly changes.
