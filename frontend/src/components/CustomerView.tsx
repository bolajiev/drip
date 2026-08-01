import { usePlans, useSubscriptions, useStream, useFxrpBalance } from "../lib/hooks";
import { subscriptionsAbi, lockupAbi, fxrpAbi } from "../lib/abis";
import { DRIP_SUBSCRIPTIONS, DRIP_LOCKUP, FXRP, STATUS_LABEL } from "../lib/config";
import { fmtFxrp, fmtSeconds, fmtClock, shortAddr } from "../lib/format";
import { TxButton } from "./TxButton";
import { Meter } from "./Meter";

type Plan = { id: number; data: readonly [string, bigint, number, boolean] | undefined };

function PlanRow({
  id,
  merchant,
  price,
  duration,
  active,
  me,
  subscribed,
}: {
  id: bigint;
  merchant: string;
  price: bigint;
  duration: number;
  active: boolean;
  me: `0x${string}`;
  subscribed: boolean;
}) {
  const isMine = merchant.toLowerCase() === me.toLowerCase();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <div className="font-mono text-sm">
          <span className="font-semibold">{fmtFxrp(price)}</span> FXRP / {fmtSeconds(Number(duration))}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-ink-soft">
          PLAN #{id.toString()} · {shortAddr(merchant)} {isMine ? "· YOU" : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-[10px] ${active ? "text-ink" : "text-ink-soft"}`}>
          {active ? "ACTIVE" : "INACTIVE"}
        </span>
        {active && !subscribed && (
          <TxButton
            abi={subscriptionsAbi}
            address={DRIP_SUBSCRIPTIONS}
            functionName="subscribe"
            args={[id]}
          >
            SUBSCRIBE
          </TxButton>
        )}
        {subscribed && <span className="font-mono text-[10px] font-semibold">SUBSCRIBED</span>}
      </div>
    </div>
  );
}

function PayPanel({ me, tag, planPrice, subscriptionId }: {
  me: `0x${string}`;
  tag: bigint;
  planPrice: bigint;
  subscriptionId: bigint;
}) {
  const bal = useFxrpBalance(me);
  const pending = useFxrpBalance(DRIP_SUBSCRIPTIONS);

  return (
    <section className="border border-ink bg-paper-deep">
      <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">FUND CYCLE 1</h2>
        <span className="font-mono text-[10px] text-paper/60">DESTINATION TAG {tag.toString()}</span>
      </header>
      <div className="space-y-3 p-4">
        <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
          On mainnet, sending {fmtFxrp(planPrice)} XRP to the FXRP Core Vault with destination tag{" "}
          <span className="font-semibold text-ink">{tag.toString()}</span> mints FXRP straight into Drip&apos;s
          contract. On testnet, simulate that mint by moving faucet FXRP into the contract:
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <TxButton
            abi={fxrpAbi}
            address={FXRP}
            functionName="transfer"
            args={[DRIP_SUBSCRIPTIONS, planPrice]}
          >
            SIMULATE PAYMENT ({fmtFxrp(planPrice)} FXRP)
          </TxButton>
          <span className="font-mono text-[10px] tabular-nums text-ink-soft">
            YOUR BALANCE {fmtFxrp(bal.data)} · IN CONTRACT {fmtFxrp(pending.data)}
          </span>
        </div>
        {pending.data !== undefined && pending.data > 0n && (
          <div className="border border-ink bg-paper p-3">
            <p className="font-mono text-[11px] text-ink-soft">
              {fmtFxrp(pending.data)} FXRP IS WAITING IN THE CONTRACT — OPEN THE STREAM:
            </p>
            <div className="mt-2">
              <TxButton
                abi={subscriptionsAbi}
                address={DRIP_SUBSCRIPTIONS}
                functionName="finalize"
                args={[subscriptionId]}
              >
                FINALIZE → OPEN STREAM
              </TxButton>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SubscriptionCard({
  id,
  customer,
  tag,
  streamId,
  cycle,
  active,
  me,
}: {
  id: bigint;
  customer: string;
  tag: bigint;
  streamId: bigint;
  cycle: bigint;
  active: boolean;
  me: `0x${string}`;
}) {
  const stream = useStream(streamId);
  const isMine = customer.toLowerCase() === me.toLowerCase();
  if (!isMine) return null;

  const st = stream.data;

  return (
    <section className="border border-ink">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink bg-ink px-4 py-2">
        <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">
          SUBSCRIPTION #{id.toString()}
        </h2>
        <div className="font-mono text-[10px] text-paper/60">
          TAG {tag.toString()} · CYCLE {cycle.toString()} · {active ? "ACTIVE" : "DEACTIVATED"}
        </div>
      </header>
      <div className="space-y-4 p-4">
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
              <span>WITHDRAWN <b>{fmtFxrp(st.stream.amounts.withdrawn)}</b></span>
              <span>WITHDRAWABLE <b>{fmtFxrp(st.withdrawable)}</b></span>
              <span>REFUNDABLE <b>{fmtFxrp(st.refundable)}</b></span>
            </div>
            <div className="font-mono text-[10px] text-ink-soft">
              {fmtClock(st.stream.startTime)} → {fmtClock(st.stream.endTime)} · SENDER{" "}
              {shortAddr(st.stream.sender)} · RECIPIENT {shortAddr(st.recipient)}
            </div>
            <div className="flex flex-wrap gap-3">
              {st.status === 1 && (
                <TxButton
                  abi={lockupAbi}
                  address={DRIP_LOCKUP}
                  functionName="cancel"
                  args={[streamId]}
                >
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
          </>
        )}
        {streamId === 0n && (
          <p className="font-mono text-xs text-ink-soft">NO STREAM YET — FUND THE CYCLE ABOVE TO BEGIN.</p>
        )}
      </div>
    </section>
  );
}

export function CustomerView({ me }: { me: `0x${string}` }) {
  const { plans } = usePlans();
  const { subs } = useSubscriptions();

  const mySubs = subs.filter((s) => s.data && s.data[1].toLowerCase() === me.toLowerCase());
  const subscribedPlanIds = new Set(mySubs.map((s) => s.data![0].toString()));

  const planById = (id: bigint): Plan | undefined =>
    plans.find((p) => BigInt(p.id) === id);

  return (
    <div className="space-y-8">
      <section className="border border-ink">
        <header className="flex items-center justify-between border-b border-ink bg-ink px-4 py-2">
          <h2 className="font-mono text-xs font-semibold tracking-tight text-paper">AVAILABLE PLANS</h2>
          <span className="font-mono text-[10px] text-paper/60">{plans.length} LISTED</span>
        </header>
        <div className="divide-y divide-rule">
          {plans.length === 0 && (
            <p className="px-4 py-6 font-mono text-xs text-ink-soft">NO PLANS LISTED YET.</p>
          )}
          {plans.map((p) =>
            p.data ? (
              <PlanRow
                key={p.id}
                id={BigInt(p.id)}
                merchant={p.data[0]}
                price={p.data[1]}
                duration={p.data[2]}
                active={p.data[3]}
                me={me}
                subscribed={subscribedPlanIds.has(p.id.toString())}
              />
            ) : null
          )}
        </div>
      </section>

      {mySubs.map((s) => {
        const [planId, customer, tag, streamId, cycle, active] = s.data!;
        const plan = planById(planId);
        return (
          <div key={s.id} className="space-y-4">
            {cycle === 0n && plan?.data && (
              <PayPanel
                me={me}
                tag={tag}
                planPrice={plan.data[1]}
                subscriptionId={BigInt(s.id)}
              />
            )}
            <SubscriptionCard
              id={BigInt(s.id)}
              customer={customer}
              tag={tag}
              streamId={streamId}
              cycle={cycle}
              active={active}
              me={me}
            />
          </div>
        );
      })}
    </div>
  );
}
