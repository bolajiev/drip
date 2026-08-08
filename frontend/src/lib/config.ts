import { defineChain } from "viem";

export const coston2 = defineChain({
  id: 114,
  name: "Flare Coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
    public: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Coston2 Explorer", url: "https://coston2-explorer.flare.network" },
  },
  testnet: true,
});

// Deployed on Coston2, 2026-08-01 (see REFERENCE.md).
export const DRIP_LOCKUP = "0x0Dbe50349C0CF45e8cF5417E100fc63a9fdb6589" as const;
// v2 (named plans + isActive), deployed 2026-08-08. v1 was 0x79fa101D31d30e764394b115E9738d27B185f3d9.
export const DRIP_SUBSCRIPTIONS = "0x2032C37ff66312788262E542E9a50c71ba5c2830" as const;
export const FXRP = "0x0b6A3645c240605887a5532109323A3E12273dc7" as const;
export const MINTING_TAG_MANAGER = "0x094511737909b626391106bBc21B25feb2D67B96" as const;

export const FAUCET_URL = "https://faucet.flare.network/coston2";
export const FXRP_DECIMALS = 6;

// WalletConnect Cloud project (free, cloud.walletconnect.com) — enables
// mobile wallet deep-links (RainbowKit modal).
export const WALLETCONNECT_PROJECT_ID = "c6c0f7585abca53dc55e957c2bee95c8";

// Coston2 FXRP Core Vault on XRPL — verified on-chain via
// AssetManagerFXRP.directMintingPaymentAddress() (2026-08-01).
export const FXRP_VAULT_XRPL = "rDhpmiPq4BVBDWMVdSrmkgt8thKyRzGV1p";

export const STATUS_LABEL = ["NULL", "STREAMING", "SETTLED", "CANCELED", "DEPLETED"] as const;
