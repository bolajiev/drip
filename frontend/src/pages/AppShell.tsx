import { useState } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";

import { Wallet, NetworkNote, OpenInMetaMask } from "../components/Wallet";
import { MerchantView } from "../components/MerchantView";
import { CustomerView } from "../components/CustomerView";

type View = "merchant" | "customer";

const GITHUB = "https://github.com/bolajiev/drip";

function Bar({ w }: { w: string }) {
  return <span className={`block h-2 bg-rule ${w}`} />;
}

function Caption({ children }: { children: string }) {
  return <p className="font-mono text-[10px] tracking-wide text-ink-soft">{children}</p>;
}

function MerchantSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="border border-rule bg-paper">
        <div className="flex items-center justify-between border-b border-rule px-4 py-2">
          <Bar w="w-44" />
          <Bar w="w-24" />
        </div>
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="block h-24 w-24 border border-rule bg-paper-deep" />
          <div className="space-y-3">
            <Bar w="w-56" />
            <Bar w="w-80" />
            <Bar w="w-36" />
          </div>
        </div>
      </div>
      <Caption>YOUR PLANS — PRICE, LINK AND QR — WILL APPEAR HERE</Caption>
      <div className="space-y-3 border border-rule bg-paper p-4">
        <Bar w="w-40" />
        <Bar w="w-32" />
      </div>
      <Caption>SUBSCRIBER COUNT AND WITHDRAWABLE BALANCE, LIVE</Caption>
    </div>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3 border border-rule bg-paper p-5">
          <Bar w="w-60" />
          <Bar w="w-1/2" />
          <Bar w="w-80" />
          <Bar w="w-44" />
        </div>
      ))}
      <Caption>YOUR SUBSCRIPTIONS — STREAM, CANCEL, REFUND — WILL APPEAR HERE</Caption>
    </div>
  );
}

function ConnectGate({ view }: { view: View }) {
  return (
    <div>
      <div className="pointer-events-none select-none opacity-30">
        {view === "merchant" ? <MerchantSkeleton /> : <SubscriptionsSkeleton />}
      </div>
      <div className="relative z-10 mx-auto -mt-10 w-full max-w-lg border border-ink bg-paper p-8 text-center shadow-[8px_8px_0_#17150e]">
        {view === "merchant" ? (
          <>
            <p className="font-mono text-sm font-semibold text-ink">
              CONNECT A WALLET TO CREATE AND MANAGE YOUR PLANS
            </p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              This is where subscriber payments land, and how you&apos;ll withdraw them. One tap —
              your wallet asks you to add the Coston2 testnet.
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-sm font-semibold text-ink">
              CONNECT A WALLET TO VIEW YOUR SUBSCRIPTIONS
            </p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              This wallet is how you cancel and get refunds — only you control it.
            </p>
          </>
        )}
        <div className="mt-6 flex justify-center">
          <NetworkNote />
        </div>
        <OpenInMetaMask />
      </div>
      <div className="mx-auto mt-6 max-w-lg border border-rule bg-paper-deep/40 p-4">
        <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
          Non-custodial — funds sit in the contract, not with Drip. Cancel anytime, get back what
          hasn&apos;t streamed yet.
        </p>
      </div>
    </div>
  );
}

export function AppShell() {
  const [view, setView] = useState<View>("merchant");
  const { address, isConnected } = useAccount();

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-5 sm:px-8">
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
              MY SUBSCRIPTIONS
            </button>
          </nav>
          <Wallet />
        </div>
      </header>

      <main className="py-8">
        {!isConnected ? (
          <ConnectGate view={view} />
        ) : view === "merchant" ? (
          <MerchantView me={address!} />
        ) : (
          <CustomerView me={address!} />
        )}
      </main>

      <footer className="border-t border-rule py-6 font-mono text-[10px] leading-relaxed text-ink-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/docs" className="underline decoration-acid-deep underline-offset-2 hover:text-ink">
            CONTRACTS & DEPLOYMENT →
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-acid-deep underline-offset-2 hover:text-ink"
            >
              GITHUB
            </a>
            <span>COSTON2 TESTNET</span>
          </div>
        </div>
        <p className="mt-3 text-[10px]">TESTNET TOKENS ONLY. HACKATHON DEMO. NOT FINANCIAL ADVICE.</p>
      </footer>
    </div>
  );
}
