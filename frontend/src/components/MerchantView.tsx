import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

import { usePlans, useSubscriptions, useStream, useFxrpBalance, useTotalWithdrawable } from "../lib/hooks";
import { subscriptionsAbi, lockupAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP, STATUS_LABEL } from "../lib/config";
import { fmtFxrp, fmtSeconds, fmtClock, shortAddr, subscribeLink, explorerUrl } from "../lib/format";
import { TxButton } from "./TxButton";

const MONTHLY_SECONDS = 30 * 86400;

function ChecklistRow({
  done,
  active,
  step,
  title,
  body,
  extra,
}: {
  done?: boolean;
  active?: boolean;
  step: string;
  title: string;
  body: string;
  extra?: React.ReactNode;
}) {
  return (
    <li className={`flex items-start gap-3 px-4 py-3 ${active ? "bg-paper-deep/60" : ""}`}>
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center border font-mono text-xs font-semibold ${
          done
            ? "border-ink bg-acid text-ink"
            : active
              ? "border-ink bg-ink text-paper"
              : "border-rule text-ink-soft"
        }`}
      >
        {done ? "✓" : step}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-semibold">{title}</p>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink-soft">{body}</p>
        {extra}
      </div>
    </li>
  );
}

function PriceForm({ onCreated }: { onCreated: () => void }) {
  const [price, setPrice] = useState("5");
  const uba = BigInt(Math.round(parseFloat(price || "0") * 1e6));

  return (
    <div className="mt-3 border border-rule bg-paper p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] text-ink-soft">PRICE PER CYCLE (FXRP)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="w-full border border-rule bg-paper px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-ink"
          />
        </label>
        <TxButton
          abi={subscriptionsAbi}
          address={DRIP_SUBSCRIPTIONS}
          functionName="createPlan"
          args={[uba, BigInt(MONTHLY_SECONDS)]}
          disabled={!uba}
          onSettled={onCreated}
        >
          CREATE PLAN
        </TxButton>
      </div>
      <p className="mt-2 font-mono text-[10px] text-ink-soft">
        BILLING PERIOD: MONTHLY, LOCKED — MORE PERIODS COMING SOON
      </p>
    </div>
  );
}

function SetupChecklist({ me, onCreated }: { me: `0x${string}`; onCreated: () => void }) {
  return (
    <section className="border border-ink">
      <header className="border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">MERCHANT SETUP — 3 STEPS</h2>
      </header>
      <ol className="divide-y divide-rule">
        <ChecklistRow
          done
          step="1"
          title="CONNECT WALLET"
          body="This is where subscriber payments land, and how you'll withdraw them. One tap."
          extra={
            <a
              href={explorerUrl(me)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-mono text-[11px] text-ink underline decoration-acid-deep underline-offset-2"
            >
              {me}
            </a>
          }
        />
        <ChecklistRow
          active
          step="2"
          title="SET YOUR PRICE"
          body="Name the price in FXRP and how often it bills. You can add more plans later."
          extra={<PriceForm onCreated={onCreated} />}
        />
        <ChecklistRow
          step="3"
          title="SHARE YOUR LINK"
          body="Anyone who opens it can subscribe with XRP they already hold — no wallet setup on their side. Your link + QR appear here the moment the plan is live."
        />
      </ol>
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
  streamIds,
}: {
  id: number;
  price: bigint;
  duration: number;
  active: boolean;
  merchant: string;
  me: `0x${string}`;
  streamIds: bigint[];
}) {
  const link = subscribeLink(id);
  const isMine = merchant.toLowerCase() === me.toLowerCase();
  const [copied, setCopied] = useState(false);
  const { total: planWithdrawable } = useTotalWithdrawable(streamIds);

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
          <QRCodeSVG value={link} size={96} fgColor="#17150e" bgColor="#f3f1ea" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-ink-soft">YOUR SUBSCRIBE LINK</p>
          <p className="truncate font-mono text-xs text-ink">{link}</p>
          <p className="mt-1.5 font-mono text-[11px] tabular-nums text-ink-soft">
            {streamIds.length} SUBSCRIBER{streamIds.length === 1 ? "" : "S"} · WITHDRAWABLE{" "}
            <b className="text-ink">{fmtFxrp(planWithdrawable)}</b> FXRP
          </p>
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
        {!st && <span className="text-ink-soft">AWAITING FIRST CYCLE — NO STREAM YET</span>}
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
  const { total: totalWithdrawable } = useTotalWithdrawable(mySubs.map((s) => s.data![3]));

  return (
    <div className="space-y-8">
      {myPlans.length === 0 ? (
        <SetupChecklist me={me} onCreated={onCreated} />
      ) : (
        <>
          <div className="flex items-center justify-between border border-ink bg-acid px-4 py-2">
            <span className="font-mono text-xs font-semibold tracking-tight text-ink">SETUP COMPLETE ✓</span>
            <span className="font-mono text-[10px] text-ink/70">LINK + QR BELOW — SHARE IT ANYWHERE</span>
          </div>
          <section className="border border-ink">
            <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
              <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">YOUR PLANS</h2>
              <span className="font-mono text-[10px] text-paper/60">
                FXRP BALANCE <span className="font-semibold text-acid">{fmtFxrp(bal.data)}</span>
              </span>
            </header>
            <div className="space-y-4 p-4">
              {myPlans.map((p) => {
                if (!p.data) return null;
                const streamIds = mySubs
                  .filter((s) => s.data && s.data[0] === BigInt(p.id))
                  .map((s) => s.data![3])
                  .filter((id) => id > 0n);
                return (
                  <PlanCard
                    key={p.id}
                    id={p.id}
                    price={p.data[1]}
                    duration={p.data[2]}
                    active={p.data[3]}
                    merchant={p.data[0]}
                    me={me}
                    streamIds={streamIds}
                  />
                );
              })}
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
              NO SUBSCRIBERS YET — SHARE YOUR PLAN LINK ABOVE AND THE PAYMENTS WILL STREAM IN HERE.
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
