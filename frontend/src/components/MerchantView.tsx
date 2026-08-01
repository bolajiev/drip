import { useState } from "react";

import { usePlans, useSubscriptions, useStream, useFxrpBalance } from "../lib/hooks";
import { subscriptionsAbi, lockupAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP } from "../lib/config";
import { fmtFxrp, fmtSeconds, fmtClock, shortAddr } from "../lib/format";
import { TxButton } from "./TxButton";
import { STATUS_LABEL } from "../lib/config";

function CreatePlan() {
  const [price, setPrice] = useState("5");
  const [days, setDays] = useState("30");

  const uba = BigInt(Math.round(parseFloat(price || "0") * 1e6));
  const duration = BigInt(Math.round(parseFloat(days || "0") * 86400));

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">NEW PLAN</h2>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] text-ink-soft">PRICE PER CYCLE (FXRP)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="w-full border border-rule bg-paper px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] text-ink-soft">CYCLE LENGTH (DAYS)</span>
          <input
            value={days}
            onChange={(e) => setDays(e.target.value)}
            inputMode="numeric"
            className="w-full border border-rule bg-paper px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-ink"
          />
        </label>
        <TxButton
          abi={subscriptionsAbi}
          address={DRIP_SUBSCRIPTIONS}
          functionName="createPlan"
          args={[uba, duration]}
          disabled={!uba || !duration}
        >
          CREATE PLAN
        </TxButton>
      </div>
    </section>
  );
}

function MerchantStreams({ me }: { me: `0x${string}` }) {
  const { subs } = useSubscriptions();

  // Collect every stream belonging to a subscription; show those paid to me.
  const rows = subs
    .filter((s) => s.data)
    .map((s) => {
      const [planId, customer, tag, streamId, cycle, active] = s.data!;
      return { subscriptionId: s.id, planId, customer, tag, streamId, cycle, active };
    });

  return (
    <section className="border border-ink">
      <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">INCOMING STREAMS</h2>
        <span className="font-mono text-[10px] text-paper/60">RECIPIENT = YOU</span>
      </header>
      <div className="divide-y divide-rule">
        {rows.length === 0 && (
          <p className="px-4 py-6 font-mono text-xs text-ink-soft">
            NO SUBSCRIPTIONS YET — CREATE A PLAN, THEN WAIT FOR CUSTOMERS.
          </p>
        )}
        {rows.map((r) => {
          if (r.streamId === 0n) {
            return (
              <div key={r.subscriptionId} className="px-4 py-3">
                <span className="font-mono text-xs">
                  SUB #{r.subscriptionId} · TAG <span className="font-semibold">{r.tag.toString()}</span>
                </span>
                <span className="ml-3 font-mono text-[10px] text-ink-soft">AWAITING PAYMENT</span>
              </div>
            );
          }
          return <StreamRow key={r.subscriptionId} sub={r} me={me} />;
        })}
      </div>
    </section>
  );
}

function StreamRow({
  sub,
  me,
}: {
  sub: { subscriptionId: number; planId: bigint; customer: string; tag: bigint; streamId: bigint; cycle: bigint };
  me: `0x${string}`;
}) {
  const { data } = useStream(sub.streamId);
  const isMine = data?.recipient.toLowerCase() === me.toLowerCase();
  if (!isMine) return null;

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs">
          SUB <span className="font-semibold">#{sub.subscriptionId}</span> · CYCLE {sub.cycle.toString()} · STREAM{" "}
          {sub.streamId.toString()}
        </span>
        <span className="font-mono text-[10px] text-ink-soft">
          CUSTOMER {shortAddr(sub.customer)} · TAG {sub.tag.toString()}
        </span>
      </div>
      {data && (
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] tabular-nums">
          <span>
            STATUS <span className="font-semibold">{STATUS_LABEL[data.status]}</span>
          </span>
          <span>
            STREAMED <span className="font-semibold">{fmtFxrp(data.streamed)}</span>
          </span>
          <span>
            WITHDRAWABLE <span className="font-semibold">{fmtFxrp(data.withdrawable)}</span>
          </span>
          <span>
            DEPOSIT <span className="font-semibold">{fmtFxrp(data.stream.amounts.deposited)}</span>
          </span>
          <span className="text-ink-soft">
            {fmtClock(data.stream.startTime)} → {fmtClock(data.stream.endTime)}
          </span>
          {data.withdrawable > 0n && data.status === 1 && (
            <TxButton
              abi={lockupAbi}
              address={DRIP_LOCKUP}
              functionName="withdrawMax"
              args={[sub.streamId, me]}
            >
              WITHDRAW {fmtFxrp(data.withdrawable)}
            </TxButton>
          )}
        </div>
      )}
    </div>
  );
}

export function MerchantView({ me }: { me: `0x${string}` }) {
  const { plans } = usePlans();
  const bal = useFxrpBalance(me);

  return (
    <div className="space-y-8">
      <CreatePlan />
      <MerchantStreams me={me} />
      <section className="border border-ink">
        <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
          <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">YOUR PLANS</h2>
          <span className="font-mono text-[10px] text-paper/60">
            FXRP BALANCE <span className="font-semibold text-acid">{fmtFxrp(bal.data)}</span>
          </span>
        </header>
        <div className="divide-y divide-rule">
          {plans.length === 0 && (
            <p className="px-4 py-6 font-mono text-xs text-ink-soft">NO PLANS YET.</p>
          )}
          {plans.map((p) =>
            p.data ? (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="font-mono text-xs">
                  PLAN <span className="font-semibold">#{p.id}</span> · {fmtFxrp(p.data[1])} FXRP /{" "}
                  {fmtSeconds(Number(p.data[2]))}
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[10px] ${p.data[3] ? "text-ink" : "text-ink-soft"}`}
                  >
                    {p.data[3] ? "ACTIVE" : "INACTIVE"}
                  </span>
                  {p.data[0].toLowerCase() === me.toLowerCase() && p.data[3] && (
                    <TxButton
                      abi={subscriptionsAbi}
                      address={DRIP_SUBSCRIPTIONS}
                      functionName="deactivatePlan"
                      args={[BigInt(p.id)]}
                    >
                      DEACTIVATE
                    </TxButton>
                  )}
                </span>
              </div>
            ) : null
          )}
        </div>
      </section>
    </div>
  );
}
