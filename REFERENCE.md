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

**LIVE deployment (final):**
- **DripLockup**: `0x0Dbe50349C0CF45e8cF5417E100fc63a9fdb6589`
- **DripSubscriptions**: `0x79fa101D31d30e764394b115E9738d27B185f3d9`
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

**Stale deployments (superseded, don't use):** lockup
`0xDe97183b5CCb436440c2250E51579f12E4A6Cb1b` / wrapper
`0x81578ED3ea764EaEb1B345a5A024634C7900B28B` (pre-string-interface),
lockup `0x90846549d26283A59275c75b853cd249b5CFF0F1` / wrapper
`0xd6921ed112eD0F366bDeDA75183e3379b5fF0736` (pre-ERC721-receiver).
~100 C2FLR stuck in `0xd6921e...` (no spend path) — testnet, acceptable.

**Wallets:** deployer/merchant `0xF1D25481431CFc0226b706C240A390aCbbeDafd9`,
customer `0x464C34704d76944C29672346d4532e22c43220e2`, faucet-spare
`0x80F6C3a87cC0b113c09637893Fe2Ad7503E3c5aC` (unused ~83 C2FLR).

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

## Frontend (`frontend/`, Aug 1 2026)

GitHub: https://github.com/bolajiev/drip (public; libs vendored, no
submodules — clone + `forge build` works out of the box).

Vite + React 19 + TS + Tailwind v4 + wagmi/viem + react-query. Design:
"utility meter editorial" — paper #f3f1ea, ink #17150e, acid #d7ff3f, Space
Grotesk + JetBrains Mono; hero motion = live ticking stream counter (Meter
recomputes vested amount client-side every 100ms, on-chain reads poll at 5s).

- `npm run dev` (port 5173), `npm run build` (tsc + vite, passes).
- Single chain: Coston2 (id 114); connector: injected (MetaMask/Rabby).
- Views: MERCHANT (create plan, incoming streams w/ withdraw, plan list +
  deactivate) / CUSTOMER (plans, subscribe, fund cycle via simulated FXRP
  transfer — on mainnet this is the XRPL deposit with destination tag; the
  real direct-mint is deferred, see below — finalize, live Meter, cancel +
  refund, deactivate).
- Contract addresses live in `src/lib/config.ts`; ABIs (hand-written, match
  live contract — verified via eth_call) in `src/lib/abis.ts`.
- Verification: all read calls (`nextPlanId`, `plans(1)`, `nextSubscriptionId`,
  `subscriptions(1)`) confirmed returning live state (plan 1 = 5 FXRP/300s
  active; subscription 1 = tag 257, stream 1, cycle 1, deactivated).

## Direct mint (deferred)

TODO: verify real XRPL→FXRP direct mint into DripSubscriptions (memo
`0x4642505266410018 + zeros + recipient`; minting tag 257 already reserved
and held by the wrapper — renewals can use it). Deferred by decision —
testnet simulation via FXRP transfer is the demo path for now.

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
