import { FXRP_DECIMALS } from "./config";

export function fmtFxrp(uba: bigint | undefined, digits = 2): string {
  if (uba === undefined) return "–";
  const divisor = 10n ** BigInt(FXRP_DECIMALS);
  const whole = uba / divisor;
  const frac = (uba % divisor).toString().padStart(FXRP_DECIMALS, "0").slice(0, digits);
  return `${whole.toLocaleString("en-US")}.${frac}`;
}

export function fmtSeconds(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

export function fmtClock(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(11, 19);
}

export function shortAddr(a: string | undefined): string {
  if (!a) return "–";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function fmtC2flr(wei: bigint | undefined): string {
  if (wei === undefined) return "–";
  const divisor = 10n ** 18n;
  return `${Number(wei) / Number(divisor)}`.slice(0, 8);
}
