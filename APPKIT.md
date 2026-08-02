# APPKIT.md — Wallet Layer Upgrade + Remaining Fixes

Read PLAN.md, DRIP.md, REFERENCE.md, LANDING.md, APP.md, DRIPBUG.md, and
MOBILEFIX.md first. This supersedes MOBILEFIX.md #1 (the wagmi + RainbowKit
recommendation) with a stronger option, and closes out two smaller issues
found in the same review round.

## Why RainbowKit's deep link isn't enough

The MetaMask "dead end" isn't a bug in this build specifically — it's a
known limitation of how RainbowKit/WalletConnect talk to MetaMask from a
regular mobile browser (not already inside MetaMask's own in-app browser).
A fallback link helps, but only for someone who already has MetaMask
installed. Drip's actual target customer, per PLAN.md and APP.md, is
plausibly someone who holds XRP and has never installed an EVM wallet app
at all. Patching the deep link doesn't solve that; it just makes the
existing path slightly less broken.

## Primary recommendation: swap to Reown AppKit with embedded login

Reown (the company behind the WalletConnect protocol) ships AppKit with
built-in email/social login:
- Each login creates a wallet behind the scenes — no seed phrase, no app
  install required on the customer's end.
- Deployed as a Smart Account alongside the first transaction; a
  precalculated address is usable before that deployment.
- Users can export keys and move to self-custody later if they want to —
  this isn't locking anyone out of a real wallet, it's removing the
  requirement to start with one.
- Sits on top of `wagmi`, same as RainbowKit, so the underlying contract-
  interaction code (mint detection, stream creation, cancel/withdraw calls)
  should not need to change — this is a swap of the connection layer, not
  a rebuild of the app.
- Traditional wallet connections (MetaMask, Rainbow, etc. via WalletConnect
  QR) remain available in the same modal — this is additive for merchants
  and technical users who already have a wallet, not a replacement that
  removes their option.

**This is the right fix, not just the easy one** — it directly matches the
"no crypto jargon, no wallet setup required" promise already made on the
landing page and in APP.md's customer flow, rather than working around a
limitation of the previous approach.

**Effort note**: bigger than the RainbowKit swap, but not a rebuild —
different SDK for the connection modal, same wagmi core underneath. Given
the timeline, do this now rather than as a stretch goal; it fixes both the
dead-end bug and the onboarding-friction problem in one move.

## Fallback, only if time runs out

If AppKit's integration turns out to eat too much of the remaining time,
fall back to the smaller fix instead of leaving the dead end as-is:
- Keep wagmi + RainbowKit as already speced in MOBILEFIX.md.
- Add an explicit, visible **"Open in MetaMask"** link/button next to
  Connect Wallet — a `https://metamask.app.link/dapp/yourdomain.com` link
  that opens the dApp inside MetaMask's own in-app browser, where the
  injected connector works reliably (same as desktop).
- This only helps people who already have MetaMask installed — worse
  coverage than AppKit, but far better than the current dead end, and
  cheap to add.

## Fix: page-cut / footer whitespace (still unresolved)

The previous fix (MOBILEFIX.md #2) moved the footer directly under the
content, but the whitespace didn't go away — it moved to below the footer
instead. Root cause: something in the page wrapper is still forcing a tall
minimum height (e.g. `min-h-screen` or similar), likely paired with a flex
column that has a spacer or `justify-between` pushing elements apart.

**Fix**: remove the forced minimum height entirely. The page should size to
its actual content and end exactly where the footer ends, regardless of
screen height. No library needed — this is a straight CSS/layout deletion,
not a new feature.

## Fix: remove Sablier from consumer-facing copy

The trust block currently names Sablier directly. Drop the name — it's
implementation detail for developers (already documented in DRIP.md,
REFERENCE.md, and the `/docs` page), not something an end user needs.
Replace with the same substance, no attribution:

> "Non-custodial — funds sit in the contract, not with Drip. Cancel
> anytime, get back what hasn't streamed yet."

Apply this everywhere the old copy appears — the empty-state trust block
(STATES.md / MOBILEFIX.md) and anywhere else it may have been reused.

## What "done" looks like

A customer with no wallet app installed can open a merchant's link, log in
with email or Google, and pay — no app store detour, no seed phrase, no
dead end. A merchant or technical user with an existing wallet can still
connect it the same way as before. The page never leaves unexplained
whitespace above or below the footer. Nothing on screen mentions Sablier.
