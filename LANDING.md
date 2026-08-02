# LANDING.md — Landing Page Spec

Read PLAN.md and DRIP.md first. This covers the marketing/landing page
specifically — the page a stranger (or a judge) sees before they've decided
to connect a wallet. It is not the app itself.

## Problem with the current page

The page currently goes straight from a headline into "connect wallet." That
is app UX, not landing-page UX — it explains almost nothing before asking
for an action. A landing page's job is to explain what the product is and
why to trust it; the app's job is to let someone use it. Right now those two
things are merged into one screen.

## Reference point

Sablier — the closest real analog to Drip — keeps these separate on purpose:
the product lives at `app.sablier.com`, while `sablier.com` is a marketing
site organized around named use cases (vesting, payroll, airdrops, recurring
donations), not a wallet-connect prompt. Follow the same split: explain
first, let people choose to launch the app second.

## Page structure, top to bottom

1. **Hero**
   - Headline + one-line subhead (keep what exists, it's fine)
   - No wallet-connect button here. This section's only job is to say what
     Drip is in one sentence a non-crypto person could understand.

2. **How it works** (new — this is the most important missing section)
   - Three steps, visual, no jargon:
     1. Customer sends XRP
     2. It mints into FXRP and funds a stream to the merchant
     3. Merchant draws down what's accrued; customer can cancel anytime and
        get back what hasn't streamed yet
   - This should be scannable in under 10 seconds. It's the whole product
     in one glance — right now this information only exists buried in body
     text.

3. **For merchants** and **for customers** — two separate blocks, not one
   merged paragraph. Different readers care about different things:
   - **Merchants**: accept XRP subscriptions, no chargebacks, withdraw
     what's accrued at any time, no separate bridging step for the customer
   - **Customers**: pay once per cycle from XRP directly, cancel anytime,
     get back whatever hasn't streamed yet — never overpay for a cancelled
     service

4. **Trust / security block** (new — currently nothing on the page
   explains why someone should trust the contract with money)
   - Streaming logic is forked from Sablier's audited contracts, in
     production since 2019 with no incidents
   - Non-custodial: funds sit in the stream contract, not with Drip
   - Cancel-anytime, unstreamed funds always return to the customer
   - State clearly that this is a testnet (Coston2) hackathon build — don't
     imply mainnet or real funds anywhere on the page

5. **Docs** — see "Docs approach" below

6. **Launch app** — this is where "Connect Wallet" and the Merchant/
   Customer choice belong. Secondary action, appears after the explanation,
   not before it.

7. **Footer**
   - Contract addresses (already present — keep this, it's good practice
     for a Web3 product)
   - GitHub link (add this — currently missing)
   - Network/testnet disclosure

## Docs approach

Worth having, don't overbuild it. Given the timeline:
- One nav link, "How it works," that scrolls to section 2 above — covers
  most of what a visitor needs without a separate page.
- One lightweight `/docs` page — render DRIP.md's architecture section as
  a page rather than standing up a full docs site. A docs link that 404s
  or goes nowhere looks worse to a judge than not having one at all, so
  don't ship a nav item that points at nothing.

## What to avoid

- **No fake social proof.** No testimonials, no "trusted by" logos, no
  fabricated user counts. Nothing exists to back these up yet, and it would
  read as dishonest on a hackathon demo — the trust block above (real,
  verifiable: audited fork, non-custodial, cancel-anytime) does this job
  honestly instead.
- **Don't lead with the wallet connect flow.** It should not be the first
  interactive element a visitor sees.
- **Don't merge the merchant and customer value props into one sentence.**
  They're different audiences reading for different reasons; give each its
  own block.

## What "done" looks like

A visitor who has never heard of Drip should be able to read the page top
to bottom and answer, unprompted: what does this do, who is it for, why
should I trust it with money, and where do I go if I want to actually use
it. Only the last of those should require connecting a wallet.
