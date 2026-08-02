import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

import { ConnectButton } from "../components/Wallet";
import { DRIP_LOCKUP, DRIP_SUBSCRIPTIONS, FXRP, MINTING_TAG_MANAGER, coston2 } from "../lib/config";
import { shortAddr } from "../lib/format";

const GITHUB = "https://github.com/bolajiev/drip";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border border-ink p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xl font-semibold text-acid-deep">{n}</span>
        <span className="h-px w-8 bg-rule" />
      </div>
      <h3 className="mt-4 font-sans text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

export function Landing() {
  const { address, isConnected } = useAccount();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/90 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center bg-ink">
              <svg viewBox="0 0 32 32" className="h-5 w-5">
                <path d="M16 4 C22 10 24 13 24 17 a8 8 0 1 1 -16 0 C8 13 10 10 16 4 Z" fill="#d7ff3f" />
                <rect x="14.5" y="21" width="3" height="6" fill="#f3f1ea" />
              </svg>
            </span>
            <span className="font-sans text-lg font-bold tracking-tight">DRIP</span>
          </Link>
          <nav className="flex items-center gap-5 font-mono text-xs font-semibold">
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("how");
              }}
              className="hidden text-ink-soft transition-colors hover:text-ink sm:block"
            >
              HOW IT WORKS
            </a>
            <Link to="/docs" className="text-ink-soft transition-colors hover:text-ink">
              DOCS
            </Link>
            <Link
              to="/app"
              className="border border-ink bg-ink px-4 py-2 text-paper transition-colors hover:bg-acid hover:text-ink"
            >
              LAUNCH APP
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-rule py-16 sm:py-24">
        <p className="mb-5 inline-block border border-rule px-3 py-1 font-mono text-[10px] tracking-widest text-ink-soft">
          XRP SUBSCRIPTIONS, STREAMLINED — FLARE / FASSETS
        </p>
        <h1 className="max-w-3xl font-sans text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Pay once in XRP.
          <br />
          It <span className="underline decoration-acid-deep decoration-4 underline-offset-4">streams</span> to the
          merchant.
        </h1>
        <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed text-ink-soft">
          Your XRP payment mints into FXRP and drips to a merchant over the billing period.
          Cancel anytime — the unstreamed remainder comes back to you. No auto-debits, no
          chargebacks, no second signature.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/app"
            className="border border-ink bg-acid px-5 py-3 font-mono text-sm font-semibold tracking-tight text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            LAUNCH APP
          </Link>
          <a
            href="#how"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("how");
            }}
            className="border border-ink px-5 py-3 font-mono text-sm font-semibold tracking-tight transition-colors hover:bg-ink hover:text-paper"
          >
            HOW IT WORKS ↓
          </a>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-b border-rule py-14 sm:py-20">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">HOW IT WORKS</h2>
          <span className="font-mono text-[10px] text-ink-soft">SCANNABLE IN 10 SECONDS</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            n="01"
            title="Send XRP"
            body="One payment from your existing XRPL wallet, to a destination tag that belongs to your subscription. You don't bridge anything."
          />
          <Step
            n="02"
            title="FXRP mints into a stream"
            body="The payment mints into FXRP directly inside Drip's contract and opens a stream to the merchant, running for the whole billing period."
          />
          <Step
            n="03"
            title="Merchant earns, you can cancel"
            body="The merchant draws down what has accrued — at any time. You can cancel at any moment and get back whatever hasn't streamed yet."
          />
        </div>
      </section>

      <section className="grid border-b border-rule md:grid-cols-2">
        <div className="border-b border-rule p-8 sm:p-10 md:border-b-0 md:border-r">
          <p className="font-mono text-[10px] tracking-widest text-ink-soft">FOR MERCHANTS</p>
          <h3 className="mt-3 font-sans text-2xl font-bold tracking-tight">Sell subscriptions in XRP</h3>
          <ul className="mt-5 space-y-3 font-mono text-xs leading-relaxed text-ink-soft">
            <li>· Accept XRP subscriptions — no payment rails to build</li>
            <li>· No chargebacks, no disputes: the contract pays you what accrues</li>
            <li>· Withdraw your accrued balance at any time</li>
            <li>· Customers pay straight from XRPL — no separate bridging step</li>
            <li>· Share one subscribe link; every customer gets their own tag</li>
          </ul>
        </div>
        <div className="p-8 sm:p-10">
          <p className="font-mono text-[10px] tracking-widest text-ink-soft">FOR CUSTOMERS</p>
          <h3 className="mt-3 font-sans text-2xl font-bold tracking-tight">Never pay for a cancelled month</h3>
          <ul className="mt-5 space-y-3 font-mono text-xs leading-relaxed text-ink-soft">
            <li>· Pay once per cycle, in XRP, from the wallet you already use</li>
            <li>· Watch your payment stream out — visible, second by second</li>
            <li>· Cancel anytime, trustlessly: the remainder returns to you</li>
            <li>· No card on file, no recurring authorization to revoke</li>
          </ul>
        </div>
      </section>

      <section className="border-b border-rule py-14 sm:py-20">
        <h2 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">WHY TRUST IT WITH MONEY</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-ink p-5">
            <h4 className="font-mono text-xs font-semibold">AUDITED STREAMING MATH</h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
              The vesting logic is forked from Sablier&apos;s Lockup contracts — in production since 2019, audited
              by Cantina and independent researchers. Drip doesn&apos;t re-invent the math; it wires it to FXRP.
            </p>
          </div>
          <div className="border border-ink p-5">
            <h4 className="font-mono text-xs font-semibold">NON-CUSTODIAL</h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
              Funds never sit with Drip. They live in the stream contract — a merchant can&apos;t drain your
              deposit early, and nobody can touch the unstreamed remainder except you.
            </p>
          </div>
          <div className="border border-ink p-5">
            <h4 className="font-mono text-xs font-semibold">CANCEL-ANYTIME GUARANTEE</h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
              Cancel is a contract call, not a request. The unstreamed balance returns to your wallet
              automatically — no merchant cooperation, no support ticket.
            </p>
          </div>
          <div className="border border-ink p-5">
            <h4 className="font-mono text-xs font-semibold">TESTNET — NO REAL FUNDS</h4>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
              This is a hackathon build on Coston2 testnet. All tokens are faucet testnet tokens. Nothing here
              is mainnet, and nothing is real money.
            </p>
          </div>
        </div>
      </section>

      <section id="launch" className="scroll-mt-20 border-b border-rule py-14 sm:py-20">
        <div className="border border-ink bg-ink p-8 text-paper sm:p-12">
          <h2 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">READY TO TRY IT?</h2>
          <p className="mt-3 max-w-lg font-mono text-xs leading-relaxed text-paper/60">
            Connect a wallet on Coston2 (MetaMask or Rabby). Merchant or customer — your choice, one page.
            Faucet tokens for both networks:{" "}
            <a
              href="https://faucet.flare.network/coston2"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-acid-deep underline-offset-2 hover:text-acid"
            >
              faucet.flare.network
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to="/app"
              className="border border-paper bg-acid px-5 py-3 font-mono text-sm font-semibold tracking-tight text-ink transition-colors hover:bg-paper"
            >
              LAUNCH APP →
            </Link>
            {!isConnected && <ConnectButton className="border-paper bg-transparent text-paper hover:bg-acid hover:text-ink" />}
            {isConnected && (
              <span className="font-mono text-xs text-paper/60">
                CONNECTED: {shortAddr(address)}
              </span>
            )}
          </div>
        </div>
      </section>

      <footer className="py-8 font-mono text-[10px] leading-relaxed text-ink-soft">
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
          <div className="flex items-center gap-4">
            <a href={GITHUB} target="_blank" rel="noreferrer" className="underline decoration-acid-deep underline-offset-2 hover:text-ink">
              GITHUB
            </a>
            <span>COSTON2 TESTNET · CHAIN ID {coston2.id}</span>
          </div>
        </div>
        <p className="mt-3 text-[10px]">HACKATHON DEMO — TESTNET TOKENS ONLY. NOT FINANCIAL ADVICE.</p>
      </footer>
    </div>
  );
}
