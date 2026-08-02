# APP.md — In-App Experience Spec

Read PLAN.md, DRIP.md, REFERENCE.md, and LANDING.md first. This covers what
happens after "Launch App" — two distinct flows, merchant and customer, that
barely overlap. Design and build them separately, not as one generic shell.

## Design decision: option A — customer connects EVM wallet before paying

There were two ways to handle cancel/refund rights given the customer pays
on XRPL but the stream lives on Flare (EVM) — the two chains don't natively
know these addresses belong to the same person:

- **A (chosen)**: customer connects an EVM wallet first, in-app. That
  address becomes the designated cancel-rights holder and gets a personal
  destination tag (via `IMintingTagManager`, see REFERENCE.md). They then
  send the XRPL payment using that tag.
- **B (rejected)**: no EVM wallet at all, no self-serve cancel — auto-expiry
  only, merchant-initiated refunds. Rejected because "cancel anytime,
  trustlessly" is a headline claim on the landing page (see LANDING.md,
  "For customers" and the trust block) — shipping without self-serve cancel
  would undercut the pitch the landing page already makes.

This means the customer flow always starts with a wallet connection, same
as the merchant flow. Build one shared "connect EVM wallet" component, not
two.

## Merchant flow

1. **Connect wallet** (Coston2). This is the address streamed FXRP
   eventually lands at.
2. **First-time state**: no plans yet → prompt to create the first plan.
   Plan fields for MVP: name, price in FXRP, billing period (fixed
   monthly — no multi-tier, per DRIP.md scope).
3. **Creating a plan generates a shareable subscribe link + QR code.** This
   is the actual product surface merchants use day to day — they put this
   link on their own site or send it directly to customers. There is no
   in-Drip discovery of merchants; see "Explicitly out of scope" below.
4. **Dashboard**:
   - List of subscribers with per-subscriber accrued/withdrawable balance
   - Total withdrawable balance across all subscribers
   - Withdraw action (calls the standard Sablier `withdraw`, per DRIP.md)

## Customer flow

1. **Arrives via a merchant's specific subscribe link** — not through
   Drip's own landing page. Nothing to browse or discover; the link is the
   entry point.
2. **Sees plan details**: price, billing period, which merchant it's from.
3. **Connects EVM wallet** (Coston2) — this is the cancel-rights holder,
   per the design decision above. This step also generates their personal
   destination tag.
4. **Pays in XRP**, using a generated **Xaman deep link/QR** that pre-fills
   the destination, amount, and memo/tag — do not make the customer
   hand-type or paste a 40-character hex memo. This is the single biggest
   risk to a clean demo. Flare + Xaman already shipped this exact pattern
   for FXRP onboarding (see PLAN.md, "Landscape"), so there's working
   precedent for it — follow that pattern rather than building payment UX
   from scratch.
5. **Live status after paying** — this must update in real time, not leave
   the customer wondering if the payment landed:
   - "Payment sent" → "mint detected" → "subscription active"
   - Requires watching for the mint event on Flare and matching it to the
     subscription record by destination tag. Build this as an actual
     event listener, not a manual refresh.
6. **Cancel** — self-serve, any time, from the customer's dashboard. Calls
   the standard Sablier `cancel` (per DRIP.md); unstreamed remainder
   returns to the customer's connected wallet.

## Explicitly out of scope for this submission

- **No public merchant directory or marketplace.** Drip is a tool a
  merchant links to from their own site, not a two-sided discovery
  platform. Do not build a "browse merchants" page.
- **No email or push notifications.** In-app status only.
- **No batch withdraw across multiple subscribers**, unless it falls out of
  the Sablier fork's existing interface for free — don't build custom logic
  for this.
- **No multi-tier pricing or mid-cycle plan changes** — carried over from
  DRIP.md, applies here too since it affects both flows.

## What "done" looks like

A merchant can create a plan and get a link in under a minute. A customer
following that link can go from "never used Drip" to "subscription active"
in a handful of taps, without ever typing a hex string by hand, and can see
their subscription status update live rather than wondering if it worked.
Either side can cancel and see funds move without asking the other side for
anything.
