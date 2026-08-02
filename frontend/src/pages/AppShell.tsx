import { useState } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";

import { Wallet, NetworkNote } from "../components/Wallet";
import { MerchantView } from "../components/MerchantView";
import { CustomerView } from "../components/CustomerView";
import { DRIP_LOCKUP, DRIP_SUBSCRIPTIONS, FXRP, MINTING_TAG_MANAGER } from "../lib/config";
import { shortAddr } from "../lib/format";

type View = "merchant" | "customer";

const GITHUB = "https://github.com/bolajiev/drip";

export function AppShell() {
  const [view, setView] = useState<View>("merchant");
  const { address, isConnected } = useAccount();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
      <header className="flex items-center justify-between border-b border-rule py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center bg-ink">
            <svg viewBox="0 0 32 32" className="h-5 w-5">
              <path d="M16 4 C22 10 24 13 24 17 a8 8 0 1 1 -16 0 C8 13 10 10 16 4 Z" fill="#d7ff3f" />
              <rect x="14.5" y="21" width="3" height="6" fill="#f3f1ea" />
            </svg>
          </span>
          <span className="font-sans text-lg font-bold tracking-tight">DRIP</span>
          <span className="mt-px hidden font-mono text-[10px] text-ink-soft sm:block">
            XRP SUBSCRIPTION STREAMING
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="flex border border-ink">
            <button
              onClick={() => setView("merchant")}
              className={`px-4 py-2 font-mono text-xs font-semibold transition-colors ${
                view === "merchant" ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep"
              }`}
            >
              MERCHANT
            </button>
            <button
              onClick={() => setView("customer")}
              className={`px-4 py-2 font-mono text-xs font-semibold transition-colors ${
                view === "customer" ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep"
              }`}
            >
              CUSTOMER
            </button>
          </nav>
          <Wallet />
        </div>
      </header>

      <main className="flex-1 py-8">
        {!isConnected ? (
          <div className="border border-dashed border-rule px-6 py-16 text-center">
            <p className="font-mono text-sm text-ink-soft">CONNECT A WALLET ON COSTON2 TO BEGIN</p>
            <p className="mt-2 font-mono text-[11px] text-ink-soft">
              MetaMask / Rabby · chain id 114 · RPC https://coston2-api.flare.network/ext/C/rpc
            </p>
            <div className="mt-5 flex justify-center">
              <NetworkNote />
            </div>
          </div>
        ) : view === "merchant" ? (
          <MerchantView me={address!} />
        ) : (
          <CustomerView me={address!} />
        )}
      </main>

      <footer className="border-t border-rule py-6 font-mono text-[10px] leading-relaxed text-ink-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-1 sm:grid-cols-2">
            <div>
              SUBSCRIPTIONS <span className="text-ink">{shortAddr(DRIP_SUBSCRIPTIONS)}</span>
            </div>
            <div>
              LOCKUP <span className="text-ink">{shortAddr(DRIP_LOCKUP)}</span>
            </div>
            <div>
              FXRP <span className="text-ink">{shortAddr(FXRP)}</span>
            </div>
            <div>
              TAG MANAGER <span className="text-ink">{shortAddr(MINTING_TAG_MANAGER)}</span>
            </div>
          </div>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-acid-deep underline-offset-2 hover:text-ink"
          >
            GITHUB
          </a>
        </div>
        <p className="mt-3 text-[10px]">COSTON2 TESTNET — TESTNET TOKENS ONLY. HACKATHON DEMO. NOT FINANCIAL ADVICE.</p>
      </footer>
    </div>
  );
}
