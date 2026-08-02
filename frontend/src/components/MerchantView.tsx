import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

import { usePlans, useSubscriptions, useStream, useFxrpBalance, useTotalWithdrawable } from "../lib/hooks";
import { subscriptionsAbi, lockupAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP, STATUS_LABEL } from "../lib/config";
import { fmtFxrp, fmtSeconds, fmtClock, shortAddr, subscribeLink } from "../lib/format";
import { TxButton } from "./TxButton";

function CreatePlan({ onCreated }: { onCreated: () => void }) {
  const [price, setPrice] = useState("5");
  const [days, setDays] = useState("30");

  const uba = BigInt(Math.round(parseFloat(price || "0") * 1e6));
  const duration = BigInt(Math.round(parseFloat(days || "0") * 86400));

  return (
    <section className="border border-ink">
      <header className="border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">CREATE YOUR FIRST PLAN</h2>
      </header>
      <div className="p-5">
        <p className="mb-4 max-w-xl font-mono text-[11px] leading-relaxed text-ink-soft">
          Name the price and the billing period. When you create the plan you get a{" "}
          <b className="text-ink">shareable subscribe link + QR</b> — put it on your site or send it
          to customers directly. That link is your storefront.
        </p>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
            <span className="mb-1 block font-mono text-[10px] text-ink-soft">BILLING PERIOD (DAYS)</span>
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
            onSettled={onCreated}
          >
            CREATE PLAN
          </TxButton>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  id,
  price,
  duration,
  active,
  merchant,
  me,
}: {
  id: number;
  price: bigint;
  duration: number;
  active: boolean;
  merchant: string;
  me: `0x${string}`;
}) {
  const link = subscribeLink(id);
  const isMine = merchant.toLowerCase() === me.toLowerCase();
  const [copied, setCopied] = useState(false);

  return (
    <div className="border border-ink">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink bg-ink px-4 py-2">
        <h3 className="font-mono text-xs font-semibold tracking-tight text-paper">
          PLAN #{id} · {fmtFxrp(price)} FXRP / {fmtSeconds(duration)}
        </h3>
        <span className={`font-mono text-[10px] ${active ? "text-acid" : "text-paper/50"}`}>
          {active ? "ACTIVE" : "INACTIVE"}
        </span>
      </header>
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div className="border border-rule bg-paper p-2">
          <QRCodeSVG value={link} size={88} fgColor="#17150e" bgColor="#f3f1ea" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-ink-soft">YOUR SUBSCRIBE LINK</p>
          <p className="truncate font-mono text-xs text-ink">{link}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="border border-ink px-3 py-1.5 font-mono text-[10px] font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              {copied ? "COPIED ✓" : "COPY LINK"}
            </button>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="border border-rule px-3 py-1.5 font-mono text-[10px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              OPEN →
            </a>
            {isMine && active && (
              <TxButton
                abi={subscriptionsAbi}
                address={DRIP_SUBSCRIPTIONS}
                functionName="deactivatePlan"
                args={[BigInt(id)]}
              >
                DEACTIVATE
              </TxButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriberRow({
  subscriptionId,
  planId,
  customer,
  tag,
  streamId,
  cycle,
  active,
  me,
}: {
  subscriptionId: number;
  planId: bigint;
  customer: string;
  tag: bigint;
  streamId: bigint;
  cycle: bigint;
  active: boolean;
  me: `0x${string}`;
}) {
  const stream = useStream(streamId);
  const st = stream.data;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="font-mono text-xs">
        <span className="font-semibold">{shortAddr(customer)}</span>
        <span className="ml-3 text-[10px] text-ink-soft">
          TAG {tag.toString()} · SUB #{subscriptionId} · CYCLE {cycle.toString()} · PLAN #{planId.toString()}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] tabular-nums">
        <span className="text-ink-soft">
          {st ? STATUS_LABEL[st.status] : active ? "ACTIVE" : "INACTIVE"}
        </span>
        {!st && (
          <span className="text-ink-soft">AWAITING FIRST CYCLE — NO STREAM YET</span>
        )}
        {st && (
          <>
            <span>
              ACCRUED <b>{fmtFxrp(st.streamed)}</b>
            </span>
            <span>
              WITHDRAWABLE <b className="text-ink">{fmtFxrp(st.withdrawable)}</b>
            </span>
            <span className="text-ink-soft">
              {fmtClock(st.stream.startTime)} → {fmtClock(st.stream.endTime)}
            </span>
            {st.withdrawable > 0n && st.status === 1 && (
              <TxButton
                abi={lockupAbi}
                address={DRIP_LOCKUP}
                functionName="withdrawMax"
                args={[streamId, me]}
              >
                WITHDRAW
              </TxButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function MerchantView({ me }: { me: `0x${string}` }) {
  const { plans } = usePlans();
  const { subs } = useSubscriptions();
  const bal = useFxrpBalance(me);
  const qc = useQueryClient();
  const onCreated = () => {
    qc.invalidateQueries({ queryKey: ["nextPlanId"] });
    qc.invalidateQueries({ queryKey: ["plan"] });
  };

  const myPlans = plans.filter((p) => p.data && p.data[0].toLowerCase() === me.toLowerCase());
  const myPlanIds = new Set(myPlans.map((p) => p.id));
  const mySubs = subs.filter((s) => s.data && myPlanIds.has(Number(s.data[0])));
  const { total: totalWithdrawable } = useTotalWithdrawable(
    mySubs.map((s) => s.data![3])
  );

  return (
    <div className="space-y-8">
      {myPlans.length === 0 ? (
        <CreatePlan onCreated={onCreated} />
      ) : (
        <>
          <CreatePlan onCreated={onCreated} />
          <section className="border border-ink">
            <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
              <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">YOUR PLANS</h2>
              <span className="font-mono text-[10px] text-paper/60">
                FXRP BALANCE <span className="font-semibold text-acid">{fmtFxrp(bal.data)}</span>
              </span>
            </header>
            <div className="space-y-4 p-4">
              {myPlans.map((p) =>
                p.data ? (
                  <PlanCard
                    key={p.id}
                    id={p.id}
                    price={p.data[1]}
                    duration={p.data[2]}
                    active={p.data[3]}
                    merchant={p.data[0]}
                    me={me}
                  />
                ) : null
              )}
            </div>
          </section>
        </>
      )}

      <section className="border border-ink">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink bg-ink px-4 py-2">
          <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">SUBSCRIBERS</h2>
          <span className="font-mono text-[10px] text-paper/60">
            {mySubs.length} TOTAL · WITHDRAWABLE{" "}
            <span className="font-semibold text-acid">{fmtFxrp(totalWithdrawable)}</span> FXRP
          </span>
        </header>
        <div className="divide-y divide-rule">
          {mySubs.length === 0 && (
            <p className="px-4 py-6 font-mono text-xs text-ink-soft">
              NO SUBSCRIBERS YET — SHARE YOUR PLAN LINK AND THE PAYMENTS WILL STREAM IN HERE.
            </p>
          )}
          {mySubs.map((s) => {
            const [planId, customer, tag, streamId, cycle, active] = s.data!;
            return (
              <SubscriberRow
                key={s.id}
                subscriptionId={s.id}
                planId={planId}
                customer={customer}
                tag={tag}
                streamId={streamId}
                cycle={cycle}
                active={active}
                me={me}
              />
            );
          })}
        </div>
        <footer className="border-t border-rule px-4 py-3 font-mono text-[10px] text-ink-soft">
          WITHDRAWABLE AMOUNTS REFRESH EVERY 5S — WITHDRAW PER SUBSCRIBER ABOVE
        </footer>
      </section>
    </div>
  );
}
