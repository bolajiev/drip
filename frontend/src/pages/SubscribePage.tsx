import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useWatchContractEvent } from "wagmi";
import { QRCodeSVG } from "qrcode.react";

import { usePlans, useSubscriptions, useStream, useFxrpBalance } from "../lib/hooks";
import { subscriptionsAbi, fxrpAbi, lockupAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP, FXRP, STATUS_LABEL } from "../lib/config";
import { fmtFxrp, fmtSeconds, fmtClock, shortAddr, xamanPayLink, subscribeLink } from "../lib/format";
import { ConnectButton } from "../components/Wallet";
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

function PayStep({
  tag,
  priceUba,
  subscriptionId,
  sent,
  setSent,
  ready,
}: {
  tag: bigint;
  priceUba: bigint;
  subscriptionId: bigint;
  sent: boolean;
  setSent: (b: boolean) => void;
  ready: boolean;
}) {
  const priceXrp = Number(priceUba) / 1e6;
  const link = xamanPayLink(tag, priceXrp);
  const pending = useFxrpBalance(DRIP_SUBSCRIPTIONS);

  const status: "waiting" | "sent" | "ready" = ready ? "ready" : sent ? "sent" : "waiting";

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">PAY FOR THE CYCLE</h2>
        <span className="font-mono text-[10px] text-paper/60">TAG {tag.toString()}</span>
      </header>
      <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr]">
        <div className="mx-auto border border-ink bg-paper p-3">
          <QRCodeSVG value={link} size={176} fgColor="#17150e" bgColor="#f3f1ea" />
        </div>
        <div className="space-y-4">
          <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
            Send <b className="text-ink">{priceXrp} XRP</b> to the FXRP Core Vault from any XRPL
            wallet with destination tag <b className="text-ink">{tag.toString()}</b>. The tag routes
            the mint — the FXRP lands straight in Drip&apos;s contract. Fee note: the minting fee
            (0.25%, min 0.1) and executor fee (0.1) are deducted from the payment.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              onClick={() => setSent(true)}
              className="border border-ink bg-acid px-4 py-2 font-mono text-xs font-semibold tracking-tight text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              OPEN IN XAMAN →
            </a>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(link);
                setSent(true);
              }}
              className="border border-rule px-4 py-2 font-mono text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              COPY PAYMENT LINK
            </button>
            <span className="font-mono text-[10px] text-ink-soft">QR = SAME LINK</span>
          </div>

          <div className="border border-rule bg-paper-deep p-3">
            <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
              <b className="text-ink">Testnet demo:</b> Xaman request links point at mainnet XRPL, and
              the Coston2 mint executor runs on the testnet — so for the live demo, simulate the
              mint by moving faucet FXRP into the contract:
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <TxButton
                abi={fxrpAbi}
                address={FXRP}
                functionName="transfer"
                args={[DRIP_SUBSCRIPTIONS, priceUba]}
              >
                SIMULATE PAYMENT ({fmtFxrp(priceUba)} FXRP)
              </TxButton>
              <span className="font-mono text-[10px] tabular-nums text-ink-soft">
                IN CONTRACT {fmtFxrp(pending.data)}
              </span>
            </div>
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
            <TxButton
              abi={subscriptionsAbi}
              address={DRIP_SUBSCRIPTIONS}
              functionName="finalize"
              args={[subscriptionId]}
            >
              FINALIZE → OPEN STREAM
            </TxButton>
          )}
        </div>
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

  const [mintDetected, setMintDetected] = useState(false);
  const pendingInContract = useFxrpBalance(DRIP_SUBSCRIPTIONS);
  const baselineRef = useRef<bigint | undefined>(undefined);
  if (pendingInContract.data !== undefined && baselineRef.current === undefined) {
    baselineRef.current = pendingInContract.data;
  }
  const mintReady =
    mintDetected ||
    (pendingInContract.data !== undefined &&
      baselineRef.current !== undefined &&
      pendingInContract.data > baselineRef.current);

  useWatchContractEvent({
    address: FXRP,
    abi: fxrpAbi,
    eventName: "Transfer",
    args: { to: DRIP_SUBSCRIPTIONS },
    onLogs: () => setMintDetected(true),
    chainId: 114,
  });

  const mySub = isConnected && address
    ? subs.find(
        (s) => s.data && s.data[0] === BigInt(id) && s.data[1].toLowerCase() === address.toLowerCase()
      )
    : undefined;

  let step: Step = "CONNECT";
  if (!isConnected || !address) step = "CONNECT";
  else if (!mySub?.data) step = "SUBSCRIBE";
  else if (mySub.data[3] > 0n) step = "STREAM";
  else step = mintReady ? "MINT" : "PAY";

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 sm:px-8">
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

      <main className="flex-1 space-y-6 py-10">
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
                  SUBSCRIBE TO PLAN #{id}
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

            {isConnected && address && mySub?.data && mySub.data[3] === 0n && (
              <PayStep
                tag={mySub.data[2]}
                priceUba={plan.data[1]}
                subscriptionId={BigInt(mySub.id)}
                sent={sent}
                setSent={setSent}
                ready={mintReady}
              />
            )}

            {isConnected && address && mySub?.data && mySub.data[3] > 0n && (
              <StreamView streamId={mySub.data[3]} subscriptionId={BigInt(mySub.id)} />
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
