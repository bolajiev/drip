import { useState } from "react";
import type { ReactNode } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { shortAddr } from "../lib/format";

export function TxButton({
  abi,
  address,
  functionName,
  args,
  children,
  disabled,
  onSettled,
}: {
  abi: any;
  address: `0x${string}`;
  functionName: string;
  args: unknown[];
  children: ReactNode;
  disabled?: boolean;
  onSettled?: () => void;
}) {
  const { writeContract, data: hash, error, isPending: isWritePending } = useWriteContract();
  const { status } = useWaitForTransactionReceipt({ hash });
  const [justMined, setJustMined] = useState(false);

  const busy = isWritePending || status === "pending";
  const done = status === "success";
  const failed = status === "error";

  if (done && !justMined) {
    setJustMined(true);
    onSettled?.();
    setTimeout(() => setJustMined(false), 3000);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => writeContract({ address, abi, functionName, args } as any)}
        disabled={busy || disabled}
        className="border border-ink bg-acid px-4 py-2 font-mono text-xs font-semibold tracking-tight text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "…" : done ? "DONE ✓" : failed ? "FAILED" : children}
      </button>
      {error && <span className="font-mono text-[10px] leading-snug text-red-800">{error.message}</span>}
      {hash && <span className="font-mono text-[10px] text-ink-soft">tx {shortAddr(hash)}</span>}
    </div>
  );
}
