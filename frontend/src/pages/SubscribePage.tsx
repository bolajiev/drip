import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount, useWriteContract } from "wagmi";

import { usePlans, useSubscriptions, useStream, useFxrpBalance, useDirectMintQuote } from "../lib/hooks";
import { subscriptionsAbi, lockupAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP, FXRP_VAULT_XRPL, XRPL_TESTNET_WALLET_URL, XRPL_FAUCET_URL, STATUS_LABEL } from "../lib/config";
import { fmtFxrp, fmtSeconds, fmtClock, shortAddr, subscribeLink } from "../lib/format";
import { ConnectButton, OpenInMetaMask } from "../components/Wallet";
import { TxButton } from "../components/TxButton";
import { Meter } from "../components/Meter";

type Step = "CONNECT" | "SUBSCRIBE" | "PAY" | "MINT" | "STREAM";

function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["CONNECT", "SUBSCRIBE", "PAY", "MINT", "STREAM"];
  const labels: Record<Step, string> = {
    CONNECT: "CONNECT WALLET",
    SUBSCRIBE: "GET DESTINATION TAG",
    PAY: "PAY IN XRP",
    MINT: "MINT DETECTED",
    STREAM: "STREAM ACTIVE",
  };
  const idx = order.indexOf(step);
  return (
    <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
      {order.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`border px-2 py-1 ${
              i < idx
                ? "border-ink bg-acid text-ink"
                : i === idx
                  ? "border-ink bg-ink text-paper"
                  : "border-rule text-ink-soft"
            }`}
          >
            {labels[s]}
          </span>
          {i < order.length - 1 && <span className="text-rule">→</span>}
        </li>
      ))}
    </ol>
  );
}

/** Fires the finalize tx once the moment funds are detected, so the stream opens by itself. */
function AutoFinalize({ subscriptionId }: { subscriptionId: bigint }) {
  const { writeContract, isPending, error } = useWriteContract();
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      writeContract({
        address: DRIP_SUBSCRIPTIONS,
        abi: subscriptionsAbi,
        functionName: "finalize",
        args: [subscriptionId],
      } as any);
    }
  }, [writeContract, subscriptionId]);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-acid-deep" />
        <span className="text-ink">
          {isPending ? "OPENING YOUR STREAM — APPROVE IN YOUR WALLET…" : "FUNDS RECEIVED — OPENING YOUR STREAM…"}
        </span>
      </div>
      {error && <span className="font-mono text-[10px] leading-snug text-red-800">{error.message}</span>}
    </div>
  );
}

function PayStep({
  tag,
  escrow,
  priceUba,
  subscriptionId,
  sent,
  setSent,
  ready,
  renewal = false,
}: {
  tag: bigint;
  escrow: string;
  priceUba: bigint;
  subscriptionId: bigint;
  sent: boolean;
  setSent: (b: boolean) => void;
  ready: boolean;
  renewal?: boolean;
}) {
  const priceXrp = Number(priceUba) / 1e6;
  const { totalUba } = useDirectMintQuote(priceUba);
  const totalXrp = totalUba !== undefined ? Number(totalUba) / 1e6 : undefined;
  const pending = useFxrpBalance(escrow as `0x${string}`);

  const status: "waiting" | "sent" | "ready" = ready ? "ready" : sent ? "sent" : "waiting";

  const vault = FXRP_VAULT_XRPL;
  const copy = (text: string) => () => {
    navigator.clipboard?.writeText(text);
    setSent(true);
  };

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">
          {renewal ? "RENEW — PAY FOR THE NEXT CYCLE" : "PAY FOR THE CYCLE"}
        </h2>
        <span className="font-mono text-[10px] text-paper/60">TAG {tag.toString()}</span>
      </header>
      <div className="space-y-5 p-5">
        <div className="grid gap-3 font-mono text-[11px] sm:grid-cols-3">
          <div className="border border-ink bg-paper-deep p-3">
            <p className="text-ink-soft">SEND</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {totalXrp !== undefined ? `${totalXrp.toFixed(2)} XRP` : "QUOTING…"}
            </p>
            <p className="mt-1 text-[10px] text-ink-soft">
              NET {priceXrp.toFixed(2)} + MINT FEE + EXECUTOR FEE (READ LIVE FROM THE ASSET MANAGER)
            </p>
          </div>
          <div className="border border-ink bg-paper-deep p-3">
            <p className="text-ink-soft">TO (FXRP CORE VAULT)</p>
            <p className="mt-1 break-all text-ink">{vault}</p>
            <button
              onClick={copy(vault)}
              className="mt-2 border border-rule px-2 py-1 text-[10px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              COPY ADDRESS
            </button>
          </div>
          <div className="border border-ink bg-paper-deep p-3">
            <p className="text-ink-soft">DESTINATION TAG</p>
            <p className="mt-1 text-lg font-semibold text-ink">{tag.toString()}</p>
            <button
              onClick={copy(tag.toString())}
              className="mt-2 border border-rule px-2 py-1 text-[10px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              COPY TAG
            </button>
          </div>
        </div>

        <p className="max-w-2xl font-mono text-[11px] leading-relaxed text-ink-soft">
          {renewal ? (
            <>
              Your previous cycle has settled. Renew with the <b className="text-ink">same destination
              tag</b> — the minted FXRP lands in your escrow and your stream reopens automatically.
            </>
          ) : (
            <>
              Send exactly this amount in <b className="text-ink">testnet XRP</b> from the official XRPL
              Testnet wallet with the destination tag. Flare&apos;s live executor picks the payment up and
              mints FXRP straight into your subscription&apos;s escrow — usually within a couple of
              minutes. Get test XRP from the XRPL Testnet Faucet (1000 XRP per claim).
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={XRPL_TESTNET_WALLET_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setSent(true)}
            className="border border-ink bg-acid px-4 py-2 font-mono text-xs font-semibold tracking-tight text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            OPEN XRPL TESTNET WALLET →
          </a>
          <a
            href={XRPL_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-rule px-4 py-2 font-mono text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            GET TEST XRP
          </a>
          <span className="font-mono text-[10px] tabular-nums text-ink-soft">
            IN ESCROW {fmtFxrp(pending.data)}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className={`inline-block h-2 w-2 rounded-full ${status === "ready" ? "bg-acid-deep" : "bg-rule"}`} />
          <span className="text-ink-soft">
            {status === "waiting" && "AWAITING PAYMENT"}
            {status === "sent" && "PAYMENT SENT — waiting for the mint…"}
            {status === "ready" && "FUNDS RECEIVED — open the stream"}
          </span>
        </div>

        {status === "ready" && (
          <>
            <AutoFinalize subscriptionId={subscriptionId} />
            <div className="flex items-center gap-3">
              <TxButton
                abi={subscriptionsAbi}
                address={DRIP_SUBSCRIPTIONS}
                functionName="finalize"
                args={[subscriptionId]}
              >
                FINALIZE → OPEN STREAM
              </TxButton>
              <span className="font-mono text-[10px] text-ink-soft">AUTO-FINALIZE ARMED — OR CONFIRM MANUALLY</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StreamView({
  streamId,
  subscriptionId,
}: {
  streamId: bigint;
  subscriptionId: bigint;
}) {
  const stream = useStream(streamId);
  const st = stream.data;
  if (!st) return <p className="font-mono text-xs text-ink-soft">LOADING STREAM…</p>;

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">STREAM ACTIVE</h2>
        <span className="font-mono text-[10px] text-paper/60">
          STATUS {STATUS_LABEL[st.status]} · {fmtClock(st.stream.startTime)} → {fmtClock(st.stream.endTime)}
        </span>
      </header>
      <div className="space-y-4 p-5">
        <Meter
          deposit={st.stream.amounts.deposited}
          startTime={st.stream.startTime}
          endTime={st.stream.endTime}
          wasCanceled={st.stream.wasCanceled}
          initialStreamed={st.streamed}
        />
        <div className="grid gap-1 font-mono text-[11px] tabular-nums sm:grid-cols-4">
          <span>TO MERCHANT <b>{shortAddr(st.recipient)}</b></span>
          <span>STREAMED <b>{fmtFxrp(st.streamed)}</b></span>
          <span>WITHDRAWN <b>{fmtFxrp(st.stream.amounts.withdrawn)}</b></span>
          <span>YOUR REFUND IF YOU CANCEL NOW <b>{fmtFxrp(st.refundable)}</b></span>
        </div>
        <div className="flex flex-wrap gap-3">
          {st.status === 1 && (
            <TxButton abi={lockupAbi} address={DRIP_LOCKUP} functionName="cancel" args={[streamId]}>
              CANCEL & REFUND REMAINDER
            </TxButton>
          )}
          {(st.status === 3 || st.status === 4) && (
            <TxButton
              abi={subscriptionsAbi}
              address={DRIP_SUBSCRIPTIONS}
              functionName="deactivateSubscription"
              args={[subscriptionId]}
            >
              CLOSE SUBSCRIPTION
            </TxButton>
          )}
        </div>
      </div>
    </section>
  );
}

export function SubscribePage() {
  const { planId } = useParams();
  const { address, isConnected } = useAccount();
  const { loading, plans } = usePlans();
  const { subs } = useSubscriptions();

  const id = planId ? Number(planId) : NaN;
  const plan = plans.find((p) => p.id === id);
  const [sent, setSent] = useState(false);

  const mySub = isConnected && address
    ? subs.find(
        (s) => s.data && s.data[0] === BigInt(id) && s.data[1].toLowerCase() === address.toLowerCase()
      )
    : undefined;
  const escrow = mySub?.data?.[6];
  const streamId = mySub?.data ? mySub.data[3] : 0n;
  const subActive = mySub?.data ? mySub.data[5] : false;
  const stream = useStream(streamId);

  const pendingInEscrow = useFxrpBalance(escrow);
  const mintReady = pendingInEscrow.data !== undefined && pendingInEscrow.data > 0n;

  const streaming = stream.data?.status === 1;
  let step: Step = "CONNECT";
  if (!isConnected || !address) step = "CONNECT";
  else if (!mySub?.data) step = "SUBSCRIBE";
  else if (!subActive) step = "STREAM"; // closed — StreamView shows the deactivated state
  else if (streamId === 0n) step = mintReady ? "MINT" : "PAY";
  else if (streaming) step = "STREAM";
  else step = mintReady ? "MINT" : "PAY"; // settled → renewal

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
        <ConnectButton />
      </header>

      <main className="space-y-6 py-10">
        {plan === undefined && loading && (
          <p className="font-mono text-sm text-ink-soft">LOADING PLAN…</p>
        )}
        {plan === undefined && !loading && (
          <p className="font-mono text-sm text-ink-soft">PLAN NOT FOUND — check the link.</p>
        )}
        {plan && !plan.data && (
          <p className="font-mono text-sm text-ink-soft">LOADING PLAN…</p>
        )}
        {plan?.data && (
          <>
            <section className="border border-ink">
              <header className="border-b border-ink bg-ink px-4 py-2">
                <h1 className="font-mono text-xs font-semibold tracking-tight text-paper">
                  SUBSCRIBE{plan.data[4] ? ` — ${plan.data[4].toUpperCase()}` : ""} · PLAN #{id}
                </h1>
              </header>
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-sans text-3xl font-bold tracking-tight">
                    {fmtFxrp(plan.data[1])} <span className="text-lg text-ink-soft">FXRP</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-ink-soft">
                    EVERY {fmtSeconds(Number(plan.data[2]))} · FROM MERCHANT {shortAddr(plan.data[0])}
                  </div>
                  {plan.data[5] && (
                    <div className="mt-2 max-w-lg font-mono text-[11px] leading-relaxed text-ink-soft">
                      {plan.data[5]}
                    </div>
                  )}
                </div>
                <div className="w-full max-w-md">
                  <Stepper step={step} />
                </div>
              </div>
            </section>

            {!isConnected && (
              <section className="border border-dashed border-rule p-6 text-center">
                <p className="font-mono text-xs text-ink-soft">
                  CONNECT AN EVM WALLET (COSTON2) — IT BECOMES YOUR CANCEL-RIGHTS HOLDER AND YOUR
                  DESTINATION TAG IS GENERATED FROM IT
                </p>
                <div className="mx-auto mt-5 max-w-sm text-left">
                  <OpenInMetaMask />
                </div>
              </section>
            )}

            {isConnected && address && !mySub?.data && (
              <section className="border border-ink p-6">
                <h2 className="font-mono text-xs font-semibold">RESERVE YOUR DESTINATION TAG</h2>
                <p className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed text-ink-soft">
                  Drip reserves a tag (an ERC-721 on the Flare MintingTagManager) and binds it to
                  this subscription. Same tag funds every renewal — you never re-onboard.
                </p>
                <div className="mt-4">
                  <TxButton
                    abi={subscriptionsAbi}
                    address={DRIP_SUBSCRIPTIONS}
                    functionName="subscribe"
                    args={[BigInt(id)]}
                  >
                    RESERVE TAG & SUBSCRIBE
                  </TxButton>
                </div>
              </section>
            )}

            {isConnected && address && mySub?.data && streamId === 0n && (
              <PayStep
                tag={mySub.data[2]}
                escrow={mySub.data[6]}
                priceUba={plan.data[1]}
                subscriptionId={BigInt(mySub.id)}
                sent={sent}
                setSent={setSent}
                ready={mintReady}
              />
            )}

            {isConnected && address && mySub?.data && streamId > 0n && streaming && (
              <StreamView streamId={mySub.data[3]} subscriptionId={BigInt(mySub.id)} />
            )}

            {isConnected && address && mySub?.data && streamId > 0n && !streaming && subActive && (
              <PayStep
                tag={mySub.data[2]}
                escrow={mySub.data[6]}
                priceUba={plan.data[1]}
                subscriptionId={BigInt(mySub.id)}
                sent={sent}
                setSent={setSent}
                ready={mintReady}
                renewal
              />
            )}

            {isConnected && address && mySub?.data && streamId > 0n && !streaming && !subActive && (
              <section className="border border-ink">
                <header className="border-b border-ink bg-ink px-4 py-2">
                  <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">SUBSCRIPTION CLOSED</h2>
                </header>
                <div className="p-5 font-mono text-[11px] leading-relaxed text-ink-soft">
                  You canceled this subscription. The stream&apos;s unstreamed remainder was refunded
                  to your wallet by the lockup contract at cancellation.
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-rule py-6 font-mono text-[10px] text-ink-soft">
        COSTON2 TESTNET — TESTNET TOKENS ONLY. HACKATHON DEMO. · SHARE THIS PLAN:{" "}
        <span className="text-ink">{Number.isNaN(id) ? "" : subscribeLink(id)}</span>
      </footer>
    </div>
  );
}
