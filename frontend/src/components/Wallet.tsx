import { useMemo } from "react";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";

import { FAUCET_URL, FXRP_DECIMALS } from "../lib/config";
import { shortAddr } from "../lib/format";

export function ConnectButton({ className = "" }: { className?: string }) {
  const { connect, connectors, isPending } = useConnect();
  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className={`border border-ink bg-ink px-4 py-2 font-mono text-xs font-semibold tracking-tight text-paper transition-colors hover:bg-acid hover:text-ink disabled:opacity-50 ${className}`}
    >
      {isPending ? "CONNECTING…" : "CONNECT WALLET"}
    </button>
  );
}

export function Wallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: c2flr } = useBalance({ address });

  if (!isConnected || !address) {
    return <ConnectButton />;
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href={FAUCET_URL}
        target="_blank"
        rel="noreferrer"
        className="hidden border border-rule px-3 py-2 font-mono text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink sm:block"
      >
        + FAUCET
      </a>
      <div className="flex items-center gap-2 border border-rule px-3 py-2 font-mono text-xs">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-acid-deep" />
        {c2flr ? `${Number(c2flr.value / 10n ** 18n).toFixed(2)} C2FLR` : ""}
      </div>
      <button
        onClick={() => disconnect()}
        className="border border-ink px-3 py-2 font-mono text-xs font-semibold transition-colors hover:bg-ink hover:text-paper"
        title={address}
      >
        {shortAddr(address)}
      </button>
    </div>
  );
}

export function NetworkNote() {
  return (
    <div className="flex items-start gap-2 border border-rule bg-paper-deep px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-soft">
      <span className="mt-px inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-acid-deep" />
      <span>
        COSTON2 TESTNET — faucet FXRP + C2FLR from{" "}
        <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="underline decoration-acid-deep underline-offset-2 hover:text-ink">
          faucet.flare.network
        </a>
      </span>
    </div>
  );
}

export function useFxrpUnits() {
  return useMemo(() => 10n ** BigInt(FXRP_DECIMALS), []);
}
