# SUBMIT.md — Locked Scope & Submission Checklist

This is the single source of truth for what Drip must do before submission.
If anything here conflicts with PLAN.md, DRIP.md, APP.md, STATES.md,
DRIPBUG.md, MOBILEFIX.md, or APPKIT.md, **this file wins.** Everything else
is background reasoning; this is the finish line.

## What Drip is, locked

A merchant creates one subscription plan and gets a shareable link. A
customer opens that link, pays once in XRP, and that payment mints into
FXRP and streams to the merchant over the billing period. The merchant
withdraws what's accrued at any time. The customer can cancel at any time
and get back whatever hasn't streamed yet.

**Drip handles money and subscription status only.** It does not host,
deliver, or gate any product or content — same boundary as Stripe Billing.
What a merchant actually sells (a newsletter, a Discord, a service) lives
entirely outside Drip; Drip only tells them who's currently paid up.

## Already working — confirmed from screenshots, don't re-touch

- Wallet connects and shows a full, non-truncated address
- Merchant checklist: Connect Wallet → Set your price → Share your link,
  with correct step-by-step states
- Zero-state copy on both Merchant and My Subscriptions, correctly
  differentiated ("No subscribers yet" vs. "No subscriptions yet")
- My Subscriptions correctly explains customers arrive via a merchant
  link, not by browsing
- Skeleton (State 0) rendering before wallet connect
- Contracts deployed to Coston2 (per REFERENCE.md addresses)
- `/docs` page — architecture, contracts, deployment, repo link

## Remaining work, in priority order

1. **Plan name field.** Step 2 currently only captures price — add a
   required plan name (and optional one-line description), and carry it
   through to the customer's subscribe/payment page. Without this, a
   customer sees a price with no indication what they're paying for.
2. **Confirm the wallet-connect fix from APPKIT.md is actually live.**
   Either Reown AppKit embedded login is working, or at minimum the
   "Open in MetaMask" fallback link is in place. Test on an actual phone,
   not just desktop — this was the original failure mode.
3. **Run the full cycle once, end to end, and confirm each step**:
   subscribe → payment → mint detected → stream starts → merchant
   withdraws a partial amount → customer cancels → unstreamed remainder
   returns to customer. This is the entire product; it must work without
   manual intervention before anything else matters.
4. **Test renewal**: customer reuses their reserved tag to fund a second
   cycle without re-onboarding.
5. **Confirm the Sablier name is removed everywhere in user-facing copy**
   (per APPKIT.md) — check the trust block wherever it was reused, not
   just the one screen it was first caught on.
6. **Confirm the page-cut/footer whitespace fix landed** (per APPKIT.md) —
   scroll to the bottom on a real phone, not just desktop.
7. **Add a simple `isActive(subscriberAddress)` read function** to the
   subscription contract, and document it on `/docs` as the building
   block a merchant would use to wire up their own access control. This
   doesn't gate anything itself — it's the honest, minimal answer to "how
   would a merchant automate access" without overbuilding.

## Explicitly out of scope — do not build these before submission

- **No marketplace.** No listings, browsing, discovery, or general
  buy/sell-goods functionality. Evaluated and rejected — see PLAN.md-style
  reasoning: this is a much larger, historically difficult product
  category (OpenBazaar tried this exact thing for five years with real
  funding and shut down) and would replace a working, tested product with
  an unfinished, much bigger one this close to the deadline.
- **No content hosting or access-gating inside Drip.** Drip tells a
  merchant who's subscribed; it does not deliver their product. Item 7
  above is the full extent of what ships here — a read function, not a
  gating system.
- **No one-time/single-purchase payment type.** Not rejected forever, just
  not part of this submission — don't add it without an explicit decision
  to do so.
- Anything from DRIPBUG.md's own "explicitly not in scope" list
  (sample/demo data, broader wallet support beyond what APPKIT.md already
  covers) — still out.

## Submission checklist

- [ ] Item 1–7 above complete
- [ ] Full cycle (subscribe → stream → withdraw → cancel → refund) works
      live, on a phone, not just in theory
- [ ] Landing page explains the product before asking for a wallet
      connection (per LANDING.md)
- [ ] Demo narrates: who is the merchant, who is the customer, what
      happens if either side cancels mid-cycle — this is the story that
      needs to land with judges, not just working code
- [ ] `/docs` page is current and matches whatever actually shipped
