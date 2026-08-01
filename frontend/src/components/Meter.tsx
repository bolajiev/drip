import { useEffect, useState } from "react";

import { fmtFxrp } from "../lib/format";

/**
 * Live ticking stream meter. Recomputes the vested amount client-side every
 * 100ms between on-chain reads, so the counter visibly drips.
 * All amounts are UBA (FXRP has 6 decimals).
 */
export function Meter({
  deposit,
  startTime,
  endTime,
  wasCanceled,
  initialStreamed,
}: {
  deposit: bigint;
  startTime: number;
  endTime: number;
  wasCanceled: boolean;
  initialStreamed: bigint;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 100);
    return () => clearInterval(id);
  }, []);

  let streamed: bigint;
  if (now <= startTime) {
    streamed = 0n;
  } else if (now >= endTime) {
    streamed = deposit;
  } else if (wasCanceled) {
    streamed = initialStreamed;
  } else {
    const elapsed = BigInt(now - startTime);
    const dur = BigInt(endTime - startTime);
    streamed = dur === 0n ? deposit : (deposit * elapsed) / dur;
  }
  if (streamed < initialStreamed) streamed = initialStreamed;
  if (streamed > deposit) streamed = deposit;

  const pct = deposit === 0n ? 0 : Number((streamed * 10000n) / deposit) / 100;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-4">
        <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
          {fmtFxrp(streamed, 3)}
          <span className="text-lg text-ink-soft"> FXRP</span>
        </div>
        <div className="font-mono text-xs tabular-nums text-ink-soft">{pct.toFixed(2)}%</div>
      </div>
      <div className="mt-2 h-1 w-full bg-paper-deep">
        <div
          className="h-full bg-acid-deep transition-[width] duration-200 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
