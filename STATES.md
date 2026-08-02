# STATES.md — Skeleton / Empty / Live States

Read PLAN.md, DRIP.md, REFERENCE.md, LANDING.md, APP.md, and DRIPBUG.md
first. This covers a gap DRIPBUG.md didn't: right now both Merchant and My
Subscriptions have exactly one screen doing the job of three. Split each
into three distinct states.

## Why three states, not one

A single centered "connect wallet" box on an otherwise blank page tells a
first-time visitor nothing about what the app actually does. There's a real
difference between "you haven't connected yet," "you're connected but have
no data," and "you're connected and have real data" — each needs different
copy and a different layout, not one box reused for all three.

## State 0 — Not connected: skeleton, not blank

Show the real dashboard's shape in ghost form — low-opacity/grayed-out
outline cards where live content will go — with the connect prompt sitting
over or alongside it. This is a preview, not a loading spinner: it signals
"there's a real app here" instead of "this page is empty."

- **Merchant skeleton**: a ghosted plan card, a ghosted subscriber count, a
  ghosted balance number.
- **My Subscriptions skeleton**: a ghosted list of subscription rows.

Connect prompt copy stays as already fixed in DRIPBUG.md #1 and #3 (tab-
specific copy, no raw chain-id/RPC text, one line on why a wallet is
needed).

## State 1 — Connected, zero data (first-time use)

Different from State 0 — this person is already connected, they just
haven't done anything yet. Don't reuse the "connect a wallet" copy here.

- **Merchant**: the three-step checklist from DRIPBUG.md #4 (Connect
  Wallet ✓ → Set your price → Share your link). Wallet step shows as
  already complete since they're connected.
- **My Subscriptions**: "No subscriptions yet — open a merchant's payment
  link to subscribe." Do not show a wallet-connect message here; show a
  message about the actual next action, per Stripe's empty-state
  guidance (already referenced in DRIPBUG.md #5) — explain why it's empty
  and what to do next, don't just show nothing.

## State 2 — Connected, has real data

- **Merchant**: the actual dashboard. Per plan: subscriber count,
  withdrawable balance, withdraw button. Checklist from State 1 collapses
  into the thin "Setup complete ✓" strip described in DRIPBUG.md #4.
- **My Subscriptions**: real rows — merchant name, plan price, status
  (active/streaming), cancel button per row. This is where the payment
  stepper from APP.md ("Payment sent → Mint detected → Subscription
  active") surfaces for a subscription still finalizing.

## State transitions to handle

- Not connected → connect → **zero data**: most first-time users land here
  immediately after connecting. This is the state that matters most for a
  clean demo — get it right before polishing State 2.
- Zero data → **has data**: triggered by creating a plan (merchant) or a
  mint landing against the connected wallet (customer). Don't require a
  manual refresh — this should update live, consistent with the mint-
  detection requirement already in APP.md.
- Wallet disconnects at any point → back to **State 0**, skeleton returns.

## What NOT to build

- No separate loading spinner state distinct from the skeleton — the
  skeleton *is* the loading state, don't add a second one on top of it.
- No animation beyond a simple fade between states — this is a hackathon
  build, not a polish pass.

## Worked example, for reference while building

Amaka writes a newsletter and wants to charge 5 FXRP/month for it.

1. She connects her wallet on Drip (State 0 → State 1), sets up one plan —
   "Amaka's Newsletter, 5 FXRP/month" — and gets a link + QR code (State 1
   → State 2 on her side).
2. She puts that link where she'd normally put a Patreon link.
3. Tunde, a reader who already holds XRP, opens it, connects a wallet (so
   he can cancel later), and sends one XRP payment from his phone wallet —
   no bridging or swapping himself.
4. That payment streams into Amaka's plan over the month. Tunde's My
   Subscriptions view moves from State 1 to State 2 the moment the mint is
   detected.
5. Amaka can withdraw whatever's accrued any day, without waiting for the
   full month.
6. If Tunde cancels on day 10, he automatically gets back the 20 days'
   worth Amaka hadn't earned yet — no asking Amaka for a refund.
7. Next month, Tunde reuses the same reserved slot to renew — no
   re-onboarding.

Neither Amaka nor Tunde ever touches XRPL mechanics or a "yield vault"
directly — that's the whole product.
