import { Link } from "react-router-dom";

import { DRIP_LOCKUP, DRIP_SUBSCRIPTIONS, FXRP, MINTING_TAG_MANAGER, coston2 } from "../lib/config";

const GITHUB = "https://github.com/bolajiev/drip";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink">
      <header className="border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">{title}</h2>
      </header>
      <div className="p-5 font-mono text-xs leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export function Docs() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col px-5 sm:px-8">
      <header className="flex items-center justify-between border-b border-rule py-4">
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
          <Link to="/" className="text-ink-soft hover:text-ink">BACK</Link>
          <Link to="/app" className="border border-ink bg-ink px-4 py-2 text-paper transition-colors hover:bg-acid hover:text-ink">
            LAUNCH APP
          </Link>
        </nav>
      </header>

      <main className="space-y-6 py-10">
        <h1 className="font-sans text-4xl font-bold tracking-tight">DOCS</h1>
        <p className="max-w-2xl font-mono text-xs leading-relaxed text-ink-soft">
          DRIP is a trustless recurring-subscription product on Flare. A customer pays in XRP; the
          payment mints into FXRP and streams to a merchant over a billing period via a fork of
          Audited linear-vesting contracts. One XRPL payment funds one billing cycle.
        </p>

        <Block title="ARCHITECTURE">
          <ol className="list-decimal space-y-3 pl-4">
            <li>
              <b className="text-ink">XRPL side.</b> Customer sends one XRP payment to the FXRP Core
              Vault on XRPL with their subscription&apos;s destination tag (reserved via{" "}
              <code>IMintingTagManager</code>). Tag-based routing — no memo to type.
            </li>
            <li>
              <b className="text-ink">Mint.</b> An FAssets executor calls{" "}
              <code>executeDirectMinting</code> on Flare; FXRP mints straight into the
              subscription&apos;s dedicated escrow contract (the minting tag is bound to the escrow,
              so tag 369 always lands in that subscription&apos;s escrow). No Drip backend involved.
            </li>
            <li>
              <b className="text-ink">Finalize.</b> When the payment lands, anyone can call{" "}
              <code>finalize</code>: the escrow&apos;s balance is pulled into a fresh linear stream
              and the cycle starts. Early renewal payments wait in the escrow — the contract never
              opens overlapping streams (the no-overlap guard reverts).
            </li>
            <li>
              <b className="text-ink">Stream.</b> The contract deposits the minted FXRP into a
              Linear <code>LockupLinear</code> stream targeting the merchant, with start/end
              times matching the billing period. The stream&apos;s sender is the customer, so they
              can cancel it directly.
            </li>
            <li>
              <b className="text-ink">Merchant.</b> Withdraws vested FXRP at any time (standard
              <code>withdraw</code>).
            </li>
            <li>
              <b className="text-ink">Cancel.</b> The customer can cancel at any time; the unvested
              remainder returns to them (<code>cancel</code>).
            </li>
            <li>
              <b className="text-ink">Renewal.</b> The customer reuses the same reserved tag to fund
              the next cycle — no re-onboarding.
            </li>
          </ol>
        </Block>

        <Block title="CONTRACTS">
          <ul className="space-y-2">
            <li>
              <b className="text-ink">DripSubscriptions</b> — thin factory: maps a subscription /
              destination tag to a merchant + billing period. Each subscription gets its own
              escrow (the tag&apos;s minting recipient); <code>finalize</code> converts escrow
              balances into streams, <code>refundPending</code> returns un-credited payments. Plans
              carry a name + description. The only new logic in the project.
            </li>
            <li>
              <b className="text-ink">DripLockup</b> —{" "}
              <code>LockupLinear</code>: deposit, linear accrual, <code>withdrawMax</code>,{" "}
              <code>cancel</code> (refunds remainder). Audited vesting math.
            </li>
            <li>
              <b className="text-ink">Runtime resolution</b> — FXRP and MintingTagManager addresses
              are resolved via <code>FlareContractRegistry</code>, never hardcoded.
            </li>
          </ul>
        </Block>

        <Block title="ACCESS CONTROL FOR MERCHANTS">
          <p className="max-w-2xl">
            <code className="text-ink">isActive(customer)</code> on DripSubscriptions answers the
            question a gated product asks before serving a customer:{" "}
            <i>&quot;is this address paid up right now?&quot;</i>. It returns true while the
            customer&apos;s most recently finalized cycle is still streaming (their last stream
            exists and has status STREAMING). The contract gates nothing itself — it is the read
            a merchant wires into their own paywall: check <code>isActive</code>, serve or deny.
            A renewal (new payment finalized) keeps it true; a cancellation flips it false at the
            moment the stream ends.
          </p>
        </Block>

        <Block title="DEPLOYMENT (COSTON2)">
          <div className="grid gap-1">
            <div>DRIP SUBSCRIPTIONS <span className="text-ink">{DRIP_SUBSCRIPTIONS}</span></div>
            <div>DRIP LOCKUP <span className="text-ink">{DRIP_LOCKUP}</span></div>
            <div>FXRP (resolved at runtime) <span className="text-ink">{FXRP}</span></div>
            <div>MINTING TAG MANAGER (resolved at runtime) <span className="text-ink">{MINTING_TAG_MANAGER}</span></div>
            <div className="mt-2">CHAIN <span className="text-ink">Coston2 · id {coston2.id}</span></div>
          </div>
        </Block>

        <Block title="REPO & SPECS">
          <div className="space-y-2">
            <p>
              Code: <a href={GITHUB} target="_blank" rel="noreferrer" className="underline decoration-acid-deep underline-offset-2 text-ink">{GITHUB}</a>
            </p>
            <p>
              Specs and research live in the repo: <code>PLAN.md</code> (research &amp; decision log),
              <code> DRIP.md</code> (build spec), <code>REFERENCE.md</code> (deployment log, memo
              format, gotchas), <code>LANDING.md</code> / <code>APP.md</code> (product specs).
            </p>
            <p>
              Tests: <code>forge test</code> — 34 tests covering the full subscribe → stream →
              cancel cycle, named plans, per-subscription escrows, the no-overlap guard and
              exact refunds.
            </p>
          </div>
        </Block>
      </main>

      <footer className="border-t border-rule py-6 font-mono text-[10px] text-ink-soft">
        COSTON2 TESTNET — HACKATHON DEMO, TESTNET TOKENS ONLY. NOT FINANCIAL ADVICE.
      </footer>
    </div>
  );
}
