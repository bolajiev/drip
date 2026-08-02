import { useQueries, useQuery } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { useConfig } from "wagmi";

import { lockupAbi, subscriptionsAbi, fxrpAbi } from "./abis";
import { DRIP_LOCKUP, DRIP_SUBSCRIPTIONS, FXRP, coston2 } from "./config";

export function usePlans() {
  const config = useConfig();
  const base = { chainId: coston2.id, address: DRIP_SUBSCRIPTIONS, abi: subscriptionsAbi } as const;
  const nextPlan = useQuery({
    queryKey: ["nextPlanId"],
    queryFn: () => readContract(config, { ...base, functionName: "nextPlanId" }),
    refetchInterval: 5000,
  });

  const ids = nextPlan.data ? Array.from({ length: Number(nextPlan.data) - 1 }, (_, i) => i + 1) : [];
  const plans = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["plan", id],
      queryFn: () =>
        readContract(config, { ...base, functionName: "plans", args: [BigInt(id)] }) as Promise<
          readonly [string, bigint, number, boolean]
        >,
      refetchInterval: 5000,
    })),
  });

  return { loading: nextPlan.isPending, plans: plans.map((p, i) => ({ id: ids[i], data: p.data })) };
}

export function useSubscriptions() {
  const config = useConfig();
  const base = { chainId: coston2.id, address: DRIP_SUBSCRIPTIONS, abi: subscriptionsAbi } as const;
  const nextSub = useQuery({
    queryKey: ["nextSubscriptionId"],
    queryFn: () => readContract(config, { ...base, functionName: "nextSubscriptionId" }),
    refetchInterval: 5000,
  });

  const ids = nextSub.data ? Array.from({ length: Number(nextSub.data) - 1 }, (_, i) => i + 1) : [];
  const subs = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["subscription", id],
      queryFn: () =>
        readContract(config, { ...base, functionName: "subscriptions", args: [BigInt(id)] }) as Promise<
          readonly [bigint, string, bigint, bigint, bigint, boolean]
        >,
      refetchInterval: 5000,
    })),
  });

  return { loading: nextSub.isPending, subs: subs.map((s, i) => ({ id: ids[i], data: s.data })) };
}

export type StreamData = {
  status: number;
  streamed: bigint;
  withdrawable: bigint;
  refundable: bigint;
  stream: {
    sender: string;
    startTime: number;
    endTime: number;
    isCancelable: boolean;
    wasCanceled: boolean;
    token: string;
    isDepleted: boolean;
    isTransferable: boolean;
    lockupModel: number;
    amounts: { deposited: bigint; withdrawn: bigint; refunded: bigint };
  };
  recipient: string;
};

export function useStream(streamId: bigint | undefined) {
  const config = useConfig();
  const base = { chainId: coston2.id, address: DRIP_LOCKUP, abi: lockupAbi } as const;
  return useQuery({
    queryKey: ["stream", streamId?.toString()],
    enabled: streamId !== undefined && streamId > 0n,
    queryFn: async () => {
      const [status, streamed, withdrawable, refundable, stream, recipient] = await Promise.all([
        readContract(config, { ...base, functionName: "statusOf", args: [streamId!] }) as Promise<number>,
        readContract(config, { ...base, functionName: "streamedAmountOf", args: [streamId!] }) as Promise<bigint>,
        readContract(config, { ...base, functionName: "withdrawableAmountOf", args: [streamId!] }) as Promise<bigint>,
        readContract(config, { ...base, functionName: "refundableAmountOf", args: [streamId!] }) as Promise<bigint>,
        readContract(config, { ...base, functionName: "getStream", args: [streamId!] }) as Promise<StreamData["stream"]>,
        readContract(config, { ...base, functionName: "recipientOf", args: [streamId!] }) as Promise<string>,
      ]);
      return { status, streamed, withdrawable, refundable, stream, recipient };
    },
    refetchInterval: 5000,
  });
}

export function useFxrpBalance(address: string | undefined) {
  const config = useConfig();
  return useQuery({
    queryKey: ["fxrpBal", address],
    enabled: !!address,
    queryFn: () =>
      readContract(config, {
        chainId: coston2.id,
        address: FXRP,
        abi: fxrpAbi,
        functionName: "balanceOf",
        args: [address! as `0x${string}`],
      }) as Promise<bigint>,
    refetchInterval: 5000,
  });
}

/** Total withdrawable across a set of streams (for the merchant dashboard). */
export function useTotalWithdrawable(streamIds: bigint[]) {
  const config = useConfig();
  const base = { chainId: coston2.id, address: DRIP_LOCKUP, abi: lockupAbi } as const;
  const qs = useQueries({
    queries: streamIds.map((streamId) => ({
      queryKey: ["withdrawable", streamId.toString()],
      enabled: streamId > 0n,
      queryFn: () =>
        readContract(config, { ...base, functionName: "withdrawableAmountOf", args: [streamId] }) as Promise<
          bigint
        >,
      refetchInterval: 5000,
    })),
  });
  const total = qs.reduce((acc, q) => acc + (q.data ?? 0n), 0n);
  return { total, loading: qs.some((q) => q.isPending) };
}
