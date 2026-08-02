import { FXRP_DECIMALS, FXRP_VAULT_XRPL } from "./config";

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

/** Xaman payment-request deep link: recipient + amount + destination tag (tag-based FXRP direct minting, no memo needed). */
export function xamanPayLink(tag: bigint | number, amountXrp: number): string {
  return `https://xaman.app/detect/request:${FXRP_VAULT_XRPL}?amount=${amountXrp}&network=XRPL&dt=${tag}`;
}

/** Shareable subscribe link for a plan. */
export function subscribeLink(planId: bigint | number): string {
  return `${window.location.origin}/#/s/${planId}`;
}

/** Coston2 explorer page for a contract address. */
export function explorerUrl(address: string): string {
  return `https://coston2-explorer.flare.network/address/${address}`;
}
