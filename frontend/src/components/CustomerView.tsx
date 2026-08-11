import { Link } from "react-router-dom";

import { usePlans, useSubscriptions, useStream, useFxrpBalance } from "../lib/hooks";
import { subscriptionsAbi, lockupAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP, STATUS_LABEL } from "../lib/config";
import { fmtFxrp, fmtClock, shortAddr } from "../lib/format";
import { TxButton } from "./TxButton";
import { Meter } from "./Meter";

function SubCard({
  id,
  planId,
  tag,
  streamId,
  cycle,
  active,
  escrow,
  planPrice,
}: {
  id: bigint;
  planId: bigint;
  tag: bigint;
  streamId: bigint;
  cycle: bigint;
  active: boolean;
  escrow: string;
  planPrice?: bigint;
}) {
  const stream = useStream(streamId);
  const st = stream.data;
  const escrowBal = useFxrpBalance(escrow as `0x${string}`);
  const pendingPayment = escrowBal.data !== undefined && escrowBal.data > 0n && streamId === 0n;

  return (
    <section className="border border-ink">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">
          SUBSCRIPTION #{id.toString()}
        </h2>
        <div className="font-mono text-[10px] text-paper/60">
          PLAN #{planId.toString()} · TAG {tag.toString()} · CYCLE {cycle.toString()} ·{" "}
          {active ? "ACTIVE" : "DEACTIVATED"}
        </div>
      </header>
      <div className="space-y-4 p-5">
        {streamId === 0n && (
          <div>
            <p className="font-mono text-xs text-ink-soft">NO ACTIVE CYCLE.</p>
            {pendingPayment && (
              <div className="mt-3 border border-rule bg-paper-deep p-3">
                <p className="font-mono text-[11px] text-ink-soft">
                  <b className="text-ink">{fmtFxrp(escrowBal.data)} FXRP</b> IS SITTING IN YOUR
                  ESCROW — next cycle&apos;s payment, waiting for the current one to finish.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <TxButton
                    abi={subscriptionsAbi}
                    address={DRIP_SUBSCRIPTIONS}
                    functionName="finalize"
                    args={[id]}
                    disabled={streamId !== 0n}
                  >
                    FINALIZE → OPEN STREAM
                  </TxButton>
                  <TxButton
                    abi={subscriptionsAbi}
                    address={DRIP_SUBSCRIPTIONS}
                    functionName="refundPending"
                    args={[id]}
                  >
                    REFUND IT BACK
                  </TxButton>
                </div>
              </div>
            )}
            <Link
              to={`/s/${planId.toString()}`}
              className="mt-3 inline-block border border-ink bg-acid px-4 py-2 font-mono text-xs font-semibold tracking-tight text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              FUND NEXT CYCLE →
            </Link>
          </div>
        )}
        {st && streamId > 0n && (
          <>
            <Meter
              deposit={st.stream.amounts.deposited}
              startTime={st.stream.startTime}
              endTime={st.stream.endTime}
              wasCanceled={st.stream.wasCanceled}
              initialStreamed={st.streamed}
            />
            <div className="grid gap-1 font-mono text-[11px] tabular-nums sm:grid-cols-4">
              <span>STATUS <b>{STATUS_LABEL[st.status]}</b></span>
              <span>STREAMED <b>{fmtFxrp(st.streamed)}</b></span>
              <span>WITHDRAWABLE <b>{fmtFxrp(st.withdrawable)}</b></span>
              <span>REFUNDABLE <b>{fmtFxrp(st.refundable)}</b></span>
            </div>
            <div className="font-mono text-[10px] text-ink-soft">
              {fmtClock(st.stream.startTime)} → {fmtClock(st.stream.endTime)} · TO MERCHANT{" "}
              {shortAddr(st.recipient)} · {fmtFxrp(planPrice)}/CYCLE
            </div>
            <div className="flex flex-wrap gap-3">
              {st.status === 1 && (
                <TxButton abi={lockupAbi} address={DRIP_LOCKUP} functionName="cancel" args={[streamId]}>
                  CANCEL & REFUND REMAINDER
                </TxButton>
              )}
              {(st.status === 3 || st.status === 4) && active && (
                <TxButton
                  abi={subscriptionsAbi}
                  address={DRIP_SUBSCRIPTIONS}
                  functionName="deactivateSubscription"
                  args={[id]}
                >
                  CLOSE SUBSCRIPTION
                </TxButton>
              )}
            </div>
            {escrowBal.data !== undefined && escrowBal.data > 0n && (
              <div className="border border-rule bg-paper-deep p-3">
                <p className="font-mono text-[11px] text-ink-soft">
                  NEXT CYCLE PAID — <b className="text-ink">{fmtFxrp(escrowBal.data)} FXRP</b> waits
                  in your escrow until this cycle ends (early payments can&apos;t double-stream).
                </p>
                <div className="mt-2">
                  <TxButton
                    abi={subscriptionsAbi}
                    address={DRIP_SUBSCRIPTIONS}
                    functionName="refundPending"
                    args={[id]}
                  >
                    REFUND IT BACK
                  </TxButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function CustomerView({ me }: { me: `0x${string}` }) {
  const { subs } = useSubscriptions();
  const { plans } = usePlans();

  const mySubs = subs.filter((s) => s.data && s.data[1].toLowerCase() === me.toLowerCase());

  if (mySubs.length === 0) {
    return (
      <div className="border border-dashed border-rule px-6 py-16 text-center">
        <p className="font-mono text-sm text-ink-soft">NO SUBSCRIPTIONS YET</p>
        <p className="mx-auto mt-3 max-w-md font-mono text-[11px] leading-relaxed text-ink-soft">
          You don&apos;t browse plans here — a merchant sends you their subscribe link. Open one and
          you&apos;ll land on a payment page with your own destination tag.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {mySubs.map((s) => {
        const [planId, , tag, streamId, cycle, active, escrow] = s.data!;
        const plan = plans.find((p) => p.id === Number(planId));
        return (
          <SubCard
            key={s.id}
            id={BigInt(s.id)}
            planId={planId}
            tag={tag}
            streamId={streamId}
            cycle={cycle}
            active={active}
            escrow={escrow}
            planPrice={plan?.data?.[1]}
          />
        );
      })}
    </div>
  );
}
